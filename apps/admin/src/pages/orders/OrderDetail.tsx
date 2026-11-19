import { nextStatuses } from '@vovian/shared'
import type { OrderStatus } from '@vovian/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Button, Checkbox, ErrorNote, LinkButton, Modal, PageHeader, Section, SelectField, Spinner, TextArea, TextField, Thumb, orderTone, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { date, money, orderStatus, paymentStatus, placeLine } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: 'Mark pending', confirmed: 'Confirm order', processing: 'Start processing', shipped: 'Mark shipped',
  delivered: 'Mark delivered', cancelled: 'Cancel order', returned: 'Mark returned',
}

export default function OrderDetail() {
  const { id } = useParams()
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [transition, setTransition] = useState<OrderStatus | null>(null)
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payment, setPayment] = useState({ status: 'paid', amount: '', reference: '' })
  const [tracking, setTracking] = useState<{ number: string; url: string } | null>(null)
  const [internalNote, setInternalNote] = useState('')

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => unwrap(await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*), payments(*), order_notes(*)')
      .eq('id', id!)
      .single()) as any,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['order', id] })
    qc.invalidateQueries({ queryKey: ['orders'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const changeStatus = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('admin_update_order_status', { p_order_id: id!, p_status: transition!, p_note: note || null, p_customer_visible: notify })),
    onSuccess: () => { toast(`Order ${orderStatus(transition!).toLowerCase()}`); setTransition(null); setNote(''); refresh() },
    onError: (e) => toast(e.message.replace(/^INVALID_TRANSITION:\s*/, 'Not allowed: '), 'error'),
  })

  const recordPayment = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('admin_record_payment', { p_order_id: id!, p_status: payment.status, p_amount: Number(payment.amount), p_reference: payment.reference || null })),
    onSuccess: () => { toast('Payment recorded'); setPaymentOpen(false); refresh() },
    onError: (e) => toast(e.message.replace(/^VALIDATION:\s*/, ''), 'error'),
  })

  const saveTracking = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('admin_update_order_tracking', { p_order_id: id!, p_tracking_number: tracking!.number, p_tracking_url: tracking!.url || null })),
    onSuccess: () => { toast('Tracking saved'); setTracking(null); refresh() },
    onError: (e) => toast(e.message.replace(/^VALIDATION:\s*/, ''), 'error'),
  })

  const addNote = useMutation({
    mutationFn: async () => {
      const { data: s } = await supabase.auth.getSession()
      unwrap(await supabase.from('order_notes').insert({ order_id: id!, body: internalNote.trim(), author_id: s.session!.user.id }))
    },
    onSuccess: () => { setInternalNote(''); refresh() },
    onError: (e) => toast(e.message, 'error'),
  })

  if (isLoading) return <Spinner />
  if (error || !order) return <ErrorNote error={error ?? 'Order not found'} />

  const next = nextStatuses(order.status)
  const addr = order.shipping_address
  const history = [...order.order_status_history].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
  const notes = [...order.order_notes].sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))

  return (
    <div>
      <PageHeader
        title={`Order ${order.order_number}`}
        back={{ to: '/orders', label: 'Orders' }}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={orderTone(order.status)}>{orderStatus(order.status)}</Badge><Badge>{paymentStatus(order.payment_status)}</Badge> Placed {date(order.created_at, true)}</span>}
        actions={
          <>
            <LinkButton to={`/orders/${order.id}/invoice`} variant="outline">Print invoice</LinkButton>
            {can('orders.write') && next.map((s) => (
              <Button key={s} variant={s === 'cancelled' || s === 'returned' ? 'danger' : 'solid'} onClick={() => { setTransition(s); setNotify(true) }}>{ACTION_LABEL[s]}</Button>
            ))}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid content-start gap-6 xl:col-span-2">
          <Section title="Items">
            <ul className="divide-y divide-mist">
              {order.order_items.map((i: any) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <Thumb src={i.image_url} size={40} />
                  <div className="min-w-0 flex-1">
                    {i.product_id ? <Link to={`/products/${i.product_id}`} className="font-medium hover:underline">{i.product_name}</Link> : <span className="font-medium">{i.product_name}</span>}
                    <p className="text-[12px] text-graphite">{[i.color, i.size].filter(Boolean).join(' / ')} · <span className="font-mono">{i.sku}</span></p>
                  </div>
                  <span className="text-[13px] text-graphite num">{money(i.unit_price, order.currency)} × {i.quantity}</span>
                  <span className="w-24 text-end num">{money(i.line_total, order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ms-auto grid max-w-xs gap-1.5 border-t border-mist pt-4 text-[14px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="num">{money(order.subtotal, order.currency)}</dd></div>
              {order.discount_total > 0 && <div className="flex justify-between"><dt>Discount ({order.discount_code})</dt><dd className="num">−{money(order.discount_total, order.currency)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery · {order.shipping_method_name}</dt><dd className="num">{money(order.shipping_total, order.currency)}</dd></div>
              <div className="flex justify-between text-graphite"><dt>Tax {order.tax_inclusive ? '(included)' : ''}</dt><dd className="num">{money(order.tax_total, order.currency)}</dd></div>
              <div className="flex justify-between border-t border-ink pt-2 font-semibold"><dt>Total</dt><dd className="num">{money(order.total, order.currency)}</dd></div>
            </dl>
          </Section>

          <Section title="Timeline">
            <ol className="grid gap-3">
              {history.map((h: any) => (
                <li key={h.id} className="flex gap-4 text-[14px]">
                  <span className="w-40 shrink-0 text-graphite">{date(h.created_at, true)}</span>
                  <span>
                    <span className="font-medium">{orderStatus(h.to_status)}</span>
                    {h.note && <span className="block text-graphite">{h.note}</span>}
                    {!h.is_customer_visible && <span className="block text-[12px] text-graphite">Internal only</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Internal notes" description="Visible to staff only.">
            {can('orders.write') && (
              <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (internalNote.trim()) addNote.mutate() }}>
                <input className="field" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Called customer, confirmed address…" aria-label="New note" maxLength={4000} />
                <Button type="submit" variant="outline" loading={addNote.isPending}>Add</Button>
              </form>
            )}
            <ul className="grid gap-3">
              {notes.map((n: any) => <li key={n.id} className="border-s-2 border-ink ps-3 text-[14px]">{n.body}<span className="block text-[12px] text-graphite">{date(n.created_at, true)}</span></li>)}
              {!notes.length && <li className="text-graphite">No notes yet.</li>}
            </ul>
          </Section>
        </div>

        <div className="grid content-start gap-6">
          <Section title="Customer">
            <p className="font-medium">{order.customer_name}</p>
            <p><a href={`mailto:${order.email}`} className="underline underline-offset-2">{order.email}</a></p>
            <p dir="ltr" className="text-start"><a href={`tel:${order.phone}`}>{order.phone}</a></p>
            {order.phone_secondary && <p dir="ltr" className="text-start text-graphite">Backup: <a href={`tel:${order.phone_secondary}`}>{order.phone_secondary}</a></p>}
            {order.user_id ? <Link to={`/customers/${order.user_id}`} className="mt-2 inline-block text-[13px] underline underline-offset-2">Customer profile</Link> : <p className="mt-2 text-[13px] text-graphite">Guest checkout</p>}
          </Section>
          <Section title="Delivery">
            <address className="not-italic leading-relaxed">
              <span className="block font-medium">{placeLine(addr)}</span>
              <span className="block">Nearest landmark: {addr.landmark}</span>
              {addr.governorate_name_ar && <span className="block text-graphite" dir="rtl">{addr.governorate_name_ar}</span>}
            </address>
            {order.delivery_instructions && <p className="mt-3 border-s-2 border-mist ps-3 text-[13px] text-graphite">{order.delivery_instructions}</p>}
            <div className="mt-4 border-t border-mist pt-4 text-[14px]">
              <p className="text-graphite">Tracking</p>
              {order.tracking_number ? <p className="num">{order.tracking_url ? <a href={order.tracking_url} target="_blank" rel="noreferrer" className="underline">{order.tracking_number}</a> : order.tracking_number}</p> : <p>—</p>}
              {can('orders.write') && <Button size="sm" variant="outline" className="mt-2" onClick={() => setTracking({ number: order.tracking_number ?? '', url: order.tracking_url ?? '' })}>Edit tracking</Button>}
            </div>
          </Section>
          <Section title="Payment" actions={can('orders.write') && <Button size="sm" variant="outline" onClick={() => { setPayment({ status: 'paid', amount: String(order.total), reference: '' }); setPaymentOpen(true) }}>Record payment</Button>}>
            <p>{order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_method === 'manual' ? 'ZainCash / bank transfer' : order.payment_method} · {paymentStatus(order.payment_status)}</p>
            <ul className="mt-3 grid gap-2 text-[13px]">
              {order.payments.map((p: any) => (
                <li key={p.id} className="flex justify-between gap-2 border-t border-mist pt-2">
                  <span>{p.status}{p.reference ? ` · ${p.reference}` : ''}<span className="block text-graphite">{date(p.created_at, true)}</span></span>
                  <span className="num">{money(p.amount, p.currency)}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <Modal open={!!transition} onClose={() => setTransition(null)} title={transition ? ACTION_LABEL[transition] : ''}>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); changeStatus.mutate() }}>
          {transition === 'cancelled' && <p className="border border-error p-3 text-[13px] text-error">Cancelling returns all items to stock and releases any discount code use.</p>}
          {transition === 'returned' && <p className="border border-mist p-3 text-[13px]">Items are returned to stock. Record any refund with “Record payment”.</p>}
          {transition === 'delivered' && order.payment_method === 'cod' && <p className="border border-mist p-3 text-[13px]">The cash-on-delivery payment will be marked as collected.</p>}
          <TextArea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <Checkbox label="Show this update to the customer" checked={notify} onChange={setNotify} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTransition(null)}>Back</Button><Button type="submit" variant={transition === 'cancelled' ? 'danger' : 'solid'} loading={changeStatus.isPending}>{transition ? ACTION_LABEL[transition] : ''}</Button></div>
        </form>
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record payment">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); recordPayment.mutate() }}>
          <SelectField label="Type" value={payment.status} onChange={(e) => setPayment({ ...payment, status: e.target.value })} options={[{ value: 'paid', label: 'Payment received' }, { value: 'refunded', label: 'Refund issued' }, { value: 'failed', label: 'Payment failed' }]} />
          <TextField label={`Amount (${order.currency})`} inputMode="decimal" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} hint={`Order total ${money(order.total, order.currency)}`} />
          <TextField label="Reference" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="Bank transfer ID, receipt number…" />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button><Button type="submit" loading={recordPayment.isPending}>Record</Button></div>
        </form>
      </Modal>

      <Modal open={!!tracking} onClose={() => setTracking(null)} title="Tracking">
        {tracking && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); saveTracking.mutate() }}>
            <TextField label="Tracking number" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} />
            <TextField label="Tracking link" type="url" value={tracking.url} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} placeholder="https://" />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTracking(null)}>Cancel</Button><Button type="submit" loading={saveTracking.isPending}>Save</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
