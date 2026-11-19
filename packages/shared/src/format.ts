import type { Locale } from '@vovian/types'

const intlLocale = (locale: Locale) => (locale === 'ar' ? 'ar-AE' : 'en-US')

const moneyCache = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number | null | undefined, currency = 'IQD', locale: Locale = 'en'): string {
  if (amount == null || Number.isNaN(amount)) return ''
  // Iraqi dinar: whole dinars, grouped with commas; "IQD 85,000" / "85,000 د.ع".
  if (currency === 'IQD') {
    const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Number(amount)))
    return locale === 'ar' ? `${n} د.ع` : `IQD ${n}`
  }
  const whole = Number.isInteger(Number(amount))
  const key = `${locale}:${currency}:${whole}`
  let fmt = moneyCache.get(key)
  if (!fmt) {
    // Prices use the en-US pattern ("$890") in every language: Arabic shoppers
    // read Latin-digit prices, and the UI isolates them with <bdi> in RTL.
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
      numberingSystem: 'latn',
    })
    moneyCache.set(key, fmt)
  }
  return fmt.format(Number(amount))
}

export function formatDate(value: string | Date, locale: Locale = 'en', opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(intlLocale(locale), { ...opts, numberingSystem: 'latn' }).format(d)
}

export function formatNumber(value: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(intlLocale(locale), { numberingSystem: 'latn' }).format(value)
}

/** Pick a translated field from a `translations` jsonb object, falling back to the base value. */
export function localized<T extends Record<string, unknown>>(
  base: T,
  field: keyof T & string,
  locale: Locale,
): string {
  const translations = (base as { translations?: Record<string, Record<string, string>> }).translations
  return translations?.[locale]?.[field] ?? (base[field] as string) ?? ''
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SIZE_ORDER: Record<string, number> = { XXS: 10, XS: 20, S: 30, M: 40, L: 50, XL: 60, XXL: 70, '3XL': 80, 'ONE SIZE': 900 }

/** Mirrors public.size_rank(). */
export function sizeRank(size: string | null | undefined): number {
  if (!size) return 950
  const known = SIZE_ORDER[size.toUpperCase()]
  if (known !== undefined) return known
  return /^\d+(\.\d+)?$/.test(size) ? 100 + Math.round(Number(size) * 2) : 950
}

export function sortSizes<T extends string>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b))
}
