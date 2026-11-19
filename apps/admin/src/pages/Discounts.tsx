import { discountSchema } from '@vovian/validation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, DataTable, ErrorNote, Modal, PageHeader, SelectField, Spinner, TextField, useFeedback } from '../components/ui'
import { useAccess } from '../lib/access'
import { currency, date, money } from '../lib/format'
import { supabase, unwrap } from '../lib/supabase'

interface Discount { id: string; code: string; description: string | null; type: 'percentage' | 'fixed' | 'free_shipping'; value: number; scope: 'all' | 'products' | 'categories'; product_ids: string[]; category_ids: string[]; min_order_value: number | null; usage_limit: number | null; usage_limit_per_customer: number | null; times_used: number; starts_at: string | null; expires_at: string | null; is_active: boolean }

const blank = { code: '', description: '', type: 'percentage', value: '10', scope: 'all', product_ids: [] as string[], category_ids: [] as string[], min_order_value: '', usage_limit: '', usage_limit_per_customer: '', starts_at: '', expires_at: '', is_active: true }

function state(d: Discount): { label: string; tone: 'dark' | 'neutral' | 'error' | 'outline' } {
  const now = Date.now()
  if (!d.is_active) return { label: 'Disabled', tone: 'neutral' }
  if (d.expires_at && new Date(d.expires_at).getTime() <= now) return { label: 'Expired', tone: 'error' }
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return { label: 'Scheduled', tone: 'outline' }
  if (d.usage_limit && d.times_used >= d.usage_limit) return { label: 'Used up', tone: 'error' }
  return { label: 'Active', tone: 'dark' }
}

export default function Discounts() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Discount | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => unwrap(await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })) as Discount[],
  })
  const { data: categories = [] } = useQuery({ queryKey: ['categories-all'], queryFn: async () => unwrap(await supabase.from('categories').select('id, name, department').is('deleted_at', null).order('department').order('position')) })
  const { data: products = [] } = useQuery({ queryKey: ['products-min'], queryFn: async () => unwrap(await supabase.from('products').select('id, name').is('deleted_at', null).order('name')) })

  function open(d: Discount | 'new') {
    setErrors({})
    setEditing(d)
    setForm(d === 'new' ? blank : {
      ...d, description: d.description ?? '', value: String(d.value), min_order_value: d.min_order_value?.toString() ?? '',
      usage_limit: d.usage_limit?.toString() ?? '', usage_limit_per_customer: d.usage_limit_per_customer?.toString() ?? '',
      starts_at: d.starts_at?.slice(0, 16) ?? '', expires_at: d.expires_at?.slice(0, 16) ?? '',
    })
  }

  const save = useMutation({
    mutationFn: async () => {
      const parsed = discountSchema.safeParse(form)
      if (!parsed.success) {
        setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
        throw new Error('Check the highlighted fields')
      }
      const d = parsed.data
      const row = {
        ...d, description: d.description || null, value: d.type === 'free_shipping' ? 0 : d.value,
        starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null, expires_at: d.expires_at ? new Date(d.expires_at).toISOString() : null,
      }
      if (editing === 'new') unwrap(await supabase.from('discount_codes').insert(row))
      else unwrap(await supabase.from('discount_codes').update(row).eq('id', (editing as Discount).id))
    },
    onSuccess: () => { toast('Discount saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['discounts'] }) },
    onError: (e) => toast(e.message.includes('duplicate') ? 'That code already exists' : e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: async (d: Discount) => unwrap(await supabase.from('discount_codes').delete().eq('id', d.id)),
    onSuccess: () => { toast('Discount deleted'); qc.invalidateQueries({ queryKey: ['discounts'] }) },
    onError: (e) => toast(e.message, 'error'),
  })

  const describe = (d: Discount) => (d.type === 'percentage' ? `${d.value}% off` : d.type === 'fixed' ? `${money(d.value)} off` : 'Free delivery') + (d.scope === 'all' ? '' : d.scope === 'categories' ? ` · ${d.category_ids.length} categories` : ` · ${d.product_ids.length} products`)

  return (
    <div>
      <PageHeader title="Discounts" description="Codes are validated and applied on the server at checkout." actions={can('discounts.write') && <Button onClick={() => open('new')}>New code</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Discount codes"
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={can('discounts.write') ? open : undefined}
          columns={[
            { key: 'c', header: 'Code', render: (r) => <span><span className="block font-mono font-medium">{r.code}</span><span className="text-[12px] text-graphite">{r.description}</span></span> },
            { key: 'v', header: 'Offer', render: describe },
            { key: 'm', header: 'Minimum', render: (r) => (r.min_order_value ? money(r.min_order_value) : '—') },
            { key: 'u', header: 'Used', align: 'end', render: (r) => `${r.times_used}${r.usage_limit ? ` / ${r.usage_limit}` : ''}` },
            { key: 'e', header: 'Ends', render: (r) => date(r.expires_at) },
            { key: 's', header: 'Status', render: (r) => { const s = state(r); return <Badge tone={s.tone}>{s.label}</Badge> } },
            { key: 'x', header: '', align: 'end', render: (r) => can('discounts.write') && <Button size="sm" variant="ghost" className="text-error" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Delete ${r.code}? Past orders keep their discount records.`, { danger: true })) remove.mutate(r) }}>Delete</Button> },
          ]}
        />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New discount code' : 'Edit discount code'} wide>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
          <TextField label="Code" required value={form.code} error={errors.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <TextField label="Internal description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <SelectField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'percentage', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount off' }, { value: 'free_shipping', label: 'Free delivery' }]} />
          {form.type !== 'free_shipping' && <TextField label={form.type === 'percentage' ? 'Percent' : `Amount (${currency()})`} inputMode="decimal" value={form.value} error={errors.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />}
          <SelectField label="Applies to" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} options={[{ value: 'all', label: 'Whole order' }, { value: 'categories', label: 'Specific categories' }, { value: 'products', label: 'Specific products' }]} className="md:col-span-2" />
          {form.scope === 'categories' && (
            <fieldset className="md:col-span-2"><legend className="mb-2 text-[13px] text-graphite">Categories {errors.category_ids && <span className="text-error">— {errors.category_ids}</span>}</legend>
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto border border-mist p-3">
                {categories.map((c: any) => <Checkbox key={c.id} label={`${c.name} · ${c.department}`} checked={form.category_ids.includes(c.id)} onChange={(on) => setForm({ ...form, category_ids: on ? [...form.category_ids, c.id] : form.category_ids.filter((x) => x !== c.id) })} />)}
              </div>
            </fieldset>
          )}
          {form.scope === 'products' && (
            <fieldset className="md:col-span-2"><legend className="mb-2 text-[13px] text-graphite">Products {errors.product_ids && <span className="text-error">— {errors.product_ids}</span>}</legend>
              <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto border border-mist p-3">
                {products.map((p: any) => <Checkbox key={p.id} label={p.name} checked={form.product_ids.includes(p.id)} onChange={(on) => setForm({ ...form, product_ids: on ? [...form.product_ids, p.id] : form.product_ids.filter((x) => x !== p.id) })} />)}
              </div>
            </fieldset>
          )}
          <TextField label={`Minimum order (${currency()})`} inputMode="decimal" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} />
          <TextField label="Total uses allowed" inputMode="numeric" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} hint="Blank for unlimited" />
          <TextField label="Uses per customer" inputMode="numeric" value={form.usage_limit_per_customer} onChange={(e) => setForm({ ...form, usage_limit_per_customer: e.target.value })} hint="Matched by email and account" />
          <span />
          <TextField label="Starts" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <TextField label="Expires" type="datetime-local" value={form.expires_at} error={errors.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          <Checkbox label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
