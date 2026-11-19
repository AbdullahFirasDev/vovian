/** Protects customer account pages. Authorization is still enforced by RLS. */
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    const localePath = useLocalePath()
    return navigateTo(localePath({ path: '/login', query: { redirect: to.fullPath } }))
  }
})
