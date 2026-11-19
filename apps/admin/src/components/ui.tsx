import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router'

// ── Button ──────────────────────────────────────────────────────────────────
type Variant = 'solid' | 'outline' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  solid: 'bg-ink text-white border border-ink hover:bg-night/85',
  outline: 'bg-white text-ink border border-ink hover:bg-ink hover:text-white',
  ghost: 'bg-transparent text-ink border border-transparent hover:border-mist',
  danger: 'bg-white text-error border border-error hover:bg-error hover:text-white',
}

export function Button({ variant = 'solid', size = 'md', loading, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-[14px]'} ${variants[variant]} ${className}`}
    >
      {loading && <span className="size-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'solid', size = 'md', children, className = '' }: { to: string; variant?: Variant; size?: 'sm' | 'md'; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors ${size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-[14px]'} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}

// ── Form fields ─────────────────────────────────────────────────────────────
interface FieldShell { label: string; hint?: string; error?: string | null; className?: string; required?: boolean }

function Shell({ id, label, hint, error, className = '', required, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-graphite">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[12px] text-graphite">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-[12px] text-error">{error}</p>}
    </div>
  )
}

export function TextField({ label, hint, error, className, required, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <input id={id} required={required} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className="field" {...rest} />
    </Shell>
  )
}

export function TextArea({ label, hint, error, className, required, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <textarea id={id} required={required} aria-invalid={!!error || undefined} className="field min-h-24 resize-y" {...rest} />
    </Shell>
  )
}

export function SelectField({ label, hint, error, className, required, options, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const id = useId()
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className} required={required}>
      <select id={id} required={required} aria-invalid={!!error || undefined} className="field cursor-pointer" {...rest}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  )
}

export function Checkbox({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[14px]">
      <input type="checkbox" className="mt-0.5 size-4 cursor-pointer accent-black" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="block text-[12px] text-graphite">{hint}</span>}
      </span>
    </label>
  )
}

// ── Layout bits ─────────────────────────────────────────────────────────────
export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-mist pb-6">
      <div className="min-w-0">
        {back && <Link to={back.to} className="mb-3 inline-block text-[13px] text-graphite hover:text-ink">← {back.label}</Link>}
        <h1 className="font-display text-[34px] leading-tight">{title}</h1>
        {description && <div className="mt-1.5 text-[14px] text-graphite">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Section({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="border border-mist">
      <header className="flex items-center justify-between gap-4 border-b border-mist px-5 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="text-[12px] text-graphite">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

const toneClass: Record<string, string> = {
  neutral: 'border-mist text-graphite',
  dark: 'border-ink bg-ink text-white',
  outline: 'border-ink text-ink',
  error: 'border-error text-error',
  ok: 'border-ok text-ok',
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof toneClass }) {
  return <span className={`inline-flex h-6 items-center whitespace-nowrap border px-2 text-[12px] ${toneClass[tone]}`}>{children}</span>
}

export function orderTone(status: string): keyof typeof toneClass {
  return ({ pending: 'outline', confirmed: 'neutral', processing: 'neutral', shipped: 'neutral', delivered: 'dark', cancelled: 'error', returned: 'error' } as Record<string, keyof typeof toneClass>)[status] ?? 'neutral'
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      {body && <p className="mt-2 max-w-sm text-graphite">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-graphite" role="status">
      <span className="size-4 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />
      {label}…
    </div>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  return <p role="alert" className="border border-error p-3 text-[13px] text-error">{error instanceof Error ? error.message : String(error)}</p>
}

// ── Dialogs ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-3xl' : 'max-w-lg'} border border-ink p-0 backdrop:bg-ink/40`}
      aria-label={title}
    >
      {open && (
        <div>
          <header className="flex items-center justify-between border-b border-mist px-6 py-4">
            <h2 className="font-display text-2xl">{title}</h2>
            <button type="button" onClick={onClose} className="grid size-9 cursor-pointer place-items-center text-xl" aria-label="Close">×</button>
          </header>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}

interface ConfirmState { message: string; resolve: (ok: boolean) => void; danger?: boolean; confirmLabel?: string }
interface Toast { id: number; message: string; tone: 'ok' | 'error' }
const FeedbackContext = createContext<{ toast: (m: string, tone?: 'ok' | 'error') => void; confirm: (m: string, opts?: { danger?: boolean; confirmLabel?: string }) => Promise<boolean> } | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirm] = useState<ConfirmState | null>(null)
  const toast = useCallback((message: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  const confirm = useCallback((message: string, opts?: { danger?: boolean; confirmLabel?: string }) =>
    new Promise<boolean>((resolve) => setConfirm({ message, resolve, ...opts })), [])
  const close = (ok: boolean) => {
    confirmState?.resolve(ok)
    setConfirm(null)
  }
  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 end-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto px-4 py-3 text-[14px] text-white ${t.tone === 'error' ? 'bg-error' : 'bg-ink'}`}>{t.message}</div>
        ))}
      </div>
      <Modal open={!!confirmState} onClose={() => close(false)} title="Please confirm">
        <p className="text-[15px]">{confirmState?.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button variant={confirmState?.danger ? 'danger' : 'solid'} onClick={() => close(true)}>{confirmState?.confirmLabel ?? 'Confirm'}</Button>
        </div>
      </Modal>
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback outside provider')
  return ctx
}

// ── Data table ──────────────────────────────────────────────────────────────
export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: 'start' | 'end'
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, caption, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void; caption: string; empty?: ReactNode }) {
  if (!rows.length) return <>{empty ?? <Empty title="Nothing here yet" />}</>
  return (
    <div className="overflow-x-auto border border-mist">
      <table className="w-full min-w-[640px] border-collapse text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-mist bg-paper text-[12px] text-graphite">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-4 py-2.5 font-medium ${c.align === 'end' ? 'text-end' : 'text-start'} ${c.className ?? ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`border-b border-mist last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-paper' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${c.align === 'end' ? 'text-end num' : ''} ${c.className ?? ''}`}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  return (
    <div className="mt-4 flex items-center justify-between text-[13px] text-graphite">
      <span className="num">{total ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}` : '0 results'}</span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

export function Thumb({ src, alt = '', size = 40 }: { src?: string | null; alt?: string; size?: number }) {
  const url = src && src.includes('images.unsplash.com') ? `${src}${src.includes('?') ? '&' : '?'}w=${size * 2}&h=${Math.round(size * 2.5)}&fit=crop&auto=format` : src
  return url ? <img src={url} alt={alt} width={size} height={Math.round(size * 1.25)} className="shrink-0 bg-paper object-cover" style={{ width: size, height: Math.round(size * 1.25) }} loading="lazy" /> : <span className="block shrink-0 bg-paper" style={{ width: size, height: Math.round(size * 1.25) }} />
}
