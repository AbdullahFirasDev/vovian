import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkoutPayloadSchema, discountSchema, normalizeIraqPhone, productSchema, savedAddressSchema, trackOrderSchema } from './index'

const valid = {
  idempotency_key: 'a1b2c3d4e5f6g7h8i9j0',
  full_name: 'زهراء الهاشمي',
  email: ' Zahraa@Example.com ',
  phone: '0770 123 4567',
  phone_secondary: '',
  shipping_address: { governorate: 'Baghdad', area: 'المنصور', landmark: 'قرب جامع أم الطبول' },
  shipping_method_id: '0b1f5f3e-8a5d-4c1e-9b8e-2f9d6c3a1b7e',
  payment_method: 'cod',
  items: [{ variant_id: '9d0f5f3e-8a5d-4c1e-9b8e-2f9d6c3a1b7e', quantity: 2 }],
}

describe('normalizeIraqPhone', () => {
  it('accepts every common way Iraqis write a mobile number', () => {
    for (const v of ['07701234567', '0770 123 4567', '770-123-4567', '+964 770 123 4567', '009647701234567', '٠٧٧٠١٢٣٤٥٦٧']) {
      expect(normalizeIraqPhone(v)).toBe('+9647701234567')
    }
  })
  it('rejects landlines, short numbers and foreign numbers', () => {
    expect(normalizeIraqPhone('0612345678')).toBeNull()
    expect(normalizeIraqPhone('077012345')).toBeNull()
    expect(normalizeIraqPhone('+971501234567')).toBeNull()
  })
})

describe('checkoutPayloadSchema', () => {
  it('normalises email, phone and governorate', () => {
    const r = checkoutPayloadSchema.parse(valid)
    expect(r.email).toBe('zahraa@example.com')
    expect(r.phone).toBe('+9647701234567')
    expect(r.phone_secondary).toBeNull()
    expect(r.shipping_address.governorate).toBe('baghdad')
    expect(r.locale).toBe('en')
  })
  it('requires area and nearest landmark', () => {
    expect(checkoutPayloadSchema.safeParse({ ...valid, shipping_address: { ...valid.shipping_address, landmark: '' } }).success).toBe(false)
    expect(checkoutPayloadSchema.safeParse({ ...valid, shipping_address: { ...valid.shipping_address, area: '' } }).success).toBe(false)
  })
  it('accepts an optional backup phone but not a duplicate of the main one', () => {
    expect(checkoutPayloadSchema.parse({ ...valid, phone_secondary: '0780 123 4567' }).phone_secondary).toBe('+9647801234567')
    const dup = checkoutPayloadSchema.safeParse({ ...valid, phone_secondary: '+964 770 123 4567' })
    expect(dup.success).toBe(false)
    expect(dup.error?.issues[0]?.message).toBe('validation.phoneSame')
  })
  it('rejects an empty cart', () => {
    const r = checkoutPayloadSchema.safeParse({ ...valid, items: [] })
    expect(r.success).toBe(false)
  })
  it('rejects quantities over 20 and unknown payment methods', () => {
    expect(checkoutPayloadSchema.safeParse({ ...valid, items: [{ ...valid.items[0], quantity: 21 }] }).success).toBe(false)
    expect(checkoutPayloadSchema.safeParse({ ...valid, payment_method: 'free' }).success).toBe(false)
  })
  it('ignores client-supplied prices entirely', () => {
    const r = checkoutPayloadSchema.parse({ ...valid, total: 1, items: [{ ...valid.items[0], price: 0.01 }] })
    expect('total' in r).toBe(false)
    expect('price' in r.items[0]!).toBe(false)
  })
  it('accepts well-formed ids without RFC 4122 version bits (deterministic seed ids)', () => {
    const r = checkoutPayloadSchema.safeParse({ ...valid, items: [{ variant_id: '311a24db-7d0a-efed-ac65-e90f6197cb6c', quantity: 1 }] })
    expect(r.success).toBe(true)
    expect(checkoutPayloadSchema.safeParse({ ...valid, items: [{ variant_id: 'not-a-uuid', quantity: 1 }] }).success).toBe(false)
  })
  it('rejects malformed phones', () => {
    expect(checkoutPayloadSchema.safeParse({ ...valid, phone: 'call me' }).success).toBe(false)
  })
})

describe('admin schemas', () => {
  const product = {
    name: 'Belted Wool Coat', slug: 'belted-wool-coat', style_code: 'VW-OW-0701', department: 'women',
    category_id: null, price: 590, sale_price: '', status: 'active', size_guide: 'apparel',
    is_featured: false, is_new_arrival: false, is_best_seller: false,
  }
  it('accepts a product and coerces an empty sale price to null', () => {
    expect(productSchema.parse(product).sale_price).toBeNull()
  })
  it('rejects a sale price above the price', () => {
    expect(productSchema.safeParse({ ...product, sale_price: 600 }).success).toBe(false)
  })
  it('validates discount rules', () => {
    const base = { code: 'welcome10', type: 'percentage', value: 10, scope: 'all', min_order_value: '', usage_limit: '', usage_limit_per_customer: '', starts_at: '', expires_at: '', is_active: true }
    expect(discountSchema.parse(base).code).toBe('WELCOME10')
    expect(discountSchema.safeParse({ ...base, value: 150 }).success).toBe(false)
    expect(discountSchema.safeParse({ ...base, scope: 'categories' }).success).toBe(false)
  })
  it('tracks orders by email or Iraqi phone', () => {
    expect(trackOrderSchema.safeParse({ order_number: 'vv100245', contact: 'a@b.co' }).success).toBe(true)
    expect(trackOrderSchema.safeParse({ order_number: 'VV100245', contact: '0770 123 4567' }).success).toBe(true)
    expect(trackOrderSchema.safeParse({ order_number: 'VV100245', contact: 'nope' }).success).toBe(false)
    expect(trackOrderSchema.safeParse({ order_number: '12345', contact: 'a@b.co' }).success).toBe(false)
  })
  it('validates saved addresses', () => {
    const a = { full_name: 'علي الموسوي', phone: '07801112223', governorate: 'basra', area: 'العشار', landmark: 'قرب الكورنيش' }
    expect(savedAddressSchema.parse(a).phone).toBe('+9647801112223')
    expect(savedAddressSchema.safeParse({ ...a, phone_secondary: '07801112223' }).success).toBe(false)
  })
})

describe('edge function schema copy', () => {
  it('is identical to the canonical checkout schema', () => {
    const canonical = readFileSync(fileURLToPath(new URL('./checkout.ts', import.meta.url)), 'utf8')
    const copy = readFileSync(
      fileURLToPath(new URL('../../../supabase/functions/_shared/validation/checkout.ts', import.meta.url)),
      'utf8',
    )
    expect(copy.replace(/^\/\/ GENERATED.*\n/, '')).toBe(canonical)
  })
})
