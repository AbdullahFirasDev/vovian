import { ORDER_STATUSES } from '@vovian/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Badge, Button, DataTable, ErrorNote, PageHeader, Pager, Spinner, orderTone, useFeedback } from '../../components/ui'
import { date, download, money, orderStatus, paymentStatus, phoneSearchTerm, toCsv } from '../../lib/format'
import { supabase } from '../../lib/supabase'

const PER_PAGE = 25
const SELECT = 'id, order_number, customer_name, email, phone, phone_secondary, status, payment_status, payment_method, total, subtotal, discount_total, shipping_total, tax_total, currency, discount_code, shipping_method_name, shipping_address, created_at, user_id'

interface Order { id: string; order_number: string; customer_name: string; email: string; phone: string; phone_secondary: string | null; status: string; payment_status: string; payment_method: string; total: number; subtotal: number; discount_total: number; shipping_total: number; tax_total: number; currency: string; discount_code: string | null; shipping_method_name: string; shipping_address: { governorate_name?: string; area?: string; landmark?: string }; created_at: string; user_id: string | null }

export default function OrdersList() {
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const pay = params.get('payment') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Number(params.get('page') ?? 1)
  const [search, setSearch] = useState(q)
  const [exporting, setExporting] = useState(false)

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  function build(select: string, count = false) {
    let query = supabase.from('orders').select(select, count ? { count: 'exact' } : undefined).order('created_at', { ascending: false })
    const term = q.replace(/[%,()]/g, '').trim()
    if (term) {
      const phone = phoneSearchTerm(term)
      query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${phone}%,phone_secondary.ilike.%${phone}%`)
    }
    if (status) query = query.eq('status', status)
    if (pay) query = query.eq('payment_status', pay)
    if (from) query = query.gte('created_at', new Date(from).toISOString())
    if (to) query = query.lt('created_at', new Date(new Date(to).getTime() + 86_400_000).toISOString())
    return query
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', q, status, pay, from, to, page],
    queryFn: async () => {
      const res = await build(SELECT, true).range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (res.error) throw new Error(res.error.message)
      return { rows: (res.data ?? []) as unknown as Order[], total: res.count ?? 0 }
    },
  })

  async function exportCsv() {
    setExporting(true)
    const res = await build(SELECT).limit(5000)
    setExporting(false)
    if (res.error) return toast(res.error.message, 'error')
    const rows = ((res.data ?? []) as unknown as Order[]).map((o) => ({ ...o, governorate: o.shipping_address?.governorate_name, area: o.shipping_address?.area, landmark: o.shipping_address?.landmark, created_at: new Date(o.created_at).toISOString() }))
    download(`vovian-orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, [
      { key: 'order_number', label: 'Order' }, { key: 'created_at', label: 'Placed (UTC)' }, { key: 'status', label: 'Status' },
      { key: 'payment_status', label: 'Payment status' }, { key: 'payment_method', label: 'Payment method' },
      { key: 'customer_name', label: 'Customer' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'phone_secondary', label: 'Backup phone' },
      { key: 'governorate', label: 'Governorate' }, { key: 'area', label: 'Area' }, { key: 'landmark', label: 'Nearest landmark' }, { key: 'shipping_method_name', label: 'Delivery' },
      { key: 'discount_code', label: 'Discount code' }, { key: 'subtotal', label: 'Subtotal' }, { key: 'discount_total', label: 'Discount' },
      { key: 'shipping_total', label: 'Shipping' }, { key: 'tax_total', label: 'Tax' }, { key: 'total', label: 'Total' }, { key: 'currency', label: 'Currency' },
    ]))
    toast(`Exported ${rows.length} orders`)
  }

  return (
    <div>
      <PageHeader title="Orders" description={data ? `${data.total} orders match` : undefined} actions={<Button variant="outline" onClick={exportCsv} loading={exporting}>Export CSV</Button>} />
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); set({ q: search }) }}>
        <label className="min-w-64 flex-1"><span className="mb-1.5 block text-[13px] text-graphite">Search</span><input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order number, name, email or phone" /></label>
        <label><span className="mb-1.5 block text-[13px] text-graphite">Status</span>
          <select className="field" value={status} onChange={(e) => set({ status: e.target.value })}><option value="">All</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{orderStatus(s)}</option>)}</select>
        </label>
        <label><span className="mb-1.5 block text-[13px] text-graphite">Payment</span>
          <select className="field" value={pay} onChange={(e) => set({ payment: e.target.value })}>
            <option value="">All</option>{['unpaid', 'pending_confirmation', 'paid', 'partially_refunded', 'refunded', 'failed'].map((s) => <option key={s} value={s}>{paymentStatus(s as never)}</option>)}
          </select>
        </label>
        <label><span className="mb-1.5 block text-[13px] text-graphite">From</span><input type="date" className="field" value={from} onChange={(e) => set({ from: e.target.value })} /></label>
        <label><span className="mb-1.5 block text-[13px] text-graphite">To</span><input type="date" className="field" value={to} onChange={(e) => set({ to: e.target.value })} /></label>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <ErrorNote error={error} />
      {isLoading || !data ? <Spinner /> : (
        <>
          <DataTable
            caption="Orders"
            rows={data.rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/orders/${r.id}`)}
            columns={[
              { key: 'n', header: 'Order', render: (r) => <span className="font-medium num">{r.order_number}</span> },
              { key: 'd', header: 'Placed', render: (r) => date(r.created_at, true) },
              { key: 'c', header: 'Customer', render: (r) => <span><span className="block">{r.customer_name}</span><span className="text-[12px] text-graphite">{r.user_id ? r.email : `${r.email} · guest`}</span></span> },
              { key: 's', header: 'Status', render: (r) => <Badge tone={orderTone(r.status)}>{orderStatus(r.status as never)}</Badge> },
              { key: 'p', header: 'Payment', render: (r) => <span className="text-[13px]">{paymentStatus(r.payment_status as never)}<span className="block text-[12px] text-graphite">{r.payment_method === 'cod' ? 'Cash on delivery' : 'ZainCash / transfer'}</span></span> },
              { key: 't', header: 'Total', align: 'end', render: (r) => money(r.total, r.currency) },
            ]}
          />
          <Pager page={page} total={data.total} perPage={PER_PAGE} onChange={(p) => set({ page: String(p) })} />
        </>
      )}
    </div>
  )
}
