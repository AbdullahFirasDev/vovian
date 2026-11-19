import { formatMoney, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@vovian/shared'
import type { OrderStatus, PaymentStatus } from '@vovian/types'

// Store currency (loaded from settings at sign-in; IQD by default).
let storeCurrency = 'IQD'
export const setCurrency = (code: string | null | undefined) => { if (code) storeCurrency = code }
export const currency = () => storeCurrency
export const money = (n: number | null | undefined, cur?: string) => formatMoney(n == null ? null : Number(n), cur ?? storeCurrency, 'en')

export interface IraqiAddress { governorate?: string; governorate_name?: string; governorate_name_ar?: string | null; area?: string; landmark?: string }
/** "Baghdad · Al-Mansour" — governorate name falls back to the code. */
export const placeLine = (a: IraqiAddress | null | undefined) => (a ? [a.governorate_name ?? a.governorate, a.area].filter(Boolean).join(' · ') : '')

/** Lets staff search with the number as customers say it (0770…) — stored as +9647…. */
export function phoneSearchTerm(term: string): string {
  const digits = term.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s()-]/g, '')
  const m = digits.match(/^(?:\+964|00964|0)?(7\d{2,9})$/)
  return m ? m[1]! : term
}
export const date = (v: string | null | undefined, withTime = false) =>
  v ? new Intl.DateTimeFormat('en-GB', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(v)) : '—'
export const num = (n: number | null | undefined) => new Intl.NumberFormat('en-US').format(Number(n ?? 0))
export const orderStatus = (s: OrderStatus) => ORDER_STATUS_LABELS[s]?.en ?? s
export const paymentStatus = (s: PaymentStatus) => PAYMENT_STATUS_LABELS[s]?.en ?? s

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** RFC 4180 CSV with formula-injection protection for spreadsheet apps. */
export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\r\n')
}

export function download(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿', content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
