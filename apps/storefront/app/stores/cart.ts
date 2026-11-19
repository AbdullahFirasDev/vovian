import { defineStore } from 'pinia'
import type { Quote, QuoteLine } from '@vovian/types'
import { estimateSubtotal } from '@vovian/shared'

export interface CartLine {
  variant_id: string
  quantity: number
  // Display snapshot only — refreshed from the server quote; never sent to checkout.
  product_id?: string | null
  slug?: string | null
  name?: string | null
  image?: string | null
  color?: string | null
  size?: string | null
  price?: number | null
  compare_at?: number | null
  available?: number
  status?: QuoteLine['status']
}

const STORAGE_KEY = 'vovian:cart:v1'
const MAX_QTY = 20

export const useCartStore = defineStore('cart', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  // Stores can be created from plugins, outside component setup, so read the
  // active locale from the i18n instance rather than useI18n().
  const nuxtApp = useNuxtApp()
  const locale = computed(() => (nuxtApp.$i18n as { locale: { value: string } }).locale.value)

  const lines = ref<CartLine[]>([])
  const discountCode = ref<string | null>(null)
  const quote = ref<Quote | null>(null)
  const quoting = ref(false)
  const hydrated = ref(false)
  const lastAdded = ref<CartLine | null>(null)
  const quoteContext = ref<{ governorate?: string | null; shippingMethodId?: string | null; email?: string | null }>({})

  const count = computed(() => lines.value.reduce((n, l) => n + l.quantity, 0))
  const isEmpty = computed(() => lines.value.length === 0)
  const estimatedSubtotal = computed(() =>
    estimateSubtotal(lines.value.filter((l) => l.price != null).map((l) => ({ price: l.price!, quantity: l.quantity }))),
  )
  const hasIssues = computed(() => (quote.value?.issues?.length ?? 0) > 0)

  // ── persistence ────────────────────────────────────────────────────────
  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: lines.value, discountCode: discountCode.value }))
    } catch { /* storage unavailable */ }
  }

  function hydrate() {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { lines?: CartLine[]; discountCode?: string | null }
        lines.value = (parsed.lines ?? []).filter((l) => typeof l.variant_id === 'string' && l.quantity > 0).slice(0, 50)
        discountCode.value = parsed.discountCode ?? null
      }
    } catch { /* corrupted storage — start empty */ }
    hydrated.value = true
  }

  // ── server sync for signed-in customers ────────────────────────────────
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleSync() {
    if (!user.value) return
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(syncToServer, 600)
  }

  async function ensureCartId(): Promise<string | null> {
    if (!user.value) return null
    const uid = user.value.sub as string
    const { data } = await supabase.from('carts').select('id').eq('user_id', uid).maybeSingle()
    if (data?.id) return data.id
    const { data: created } = await supabase.from('carts').insert({ user_id: uid }).select('id').single()
    return created?.id ?? null
  }

  async function syncToServer() {
    const cartId = await ensureCartId()
    if (!cartId) return
    const ids = lines.value.map((l) => l.variant_id)
    if (lines.value.length) {
      await supabase.from('cart_items').upsert(
        lines.value.map((l) => ({ cart_id: cartId, variant_id: l.variant_id, quantity: l.quantity })),
        { onConflict: 'cart_id,variant_id' },
      )
    }
    let del = supabase.from('cart_items').delete().eq('cart_id', cartId)
    if (ids.length) del = del.not('variant_id', 'in', `(${ids.join(',')})`)
    await del
  }

  /** On sign-in: merge the guest bag into the account bag, then adopt the merged result. */
  async function mergeWithServer() {
    hydrate()
    if (!user.value) return
    if (lines.value.length) {
      await supabase.rpc('merge_cart', { p_items: lines.value.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })) })
    }
    const cartId = await ensureCartId()
    if (!cartId) return
    const { data } = await supabase.from('cart_items').select('variant_id, quantity').eq('cart_id', cartId).order('created_at')
    lines.value = (data ?? []).map((r) => ({ variant_id: r.variant_id, quantity: r.quantity }))
    persist()
    await refreshQuote()
  }

  function resetLocal() {
    lines.value = []
    discountCode.value = null
    quote.value = null
    persist()
  }

  // ── mutations ──────────────────────────────────────────────────────────
  function add(line: CartLine) {
    hydrate()
    const existing = lines.value.find((l) => l.variant_id === line.variant_id)
    const cap = Math.min(MAX_QTY, line.available ?? MAX_QTY)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + line.quantity, cap)
      Object.assign(existing, { ...line, quantity: existing.quantity })
    } else {
      lines.value.unshift({ ...line, quantity: Math.min(line.quantity, cap) })
    }
    lastAdded.value = line
    persist()
    scheduleSync()
    refreshQuoteSoon()
  }

  function setQuantity(variantId: string, quantity: number) {
    const line = lines.value.find((l) => l.variant_id === variantId)
    if (!line) return
    if (quantity <= 0) return remove(variantId)
    line.quantity = Math.min(quantity, MAX_QTY, line.available && line.available > 0 ? line.available : MAX_QTY)
    persist()
    scheduleSync()
    refreshQuoteSoon()
  }

  function remove(variantId: string) {
    lines.value = lines.value.filter((l) => l.variant_id !== variantId)
    persist()
    scheduleSync()
    refreshQuoteSoon()
  }

  /** Swap size/colour on a line (keeps quantity, merges if the target already exists). */
  function replaceVariant(oldId: string, next: CartLine) {
    const old = lines.value.find((l) => l.variant_id === oldId)
    if (!old) return
    const quantity = old.quantity
    lines.value = lines.value.filter((l) => l.variant_id !== oldId)
    add({ ...next, quantity })
  }

  function clear() {
    resetLocal()
    scheduleSync()
  }

  // ── authoritative server quote ─────────────────────────────────────────
  let quoteTimer: ReturnType<typeof setTimeout> | null = null
  function refreshQuoteSoon() {
    if (quoteTimer) clearTimeout(quoteTimer)
    quoteTimer = setTimeout(() => refreshQuote(), 250)
  }

  async function refreshQuote(ctx?: { governorate?: string | null; shippingMethodId?: string | null; email?: string | null }) {
    if (ctx) quoteContext.value = { ...quoteContext.value, ...ctx }
    if (!lines.value.length) {
      quote.value = null
      return null
    }
    quoting.value = true
    const { data, error } = await supabase.rpc('quote_cart', {
      p_items: lines.value.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
      p_discount_code: discountCode.value ?? undefined,
      p_shipping_method_id: quoteContext.value.shippingMethodId ?? undefined,
      p_governorate: quoteContext.value.governorate ?? undefined,
      p_email: quoteContext.value.email ?? undefined,
      p_locale: locale.value,
    })
    quoting.value = false
    if (error) return null
    quote.value = data as unknown as Quote

    // Refresh display snapshots from the server (prices, names, stock).
    for (const q of quote.value.lines) {
      const line = lines.value.find((l) => l.variant_id === q.variant_id)
      if (!line) continue
      Object.assign(line, {
        product_id: q.product_id, slug: q.slug, name: q.name, image: q.image_url, color: q.color, size: q.size,
        price: q.unit_price, compare_at: q.compare_at, available: q.available, status: q.status,
      })
    }
    persist()
    return quote.value
  }

  async function applyDiscount(code: string) {
    discountCode.value = code.trim().toUpperCase() || null
    const q = await refreshQuote()
    const valid = q?.discount?.valid === true
    if (!valid) {
      const reason = q?.discount?.reason
      discountCode.value = null
      persist()
      await refreshQuote()
      return { ok: false as const, reason }
    }
    persist()
    return { ok: true as const }
  }

  function removeDiscount() {
    discountCode.value = null
    persist()
    refreshQuote()
  }

  /** Drop or clamp lines the server says can't be fulfilled. */
  function resolveIssues() {
    for (const issue of quote.value?.issues ?? []) {
      if (issue.available > 0) setQuantity(issue.variant_id, issue.available)
      else remove(issue.variant_id)
    }
  }

  return {
    lines, discountCode, quote, quoting, hydrated, lastAdded, count, isEmpty, estimatedSubtotal, hasIssues,
    hydrate, add, setQuantity, remove, replaceVariant, clear, resetLocal, refreshQuote, refreshQuoteSoon,
    applyDiscount, removeDiscount, resolveIssues, mergeWithServer,
  }
})
