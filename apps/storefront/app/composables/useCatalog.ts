import type { CatalogFilters, CatalogResult, CatalogSort, ProductCard, ProductDetail } from '@vovian/types'

const LIST_KEYS = ['colors', 'sizes', 'categories'] as const
const BOOL_KEYS = ['in_stock', 'on_sale'] as const
const SORTS: CatalogSort[] = ['featured', 'newest', 'price_asc', 'price_desc', 'best_selling']

/** Serialises filters ⇄ URL query so every filtered view is linkable and SSR-able. */
export function filtersFromQuery(query: Record<string, unknown>): Partial<CatalogFilters> {
  const f: Partial<CatalogFilters> = {}
  const str = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined
  for (const k of LIST_KEYS) {
    const v = str(query[k])
    if (v) (f as Record<string, unknown>)[k] = v.split(',').filter(Boolean)
  }
  for (const k of BOOL_KEYS) if (str(query[k]) === '1') (f as Record<string, unknown>)[k] = true
  const min = Number(str(query.min)), max = Number(str(query.max))
  if (Number.isFinite(min) && str(query.min)) f.min_price = min
  if (Number.isFinite(max) && str(query.max)) f.max_price = max
  const sort = str(query.sort) as CatalogSort | undefined
  if (sort && SORTS.includes(sort)) f.sort = sort
  const page = Number(str(query.page))
  if (page > 1) f.page = page
  const q = str(query.q)
  if (q) f.q = q.slice(0, 80)
  return f
}

export function queryFromFilters(f: Partial<CatalogFilters>): Record<string, string> {
  const q: Record<string, string> = {}
  for (const k of LIST_KEYS) {
    const v = f[k]
    if (v?.length) q[k] = v.join(',')
  }
  for (const k of BOOL_KEYS) if (f[k]) q[k] = '1'
  if (f.min_price != null) q.min = String(f.min_price)
  if (f.max_price != null) q.max = String(f.max_price)
  if (f.sort && f.sort !== 'featured') q.sort = f.sort
  if (f.page && f.page > 1) q.page = String(f.page)
  if (f.q) q.q = f.q
  return q
}

export function useCatalogApi() {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  return {
    async search(filters: CatalogFilters): Promise<CatalogResult> {
      const { data, error } = await supabase.rpc('search_catalog', { p_filters: { ...filters, locale: locale.value } })
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      return data as unknown as CatalogResult
    },
    async product(slug: string): Promise<ProductDetail | null> {
      const { data, error } = await supabase.rpc('get_product', { p_slug: slug, p_locale: locale.value })
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      return (data as unknown as ProductDetail) ?? null
    },
    async cards(ids: string[]): Promise<ProductCard[]> {
      if (!ids.length) return []
      const { data, error } = await supabase.rpc('product_cards', { p_ids: ids, p_locale: locale.value })
      if (error) return []
      return (data as unknown as ProductCard[]) ?? []
    },
    async suggestions(q: string) {
      const { data } = await supabase.rpc('search_suggestions', { p_query: q, p_locale: locale.value, p_limit: 6 })
      return (data as unknown as { products: ProductCard[]; categories: { slug: string; department: string; name: string }[] }) ?? {
        products: [],
        categories: [],
      }
    },
  }
}
