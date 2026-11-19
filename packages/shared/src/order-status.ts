import type { OrderStatus, PaymentStatus } from '@vovian/types'

/**
 * Allowed order status transitions.
 * MUST mirror public.order_transition_allowed() in
 * supabase/migrations/20261116000700_commerce_functions.sql — the database is
 * the enforcer; this copy drives the admin UI. A pgTAP test asserts parity.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned',
]

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from]
}

export function isTerminal(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0
}

/** Customer-facing progress steps (cancelled/returned are shown separately). */
export const FULFILMENT_STEPS: readonly OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export function fulfilmentProgress(status: OrderStatus): number {
  const i = FULFILMENT_STEPS.indexOf(status)
  return i === -1 ? -1 : i
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  processing: { en: 'Processing', ar: 'قيد التجهيز' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  returned: { en: 'Returned', ar: 'مُرتجع' },
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { en: string; ar: string }> = {
  unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
  pending_confirmation: { en: 'Awaiting confirmation', ar: 'بانتظار التأكيد' },
  paid: { en: 'Paid', ar: 'مدفوع' },
  partially_refunded: { en: 'Partially refunded', ar: 'مسترد جزئياً' },
  refunded: { en: 'Refunded', ar: 'مسترد' },
  failed: { en: 'Failed', ar: 'فشل' },
}
