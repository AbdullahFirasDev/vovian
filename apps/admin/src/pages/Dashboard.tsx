import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, DataTable, ErrorNote, PageHeader, Section, Spinner, Thumb, orderTone } from '../components/ui'
import { date, money, num, orderStatus, pctChange } from '../lib/format'
import { supabase, unwrap } from '../lib/supabase'

interface Dashboard {
  range_days: number
  currency: string
  revenue: number
  revenue_prev: number
  orders: number
  orders_prev: number
  orders_all_time: number
  average_order_value: number
  average_order_value_prev: number
  customers: number
  new_customers: number
  pending_orders: number
  processing_orders: number
  completed_orders: number
  status_breakdown: Record<string, number>
  series: { date: string; revenue: number; orders: number }[]
  best_sellers: { product_id: string; name: string; quantity: number; revenue: number; image_url: string | null }[]
  recent_orders: { id: string; order_number: string; customer_name: string; status: string; payment_status: string; total: number; currency: string; created_at: string }[]
  inventory: { out_of_stock: number; low_stock: number; units: number }
  inventory_alerts: { variant_id: string; product_id: string; name: string; sku: string; color: string | null; size: string | null; available: number; threshold: number }[]
}

const RANGES = [7, 30, 90] as const
// Chart tokens: brand ink for the single data series; recessive grid + axes.
const INK = '#000000'
const GRID = '#E8E8E8'
const AXIS = '#5E5E5E'

function Delta({ current, previous }: { current: number; previous: number }) {
  const change = pctChange(current, previous)
  if (change == null) return <span className="text-[12px] text-graphite">No prior period</span>
  const up = change >= 0
  return (
    <span className="text-[12px] text-graphite">
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {Math.abs(change)}% <span className="sr-only">{up ? 'increase' : 'decrease'}</span> vs previous period
    </span>
  )
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="border-e border-b border-mist p-5">
      <p className="text-[13px] text-graphite">{label}</p>
      <p className="mt-2 font-display text-[32px] leading-none num">{value}</p>
      <div className="mt-2 min-h-4">{children}</div>
    </div>
  )
}

function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: { value: number }[]; label?: string; format: (n: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-ink bg-white px-3 py-2 text-[12px]">
      <p className="text-graphite">{label ? date(label) : ''}</p>
      <p className="mt-0.5 font-medium num">{format(payload[0]!.value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [tableView, setTableView] = useState(false)
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', days],
    queryFn: async () => unwrap(await supabase.rpc('admin_dashboard', { p_days: days })) as unknown as Dashboard,
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live figures from orders, customers and stock. Cancelled and returned orders are excluded from revenue."
        actions={
          <div className="flex border border-mist" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => setDays(r)} aria-pressed={days === r} className={`h-9 cursor-pointer px-3 text-[13px] ${days === r ? 'bg-ink text-white' : ''}`}>
                {r} days
              </button>
            ))}
          </div>
        }
      />
      <ErrorNote error={error} />
      {isLoading || !data ? (
        <Spinner />
      ) : (
        <div className="grid gap-8">
          <div className="grid grid-cols-2 border-s border-t border-mist lg:grid-cols-4">
            <Stat label="Revenue" value={money(data.revenue, data.currency)}><Delta current={data.revenue} previous={data.revenue_prev} /></Stat>
            <Stat label="Orders" value={num(data.orders)}><Delta current={data.orders} previous={data.orders_prev} /></Stat>
            <Stat label="Average order value" value={money(data.average_order_value, data.currency)}><Delta current={data.average_order_value} previous={data.average_order_value_prev} /></Stat>
            <Stat label="Customers" value={num(data.customers)}><span className="text-[12px] text-graphite">{num(data.new_customers)} new in period</span></Stat>
            <Stat label="Pending orders" value={num(data.pending_orders)}><Link to="/orders?status=pending" className="text-[12px] underline underline-offset-2">Review</Link></Stat>
            <Stat label="In fulfilment" value={num(data.processing_orders)}><span className="text-[12px] text-graphite">Confirmed or processing</span></Stat>
            <Stat label="Completed orders" value={num(data.completed_orders)}><span className="text-[12px] text-graphite">Delivered, all time</span></Stat>
            <Stat label="Stock alerts" value={num(data.inventory.low_stock + data.inventory.out_of_stock)}>
              <span className="text-[12px] text-graphite">{data.inventory.out_of_stock} sold out · {data.inventory.low_stock} low</span>
            </Stat>
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            <Section
              title="Revenue"
              description={`Daily, last ${data.range_days} days`}
              actions={<button type="button" onClick={() => setTableView((v) => !v)} className="cursor-pointer text-[12px] underline underline-offset-2">{tableView ? 'Show chart' : 'Show table'}</button>}
            >
              {tableView ? (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <caption className="sr-only">Daily revenue and orders</caption>
                    <thead><tr className="text-graphite"><th className="py-1 text-start font-normal">Date</th><th className="text-end font-normal">Revenue</th><th className="text-end font-normal">Orders</th></tr></thead>
                    <tbody>{data.series.map((d) => <tr key={d.date} className="border-t border-mist"><td className="py-1">{date(d.date)}</td><td className="text-end num">{money(d.revenue, data.currency)}</td><td className="text-end num">{d.orders}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64" role="img" aria-label={`Revenue per day over the last ${data.range_days} days, total ${money(data.revenue, data.currency)}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={INK} stopOpacity={0.12} />
                          <stop offset="100%" stopColor={INK} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
                      <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} />
                      <Tooltip cursor={{ stroke: INK, strokeWidth: 1 }} content={<ChartTooltip format={(n) => money(n, data.currency)} />} />
                      <Area type="linear" dataKey="revenue" stroke={INK} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2, fill: INK }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            <Section title="Orders" description={`Per day, last ${data.range_days} days`}>
              <div className="h-64" role="img" aria-label={`Orders per day, ${data.orders} in total`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip cursor={{ fill: '#F7F7F5' }} content={<ChartTooltip format={(n) => `${n} order${n === 1 ? '' : 's'}`} />} />
                    <Bar dataKey="orders" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title="Best sellers" description="Units sold in period">
              <ol className="divide-y divide-mist">
                {data.best_sellers.map((p) => (
                  <li key={p.product_id} className="flex items-center gap-3 py-2.5">
                    <Thumb src={p.image_url} size={32} />
                    <Link to={`/products/${p.product_id}`} className="min-w-0 flex-1 truncate hover:underline">{p.name}</Link>
                    <span className="text-[13px] num">{p.quantity}</span>
                    <span className="w-20 text-end text-[13px] text-graphite num">{money(p.revenue, data.currency)}</span>
                  </li>
                ))}
                {!data.best_sellers.length && <li className="py-6 text-graphite">No sales in this period.</li>}
              </ol>
            </Section>
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Section title="Recent orders" actions={<Link to="/orders" className="text-[13px] underline underline-offset-2">All orders</Link>}>
                <DataTable
                  caption="Recent orders"
                  rows={data.recent_orders}
                  rowKey={(r) => r.id}
                  onRowClick={(r) => navigate(`/orders/${r.id}`)}
                  columns={[
                    { key: 'n', header: 'Order', render: (r) => <span className="font-medium num">{r.order_number}</span> },
                    { key: 'c', header: 'Customer', render: (r) => r.customer_name },
                    { key: 's', header: 'Status', render: (r) => <Badge tone={orderTone(r.status)}>{orderStatus(r.status as never)}</Badge> },
                    { key: 'd', header: 'Placed', render: (r) => date(r.created_at, true) },
                    { key: 't', header: 'Total', align: 'end', render: (r) => money(r.total, r.currency) },
                  ]}
                />
              </Section>
            </div>
            <Section title="Inventory alerts" actions={<Link to="/inventory?filter=low" className="text-[13px] underline underline-offset-2">Inventory</Link>}>
              <ul className="divide-y divide-mist">
                {data.inventory_alerts.map((a) => (
                  <li key={a.variant_id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <Link to={`/products/${a.product_id}`} className="block truncate hover:underline">{a.name}</Link>
                      <span className="text-[12px] text-graphite">{[a.color, a.size].filter(Boolean).join(' / ')} · {a.sku}</span>
                    </span>
                    <Badge tone={a.available <= 0 ? 'error' : 'outline'}>{a.available <= 0 ? 'Sold out' : `${a.available} left`}</Badge>
                  </li>
                ))}
                {!data.inventory_alerts.length && <li className="py-6 text-graphite">All variants are above their thresholds.</li>}
              </ul>
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}
