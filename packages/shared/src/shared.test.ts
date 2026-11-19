import { describe, expect, it } from 'vitest'
import {
  allocateDiscount, canTransition, discountPercent, errorCode, estimateSubtotal, formatMoney, inclusiveTax,
  isTerminal, nextStatuses, ORDER_STATUSES, permissionsForRoles, roundMoney, sizeRank, slugify, sortSizes, unitPrice,
} from './index'

describe('unitPrice (mirrors public.variant_unit_price)', () => {
  it('uses the product price when the variant has no override', () => {
    expect(unitPrice({ productPrice: 100 })).toEqual({ unitPrice: 100, compareAt: null })
  })
  it('applies a product sale when lower than the base price', () => {
    expect(unitPrice({ productPrice: 100, productSale: 80 })).toEqual({ unitPrice: 80, compareAt: 100 })
  })
  it('ignores a "sale" that is not lower than the base', () => {
    expect(unitPrice({ productPrice: 100, productSale: 120 })).toEqual({ unitPrice: 100, compareAt: null })
  })
  it('lets a variant price override the product price and its sale', () => {
    expect(unitPrice({ productPrice: 100, productSale: 80, variantPrice: 110 })).toEqual({ unitPrice: 110, compareAt: null })
  })
  it('applies a variant sale against the variant price', () => {
    expect(unitPrice({ productPrice: 100, variantPrice: 110, variantSale: 90 })).toEqual({ unitPrice: 90, compareAt: 110 })
  })
})

describe('cart calculations', () => {
  it('rounds money half-up without float drift', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
  })
  it('estimates a subtotal from lines', () => {
    expect(estimateSubtotal([{ price: 65, quantity: 3 }, { price: 19.99, quantity: 2 }])).toBe(234.98)
  })
  it('computes the inclusive VAT portion', () => {
    expect(inclusiveTax(1730, 0.05)).toBe(82.38) // matches compute_quote for the same basket
    expect(inclusiveTax(100, 0)).toBe(0)
  })
  it('reports a discount percentage only for genuine markdowns', () => {
    expect(discountPercent(75, 100)).toBe(25)
    expect(discountPercent(100, 100)).toBeNull()
    expect(discountPercent(100, null)).toBeNull()
  })
})

describe('allocateDiscount', () => {
  it('splits proportionally and always sums to the discount', () => {
    const parts = allocateDiscount([100, 200, 33.33], 50)
    expect(parts.reduce((a, b) => roundMoney(a + b), 0)).toBe(50)
    expect(parts[0]).toBe(15)
  })
  it('returns zeros when nothing is eligible', () => {
    expect(allocateDiscount([0, 0], 10)).toEqual([0, 0])
  })
})

describe('order status transitions', () => {
  it('allows the forward fulfilment path', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true)
    expect(canTransition('confirmed', 'processing')).toBe(true)
    expect(canTransition('processing', 'shipped')).toBe(true)
    expect(canTransition('shipped', 'delivered')).toBe(true)
    expect(canTransition('delivered', 'returned')).toBe(true)
  })
  it('blocks skipping steps and reviving terminal orders', () => {
    expect(canTransition('pending', 'shipped')).toBe(false)
    expect(canTransition('shipped', 'cancelled')).toBe(false)
    expect(canTransition('cancelled', 'pending')).toBe(false)
    expect(isTerminal('cancelled')).toBe(true)
    expect(isTerminal('returned')).toBe(true)
  })
  it('has no self-transitions', () => {
    for (const s of ORDER_STATUSES) expect(nextStatuses(s)).not.toContain(s)
  })
})

describe('formatting', () => {
  it('formats Iraqi dinars in both languages', () => {
    expect(formatMoney(765000, 'IQD', 'en')).toBe('IQD 765,000')
    expect(formatMoney(765000, 'IQD', 'ar')).toBe('765,000 د.ع')
    expect(formatMoney(5000)).toBe('IQD 5,000')
  })
  it('formats whole and fractional money', () => {
    expect(formatMoney(590, 'USD', 'en')).toBe('$590')
    expect(formatMoney(82.38, 'USD', 'en')).toBe('$82.38')
  })
  it('uses Latin digits for Arabic so prices stay legible', () => {
    expect(formatMoney(590, 'USD', 'ar')).toBe('$590')
  })
  it('orders sizes naturally', () => {
    expect(sortSizes(['XL', 'S', 'M', 'XS'])).toEqual(['XS', 'S', 'M', 'XL'])
    expect(sortSizes(['32', '28', '30'])).toEqual(['28', '30', '32'])
    expect(sizeRank('One Size')).toBeGreaterThan(sizeRank('XXL'))
  })
  it('slugifies', () => {
    expect(slugify('Belted Wool Coat — Camel')).toBe('belted-wool-coat-camel')
  })
})

describe('permissions', () => {
  it('gives store managers everything except staff management', () => {
    const p = permissionsForRoles(['store_manager'])
    expect(p.has('orders.write')).toBe(true)
    expect(p.has('staff.manage')).toBe(false)
  })
  it('keeps inventory managers out of order writes', () => {
    const p = permissionsForRoles(['inventory_manager'])
    expect(p.has('inventory.write')).toBe(true)
    expect(p.has('orders.write')).toBe(false)
  })
})

describe('errorCode', () => {
  it('extracts known codes from database messages', () => {
    expect(errorCode('CART_INVALID')).toBe('CART_INVALID')
    expect(errorCode('VALIDATION: email')).toBe('VALIDATION')
    expect(errorCode('some random failure')).toBe('UNKNOWN')
  })
})
