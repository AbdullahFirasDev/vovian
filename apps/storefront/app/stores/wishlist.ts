import { defineStore } from 'pinia'

const STORAGE_KEY = 'vovian:wishlist:v1'

export const useWishlistStore = defineStore('wishlist', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const ids = ref<string[]>([])
  const hydrated = ref(false)

  const count = computed(() => ids.value.length)
  const has = (productId: string) => ids.value.includes(productId)

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value)) } catch { /* ignore */ }
  }

  function hydrate() {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      ids.value = raw ? (JSON.parse(raw) as string[]).filter((v) => typeof v === 'string').slice(0, 200) : []
    } catch { ids.value = [] }
    hydrated.value = true
  }

  async function wishlistId(): Promise<string | null> {
    if (!user.value) return null
    const uid = user.value.sub as string
    const { data } = await supabase.from('wishlists').select('id').eq('user_id', uid).maybeSingle()
    if (data?.id) return data.id
    const { data: created } = await supabase.from('wishlists').insert({ user_id: uid }).select('id').single()
    return created?.id ?? null
  }

  async function toggle(productId: string): Promise<boolean> {
    hydrate()
    const adding = !has(productId)
    ids.value = adding ? [productId, ...ids.value] : ids.value.filter((id) => id !== productId)
    persist()
    const wid = await wishlistId()
    if (wid) {
      if (adding) await supabase.from('wishlist_items').upsert({ wishlist_id: wid, product_id: productId }, { onConflict: 'wishlist_id,product_id' })
      else await supabase.from('wishlist_items').delete().eq('wishlist_id', wid).eq('product_id', productId)
    }
    return adding
  }

  /** On sign-in: union of the guest list and the account list. */
  async function mergeWithServer() {
    hydrate()
    const wid = await wishlistId()
    if (!wid) return
    if (ids.value.length) {
      await supabase.from('wishlist_items').upsert(
        ids.value.map((product_id) => ({ wishlist_id: wid, product_id })),
        { onConflict: 'wishlist_id,product_id', ignoreDuplicates: true },
      )
    }
    const { data } = await supabase.from('wishlist_items').select('product_id, created_at').eq('wishlist_id', wid).order('created_at', { ascending: false })
    ids.value = (data ?? []).map((r) => r.product_id)
    persist()
  }

  function resetLocal() {
    ids.value = []
    persist()
  }

  return { ids, count, has, hydrate, toggle, mergeWithServer, resetLocal }
})
