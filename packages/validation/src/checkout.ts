// Canonical checkout validation. Used by the storefront (client-side feedback)
// and copied verbatim into supabase/functions/_shared/validation/checkout.ts
// (server-side enforcement) by `npm run sync:functions`. A unit test fails if
// the two copies drift. Messages are i18n keys resolved by each app.
import { z } from 'zod'

// ── Iraqi phone numbers ────────────────────────────────────────────────────
// Customers type 0770…, 770…, +964 770…, 00964 770…, with spaces or dashes,
// sometimes in Arabic-Indic digits. All normalise to +9647XXXXXXXXX.
// Mirrors public.normalize_iq_phone() in the database.
const DIGITS: Record<string, string> = {}
;['٠١٢٣٤٥٦٧٨٩', '۰۱۲۳۴۵۶۷۸۹'].forEach((set) => [...set].forEach((d, i) => (DIGITS[d] = String(i))))

export function normalizeIraqPhone(input: string | null | undefined): string | null {
  if (!input) return null
  const latin = input.replace(/[٠-٩۰-۹]/g, (d) => DIGITS[d] ?? d)
  const compact = latin.replace(/[\s().-]/g, '')
  const match = compact.match(/^(?:\+964|00964|0)?(7\d{9})$/)
  return match ? `+964${match[1]}` : null
}

export const iraqPhoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizeIraqPhone(v) !== null, 'validation.phone')
  .transform((v) => normalizeIraqPhone(v)!)

export const optionalIraqPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((v) => !v || normalizeIraqPhone(v) !== null, 'validation.phone')
  .transform((v) => (v ? normalizeIraqPhone(v) : null))

// ── Contact + delivery ────────────────────────────────────────────────────
export const contactSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.name').max(120, 'validation.tooLong'),
  email: z.string().trim().toLowerCase().max(254, 'validation.tooLong').pipe(z.email('validation.email')),
})

/** Iraqi delivery address: governorate, area / neighbourhood, nearest landmark. */
export const addressSchema = z.object({
  governorate: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'validation.governorate'),
  area: z.string().trim().min(2, 'validation.area').max(120, 'validation.tooLong'),
  landmark: z.string().trim().min(3, 'validation.landmark').max(200, 'validation.tooLong'),
})

export const deliveryPhonesSchema = z
  .object({ phone: iraqPhoneSchema, phone_secondary: optionalIraqPhoneSchema })
  .refine((v) => !v.phone_secondary || v.phone_secondary !== v.phone, { path: ['phone_secondary'], message: 'validation.phoneSame' })

export const paymentMethodSchema = z.enum(['cod', 'manual', 'card'], { message: 'validation.payment' })

// IDs use z.guid(): any well-formed UUID. Postgres accepts non-RFC-4122 UUIDs
// (e.g. deterministic seed ids), so strict version checks would reject real rows.
export const cartItemSchema = z.object({
  variant_id: z.guid('validation.item'),
  quantity: z.number().int().min(1, 'validation.quantity').max(20, 'validation.quantity'),
})

export const checkoutPayloadSchema = contactSchema
  .extend({
    idempotency_key: z.string().min(16).max(100),
    phone: iraqPhoneSchema,
    phone_secondary: optionalIraqPhoneSchema,
    shipping_address: addressSchema,
    delivery_instructions: z.string().trim().max(500, 'validation.tooLong').optional().or(z.literal('')),
    shipping_method_id: z.guid('validation.shipping'),
    payment_method: paymentMethodSchema,
    discount_code: z.string().trim().max(40).optional().nullable(),
    items: z.array(cartItemSchema).min(1, 'validation.cartEmpty').max(50),
    locale: z.enum(['en', 'ar']).default('en'),
    marketing_opt_in: z.boolean().optional(),
  })
  .refine((v) => !v.phone_secondary || v.phone_secondary !== v.phone, { path: ['phone_secondary'], message: 'validation.phoneSame' })

export type ContactInput = z.infer<typeof contactSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>
