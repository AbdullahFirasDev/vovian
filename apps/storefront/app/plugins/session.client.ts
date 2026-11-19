/**
 * Client session wiring: restores the local bag and wishlist, and merges them
 * with the customer's account when they sign in. On sign-out the local copies
 * are cleared so the next person on a shared device starts fresh.
 */
export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const cart = useCartStore()
  const wishlist = useWishlistStore()

  cart.hydrate()
  wishlist.hydrate()
  if (cart.lines.length) cart.refreshQuoteSoon()

  let previous: string | null = null
  watch(
    () => user.value?.sub as string | undefined,
    async (id) => {
      if (id && id !== previous) {
        await Promise.all([cart.mergeWithServer(), wishlist.mergeWithServer()])
      } else if (!id && previous) {
        cart.resetLocal()
        wishlist.resetLocal()
      }
      previous = id ?? null
    },
    { immediate: true },
  )
})
