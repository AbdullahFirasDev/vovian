import type { Locale } from '@vovian/types'

/**
 * Maps machine error codes raised by database functions / edge functions to
 * human messages. Codes come from `raise exception '<CODE>...'` in SQL.
 */
const MESSAGES: Record<string, { en: string; ar: string }> = {
  CART_EMPTY: { en: 'Your bag is empty.', ar: 'حقيبتك فارغة.' },
  CART_INVALID: {
    en: 'Some items in your bag are no longer available in the quantity requested. We have updated your bag.',
    ar: 'بعض القطع في حقيبتك لم تعد متوفرة بالكمية المطلوبة. قمنا بتحديث حقيبتك.',
  },
  DISCOUNT_INVALID: { en: 'This code can no longer be applied. Remove it to continue.', ar: 'لم يعد بالإمكان تطبيق هذا الرمز. أزله للمتابعة.' },
  SHIPPING_UNAVAILABLE: { en: 'Choose a delivery method for this country.', ar: 'اختر طريقة توصيل لهذه الدولة.' },
  PAYMENT_METHOD_UNAVAILABLE: { en: 'That payment method is not available. Choose another.', ar: 'وسيلة الدفع هذه غير متاحة. اختر وسيلة أخرى.' },
  RATE_LIMITED: { en: 'Too many attempts. Wait a minute and try again.', ar: 'محاولات كثيرة. انتظر دقيقة ثم حاول مجدداً.' },
  VALIDATION: { en: 'Check the highlighted fields and try again.', ar: 'تحقق من الحقول المحددة وحاول مجدداً.' },
  ORDER_NOT_CANCELLABLE: { en: 'This order is already being prepared and can no longer be cancelled online.', ar: 'بدأ تجهيز هذا الطلب ولا يمكن إلغاؤه عبر الموقع.' },
  FORBIDDEN: { en: 'You do not have permission to do that.', ar: 'ليست لديك صلاحية لهذا الإجراء.' },
  NETWORK: { en: 'We could not reach the store. Check your connection and try again.', ar: 'تعذر الاتصال بالمتجر. تحقق من اتصالك وحاول مجدداً.' },
  UNKNOWN: { en: 'Something went wrong on our side. Try again in a moment.', ar: 'حدث خطأ من جانبنا. حاول مجدداً بعد قليل.' },
}

export const DISCOUNT_REASON_MESSAGES: Record<string, { en: string; ar: string }> = {
  not_found: { en: 'We do not recognise that code.', ar: 'لا نتعرف على هذا الرمز.' },
  not_started: { en: 'This code is not active yet.', ar: 'هذا الرمز غير مفعّل بعد.' },
  expired: { en: 'This code has expired.', ar: 'انتهت صلاحية هذا الرمز.' },
  usage_limit: { en: 'This code has reached its limit.', ar: 'وصل هذا الرمز إلى حد الاستخدام.' },
  customer_limit: { en: 'You have already used this code.', ar: 'لقد استخدمت هذا الرمز من قبل.' },
  min_order: { en: 'Spend a little more to use this code.', ar: 'أضف المزيد لاستخدام هذا الرمز.' },
  not_applicable: { en: 'This code does not apply to the items in your bag.', ar: 'هذا الرمز لا ينطبق على القطع في حقيبتك.' },
}

/** Extract a known error code from a Postgres/edge error message ("CART_INVALID", "VALIDATION: email" …). */
export function errorCode(message: string | null | undefined): string {
  if (!message) return 'UNKNOWN'
  const match = message.match(/^([A-Z_]{4,})/)
  const code = match?.[1]
  return code && code in MESSAGES ? code : 'UNKNOWN'
}

export function errorMessage(codeOrMessage: string | null | undefined, locale: Locale = 'en'): string {
  const code = errorCode(codeOrMessage)
  return MESSAGES[code]![locale]
}
