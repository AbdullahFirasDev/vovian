import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Badge, Button, DataTable, ErrorNote, Modal, PageHeader, Pager, SelectField, Spinner, TextField, Thumb, useFeedback } from '../components/ui'
import { useAccess } from '../lib/access'
import { date } from '../lib/format'
import { supabase, unwrap } from '../lib/supabase'

interface Row {
  variant_id: string
  on_hand: number
  reserved: number
  low_stock_threshold: number
  updated_at: string
  product_variants: { sku: string; color: string | null; size: string | null; products: { id: string; name: string; product_images: { url: string; position: number }[] } }
}
interface Movement { id: number; delta: number; quantity_after: number; reason: string; note: string | null; reference_type: string | null; reference_id: string | null; created_at: string }

const PER_PAGE = 30
const REASONS = [
  { value: 'restock', label: 'Restock (received goods)' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Customer return' },
  { value: 'damage', label: 'Damaged / written off' },
  { value: 'correction', label: 'Stock count correction' },
]

export default function Inventory() {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') ?? 'all'
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [adjusting, setAdjusting] = useState<Row | null>(null)
  const [adjust, setAdjust] = useState({ delta: '', reason: 'restock', note: '', threshold: '' })
  const [history, setHistory] = useState<Row | null>(null)

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () =>
      unwrap(await supabase
        .from('inventory')
        .select('variant_id, on_hand, reserved, low_stock_threshold, updated_at, product_variants!inner(sku, color, size, deleted_at, products!inner(id, name, deleted_at, product_images(url, position)))')
        .is('product_variants.deleted_at', null)
        .is('product_variants.products.deleted_at', null)) as unknown as Row[],
  })

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows
      .filter((r) => {
        const avail = r.on_hand - r.reserved
        if (filter === 'low' && !(avail > 0 && avail <= r.low_stock_threshold)) return false
        if (filter === 'out' && avail > 0) return false
        if (filter === 'alerts' && avail > r.low_stock_threshold) return false
        if (!term) return true
        return `${r.product_variants.products.name} ${r.product_variants.sku}`.toLowerCase().includes(term)
      })
      .sort((a, b) => a.on_hand - a.reserved - (b.on_hand - b.reserved) || a.product_variants.sku.localeCompare(b.product_variants.sku))
  }, [rows, filter, q])

  const totals = useMemo(() => ({
    units: rows.reduce((n, r) => n + r.on_hand, 0),
    out: rows.filter((r) => r.on_hand - r.reserved <= 0).length,
    low: rows.filter((r) => { const a = r.on_hand - r.reserved; return a > 0 && a <= r.low_stock_threshold }).length,
  }), [rows])

  const { data: movements = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['movements', history?.variant_id],
    enabled: !!history,
    queryFn: async () => unwrap(await supabase.from('inventory_movements').select('*').eq('variant_id', history!.variant_id).order('created_at', { ascending: false }).limit(50)) as Movement[],
  })

  const save = useMutation({
    mutationFn: async () => {
      const r = adjusting!
      const delta = Number(adjust.delta)
      if (adjust.delta && delta !== 0) {
        if (!Number.isInteger(delta)) throw new Error('Enter a whole number, e.g. 10 or -2')
        unwrap(await supabase.rpc('admin_adjust_inventory', { p_variant_id: r.variant_id, p_delta: delta, p_reason: adjust.reason, p_note: adjust.note || null }))
      }
      if (adjust.threshold !== '' && Number(adjust.threshold) !== r.low_stock_threshold) {
        unwrap(await supabase.rpc('admin_set_low_stock_threshold', { p_variant_id: r.variant_id, p_threshold: Number(adjust.threshold) }))
      }
    },
    onSuccess: () => {
      toast('Stock updated')
      setAdjusting(null)
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e) => toast(e.message.replace(/^INSUFFICIENT_STOCK:\s*/, ''), 'error'),
  })

  const variantLabel = (r: Row) => [r.product_variants.color, r.product_variants.size].filter(Boolean).join(' / ')
  const setFilter = (f: string) => { setPage(1); setParams(f === 'all' ? {} : { filter: f }) }

  return (
    <div>
      <PageHeader title="Inventory" description={`${totals.units} units on hand across ${rows.length} variants · ${totals.out} sold out · ${totals.low} low`} />
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex border border-mist" role="group" aria-label="Filter">
          {[['all', 'All'], ['alerts', 'Needs attention'], ['low', 'Low'], ['out', 'Sold out']].map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k!)} className={`h-10 cursor-pointer px-4 text-[13px] ${filter === k ? 'bg-ink text-white' : ''}`}>{label}</button>
          ))}
        </div>
        <input className="field max-w-xs" placeholder="Search product or SKU" aria-label="Search inventory" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </div>
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <>
          <DataTable
            caption="Inventory"
            rows={filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)}
            rowKey={(r) => r.variant_id}
            columns={[
              {
                key: 'p', header: 'Product', render: (r) => (
                  <span className="flex items-center gap-3">
                    <Thumb src={[...r.product_variants.products.product_images].sort((a, b) => a.position - b.position)[0]?.url} size={30} />
                    <span>
                      <Link to={`/products/${r.product_variants.products.id}`} className="block font-medium hover:underline">{r.product_variants.products.name}</Link>
                      <span className="text-[12px] text-graphite">{variantLabel(r)} · <span className="font-mono">{r.product_variants.sku}</span></span>
                    </span>
                  </span>
                ),
              },
              { key: 'h', header: 'On hand', align: 'end', render: (r) => r.on_hand },
              { key: 'r', header: 'Reserved', align: 'end', render: (r) => r.reserved },
              {
                key: 'a', header: 'Available', align: 'end', render: (r) => {
                  const a = r.on_hand - r.reserved
                  return a <= 0 ? <Badge tone="error">Sold out</Badge> : a <= r.low_stock_threshold ? <Badge tone="outline">{a} · low</Badge> : a
                },
              },
              { key: 't', header: 'Alert at', align: 'end', render: (r) => r.low_stock_threshold },
              {
                key: 'x', header: '', align: 'end', render: (r) => (
                  <span className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setHistory(r)}>History</Button>
                    {can('inventory.write') && <Button size="sm" variant="outline" onClick={() => { setAdjusting(r); setAdjust({ delta: '', reason: 'restock', note: '', threshold: String(r.low_stock_threshold) }) }}>Adjust</Button>}
                  </span>
                ),
              },
            ]}
          />
          <Pager page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}

      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title="Adjust stock">
        {adjusting && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <p className="text-[14px]">{adjusting.product_variants.products.name} · {variantLabel(adjusting)}<br /><span className="text-graphite">On hand now: {adjusting.on_hand}</span></p>
            <TextField label="Change in units" inputMode="numeric" placeholder="e.g. 12 or -3" value={adjust.delta} onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} hint={adjust.delta && !Number.isNaN(Number(adjust.delta)) ? `New on-hand: ${adjusting.on_hand + Number(adjust.delta)}` : 'Positive to add, negative to remove'} />
            <SelectField label="Reason" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} options={REASONS} />
            <TextField label="Note" value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} placeholder="Delivery reference, count sheet…" />
            <TextField label="Low-stock alert threshold" inputMode="numeric" value={adjust.threshold} onChange={(e) => setAdjust({ ...adjust, threshold: e.target.value })} />
            <p className="text-[12px] text-graphite">Stock can't go below what's reserved, and every change is recorded in the movement history.</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={!!history} onClose={() => setHistory(null)} title="Movement history" wide>
        {loadingHistory ? <Spinner /> : (
          <table className="w-full text-[13px]">
            <caption className="sr-only">Stock movements</caption>
            <thead className="text-graphite"><tr><th className="py-2 text-start font-normal">When</th><th className="text-start font-normal">Reason</th><th className="text-end font-normal">Change</th><th className="text-end font-normal">After</th><th className="ps-4 text-start font-normal">Reference</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-mist">
                  <td className="py-2">{date(m.created_at, true)}</td>
                  <td>{m.reason}</td>
                  <td className="text-end num">{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="text-end num">{m.quantity_after}</td>
                  <td className="ps-4 text-graphite">{m.reference_type === 'order' && m.reference_id ? <Link to={`/orders/${m.reference_id}`} className="underline">Order</Link> : m.note ?? '—'}</td>
                </tr>
              ))}
              {!movements.length && <tr><td colSpan={5} className="py-6 text-graphite">No movements yet.</td></tr>}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  )
}
