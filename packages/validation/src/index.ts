import { z } from 'zod'
import { addressSchema, iraqPhoneSchema, normalizeIraqPhone, optionalIraqPhoneSchema } from './checkout'

export * from './checkout'

// ── Accounts ───────────────────────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(10, 'validation.passwordLength')
  .max(72, 'validation.tooLong')
  .regex(/[A-Za-z]/, 'validation.passwordLetter')
  .regex(/[0-9]/, 'validation.passwordNumber')

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('validation.email')),
  password: z.string().min(1, 'validation.required'),
})

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.name').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('validation.email')),
  password: passwordSchema,
  marketing_opt_in: z.boolean().default(false),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.name').max(120),
  phone: optionalIraqPhoneSchema,
  locale: z.enum(['en', 'ar']),
  marketing_opt_in: z.boolean(),
})

export const savedAddressSchema = addressSchema
  .extend({
    label: z.string().trim().max(40).optional().or(z.literal('')),
    full_name: z.string().trim().min(2, 'validation.name').max(120),
    phone: iraqPhoneSchema,
    phone_secondary: optionalIraqPhoneSchema,
    is_default: z.boolean().default(false),
  })
  .refine((v) => !v.phone_secondary || v.phone_secondary !== v.phone, { path: ['phone_secondary'], message: 'validation.phoneSame' })

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, 'validation.name').max(120),
  email: z.string().trim().toLowerCase().pipe(z.email('validation.email')),
  order_number: z.string().trim().max(20).optional().or(z.literal('')),
  topic: z.enum(['general', 'order', 'sizing', 'returns', 'repairs', 'press']),
  message: z.string().trim().min(10, 'validation.messageLength').max(5000, 'validation.tooLong'),
})

/** Track an order with its number and the email OR phone used at checkout. */
export const trackOrderSchema = z.object({
  order_number: z.string().trim().toUpperCase().regex(/^VV\d{6,}$/, 'validation.orderNumber'),
  contact: z
    .string()
    .trim()
    .refine((v) => z.email().safeParse(v.toLowerCase()).success || normalizeIraqPhone(v) !== null, 'validation.emailOrPhone'),
})

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('validation.email')),
})

// ── Admin ──────────────────────────────────────────────────────────────────
const slug = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')
const money = z.coerce.number().min(0, 'Must be 0 or more').max(1_000_000)
const optionalMoney = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : v), money.nullable())

export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug,
    style_code: z.string().trim().min(2).max(40),
    department: z.enum(['women', 'men', 'unisex']),
    category_id: z.guid().nullable(),
    price: money,
    sale_price: optionalMoney,
    status: z.enum(['draft', 'active', 'archived']),
    description: z.string().trim().max(5000).optional().default(''),
    material: z.string().trim().max(300).optional().default(''),
    care: z.string().trim().max(500).optional().default(''),
    fit: z.string().trim().max(300).optional().default(''),
    details: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
    size_guide: z.enum(['apparel', 'denim', 'shoes', 'none']),
    is_featured: z.boolean(),
    is_new_arrival: z.boolean(),
    is_best_seller: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
    seo_title: z.string().trim().max(70).optional().default(''),
    seo_description: z.string().trim().max(160).optional().default(''),
    translations: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  })
  .refine((p) => p.sale_price === null || p.sale_price < p.price, {
    path: ['sale_price'],
    message: 'Sale price must be lower than the price',
  })

export const variantSchema = z.object({
  id: z.guid().optional(),
  sku: z.string().trim().min(3).max(60).regex(/^[A-Z0-9-]+$/, 'Uppercase letters, numbers and hyphens'),
  color: z.string().trim().max(40).nullable(),
  size: z.string().trim().max(20).nullable(),
  price: optionalMoney,
  sale_price: optionalMoney,
  is_active: z.boolean(),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  department: z.enum(['women', 'men', 'unisex']),
  parent_id: z.guid().nullable(),
  description: z.string().trim().max(1000).optional().default(''),
  image_url: z.string().url().nullable().or(z.literal('')),
  position: z.coerce.number().int().min(0),
  is_active: z.boolean(),
  translations: z.record(z.string(), z.record(z.string(), z.string())).default({}),
})

export const discountSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9_-]+$/, 'Letters, numbers, - and _ only'),
    description: z.string().trim().max(200).optional().default(''),
    type: z.enum(['percentage', 'fixed', 'free_shipping']),
    value: z.coerce.number().min(0),
    scope: z.enum(['all', 'products', 'categories']),
    product_ids: z.array(z.guid()).default([]),
    category_ids: z.array(z.guid()).default([]),
    min_order_value: optionalMoney,
    usage_limit: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().int().positive().nullable()),
    usage_limit_per_customer: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().int().positive().nullable()),
    starts_at: z.string().nullable().or(z.literal('')),
    expires_at: z.string().nullable().or(z.literal('')),
    is_active: z.boolean(),
  })
  .refine((d) => d.type !== 'percentage' || (d.value > 0 && d.value <= 100), { path: ['value'], message: 'Percentage must be between 1 and 100' })
  .refine((d) => d.type !== 'fixed' || d.value > 0, { path: ['value'], message: 'Enter an amount' })
  .refine((d) => d.scope !== 'products' || d.product_ids.length > 0, { path: ['product_ids'], message: 'Choose at least one product' })
  .refine((d) => d.scope !== 'categories' || d.category_ids.length > 0, { path: ['category_ids'], message: 'Choose at least one category' })
  .refine((d) => !d.starts_at || !d.expires_at || new Date(d.expires_at) > new Date(d.starts_at), {
    path: ['expires_at'],
    message: 'Must be after the start date',
  })

export type ProductInput = z.infer<typeof productSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type DiscountInput = z.infer<typeof discountSchema>
export type SavedAddressInput = z.infer<typeof savedAddressSchema>
export type ContactMessageInput = z.infer<typeof contactMessageSchema>
