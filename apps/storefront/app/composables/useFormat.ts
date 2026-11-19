import type { Locale } from '@vovian/types'
import { formatDate, formatMoney, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, errorMessage, DISCOUNT_REASON_MESSAGES } from '@vovian/shared'

/** Locale-aware formatting bound to the active language and store currency. */
export function useFormat() {
  const { locale } = useI18n()
  const { currency } = useStoreConfig()
  const loc = computed(() => locale.value as Locale)

  return {
    money: (amount: number | null | undefined, cur?: string) => formatMoney(amount, cur ?? currency.value, loc.value),
    date: (value: string | Date, opts?: Intl.DateTimeFormatOptions) => formatDate(value, loc.value, opts),
    orderStatus: (s: keyof typeof ORDER_STATUS_LABELS) => ORDER_STATUS_LABELS[s]?.[loc.value] ?? s,
    paymentStatus: (s: keyof typeof PAYMENT_STATUS_LABELS) => PAYMENT_STATUS_LABELS[s]?.[loc.value] ?? s,
    error: (codeOrMessage: string | null | undefined) => errorMessage(codeOrMessage, loc.value),
    discountReason: (reason?: string) => (reason ? DISCOUNT_REASON_MESSAGES[reason]?.[loc.value] : undefined) ?? '',
    tr: <T extends { label?: string; translations?: Partial<Record<string, { label?: string }>> }>(item: T) =>
      item.translations?.[loc.value]?.label ?? item.label ?? '',
  }
}
