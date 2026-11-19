// Domain types shared by the storefront, admin and edge functions.
// Database row types are generated: `npm run db:types` → ./database.ts
export type { Database, Json } from './database'
import type { Database } from './database'

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

export type Locale = 'en' | 'ar'
export type Department = Enums<'department'>
export type OrderStatus = Enums<'order_status'>
export type PaymentStatus = Enums<'payment_status'>
export type AppRole = Enums<'app_role'>
export type DiscountType = Enums<'discount_type'>

// ── Catalog read models (shapes returned by SQL functions) ─────────────────
export interface ProductImage {
  id?: string
  url: string
  alt: string
  color: string | null
  width?: number | null
  height?: number | null
  variant_ids?: string[]
}

export interface ColorSwatch {
  value: string
  hex: string | null
  label: string
}

export interface CardVariant {
  id: string
  color: string | null
  size: string | null
  available: number
}

export interface ProductCard {
  id: string
  slug: string
  name: string
  department: Department
  category: { slug: string; name: string; department: Department } | null
  price: number
  compare_at: number | null
  is_new: boolean
  is_best_seller: boolean
  in_stock: boolean
  images: ProductImage[]
  colors: ColorSwatch[]
  variants: CardVariant[]
}

export interface ProductVariant {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number
  compare_at: number | null
  available: number
  low_stock: boolean
}

export interface ProductOption {
  kind: 'color' | 'size' | 'other'
  value: string
  hex: string | null
  label: string
}

export interface ProductReview {
  author: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
}

export interface ProductDetail {
  id: string
  slug: string
  style_code: string
  name: string
  description: string | null
  material: string | null
  care: string | null
  fit: string | null
  details: string[]
  brand: string
  department: Department
  size_guide: 'apparel' | 'denim' | 'shoes' | 'none'
  price: number
  sale_price: number | null
  is_new: boolean
  is_best_seller: boolean
  seo_title: string | null
  seo_description: string | null
  category: { id: string; slug: string; name: string; department: Department } | null
  collections: { slug: string; name: string }[]
  images: ProductImage[]
  options: ProductOption[]
  variants: ProductVariant[]
  rating: { average: number | null; count: number }
  reviews: ProductReview[]
  related: ProductCard[]
}

export interface CatalogFilters {
  department?: Department
  category?: string
  categories?: string[]
  collection?: string
  q?: string
  colors?: string[]
  sizes?: string[]
  min_price?: number
  max_price?: number
  in_stock?: boolean
  on_sale?: boolean
  new_arrivals?: boolean
  best_sellers?: boolean
  sort?: CatalogSort
  page?: number
  per_page?: number
  locale?: Locale
}

export type CatalogSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling'

export interface CatalogResult {
  items: ProductCard[]
  total: number
  page: number
  per_page: number
  facets: {
    colors: { value: string; hex: string | null; count: number }[]
    sizes: { value: string; count: number }[]
    categories: { slug: string; name: string; count: number }[]
    price: { min: number; max: number }
  }
}

// ── Commerce read models ───────────────────────────────────────────────────
export type QuoteLineStatus = 'ok' | 'unavailable' | 'sold_out' | 'insufficient_stock'

export interface QuoteLine {
  variant_id: string
  product_id: string | null
  slug: string | null
  name: string | null
  sku: string | null
  color: string | null
  size: string | null
  image_url: string | null
  quantity: number
  available: number
  unit_price: number | null
  compare_at: number | null
  line_total: number
  discount_amount: number
  status: QuoteLineStatus
}

export interface ShippingOption {
  id: string
  code: string
  name: string
  description: string | null
  min_days: number
  max_days: number
  rate: number
  free_over: number | null
  price: number
}

export type DiscountReason =
  | 'not_found' | 'not_started' | 'expired' | 'usage_limit' | 'customer_limit' | 'min_order' | 'not_applicable'

export interface QuoteDiscount {
  id?: string
  code: string
  valid: boolean
  reason?: DiscountReason
  type?: DiscountType
  value?: number
  amount?: number
  free_shipping?: boolean
  min_order_value?: number
}

export interface Quote {
  currency: string
  governorate: string | null
  lines: QuoteLine[]
  issues: { variant_id: string; code: QuoteLineStatus; available: number }[]
  item_count: number
  subtotal: number
  discount: QuoteDiscount | null
  discount_total: number
  shipping_methods: ShippingOption[]
  shipping_method: ShippingOption | null
  shipping_total: number
  tax_rate: number
  tax_label: string
  tax_inclusive: boolean
  tax_total: number
  total: number
}

export interface CustomerOrder {
  id: string
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string
  currency: string
  subtotal: number
  discount_total: number
  discount_code: string | null
  shipping_total: number
  tax_total: number
  tax_inclusive: boolean
  total: number
  shipping_method_name: string
  tracking_number: string | null
  tracking_url: string | null
  created_at: string
  customer_name: string
  email?: string | null
  phone?: string | null
  phone_secondary?: string | null
  shipping_address: IraqiAddressSnapshot
  delivery_instructions?: string | null
  items: {
    product_name: string
    sku: string
    color: string | null
    size: string | null
    image_url: string | null
    unit_price: number
    quantity: number
    line_total: number
    product_slug: string | null
  }[]
  history: { status: OrderStatus; at: string }[]
  can_cancel: boolean
}

export interface PlaceOrderResult {
  order_id: string
  order_number: string
  access_token: string
  total: number
  currency: string
  payment_method?: string
  payment_instructions?: string | null
  duplicate: boolean
}

/** Address snapshot stored on orders (Iraq: governorate, area, nearest landmark). */
export interface IraqiAddressSnapshot {
  country?: 'IQ'
  governorate: string
  governorate_name?: string
  governorate_name_ar?: string | null
  area?: string
  landmark?: string
}

export interface Governorate {
  code: string
  name: string
  region: 'federal' | 'kurdistan'
}

// ── Content ────────────────────────────────────────────────────────────────
export interface MenuItem {
  label: string
  href: string
  mega?: 'women' | 'men' | 'collections'
  image?: string
  image_caption?: string
  image_href?: string
  translations?: Partial<Record<Locale, { label?: string }>>
  children?: MenuItem[]
}

export interface PaymentMethodSetting {
  code: string
  enabled: boolean
  label: string
  description?: string
  instructions?: string
  provider?: string
  translations?: Partial<Record<Locale, { label?: string; description?: string; instructions?: string }>>
}
