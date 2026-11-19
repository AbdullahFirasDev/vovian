/**
 * Display-side pricing helpers. These mirror public.variant_unit_price() so the
 * storefront can show prices before a server quote returns. They are NEVER used
 * to charge: every total is recomputed by private.compute_quote() on the server.
 */
export interface PriceInputs {
  productPrice: number
  productSale?: number | null
  variantPrice?: number | null
  variantSale?: number | null
}

export interface UnitPrice {
  unitPrice: number
  compareAt: number | null
}

export function unitPrice({ productPrice, productSale, variantPrice, variantSale }: PriceInputs): UnitPrice {
  const base = variantPrice ?? productPrice
  const sale = variantSale ?? (variantPrice == null ? productSale ?? null : null)
  if (sale != null && sale < base) return { unitPrice: sale, compareAt: base }
  return { unitPrice: base, compareAt: null }
}

/** Round half-up to cents, avoiding binary float drift (1.005 → 1.01). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function lineTotal(price: number, quantity: number): number {
  return roundMoney(price * quantity)
}

export interface DisplayLine {
  price: number
  quantity: number
}

/** Optimistic subtotal for the mini-cart while the authoritative quote loads. */
export function estimateSubtotal(lines: DisplayLine[]): number {
  return roundMoney(lines.reduce((sum, l) => sum + lineTotal(l.price, l.quantity), 0))
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round((1 - price / compareAt) * 100)
}

/** Inclusive tax portion contained in a gross amount (e.g. VAT-inclusive prices). */
export function inclusiveTax(gross: number, rate: number): number {
  if (rate <= 0) return 0
  return roundMoney(gross - gross / (1 + rate))
}

/**
 * Allocate a discount across eligible line totals proportionally, with the last
 * line absorbing rounding so the parts always sum exactly to the discount.
 * Mirrors the allocation inside private.compute_quote().
 */
export function allocateDiscount(lineTotals: number[], discount: number): number[] {
  const eligible = lineTotals.reduce((a, b) => a + b, 0)
  if (eligible <= 0 || discount <= 0) return lineTotals.map(() => 0)
  let allocated = 0
  return lineTotals.map((total, i) => {
    if (i === lineTotals.length - 1) return roundMoney(discount - allocated)
    const share = roundMoney((discount * total) / eligible)
    allocated = roundMoney(allocated + share)
    return share
  })
}
