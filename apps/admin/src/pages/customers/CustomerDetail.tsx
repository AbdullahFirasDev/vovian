import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Badge, Button, DataTable, ErrorNote, PageHeader, Section, SelectField, Spinner, TextArea, orderTone, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { date, money, orderStatus } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => unwrap(await supabase.rpc('admin_customer', { p_user_id: id! })) as any,
  })
  useEffect(() => {
    if (data?.profile) {
      setStatus(data.profile.status)
      setNotes(data.profile.staff_notes ?? '')
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('admin_update_customer', { p_user_id: id!, p_status: status, p_staff_notes: notes })),
    onSuccess: () => { toast('Customer updated'); qc.invalidateQueries({ queryKey: ['customer', id] }); qc.invalidateQueries({ queryKey: ['customers'] }) },
    onError: (e) => toast(e.message, 'error'),
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorNote error={error ?? 'Customer not found'} />
  const p = data.profile

  return (
    <div>
      <PageHeader title={p.full_name ?? p.email} back={{ to: '/customers', label: 'Customers' }} description={<>{p.email} · joined {date(p.created_at)}</>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid content-start gap-6 xl:col-span-2">
          <div className="grid grid-cols-2 border-s border-t border-mist md:grid-cols-4">
            {[
              ['Orders', String(data.stats.order_count)],
              ['Total spent', money(data.stats.total_spent)],
              ['Average order', money(Math.round(data.stats.average_order * 100) / 100)],
              ['Wishlist', String(data.wishlist_count)],
            ].map(([k, v]) => (
              <div key={k} className="border-e border-b border-mist p-4"><p className="text-[12px] text-graphite">{k}</p><p className="mt-1 font-display text-2xl num">{v}</p></div>
            ))}
          </div>
          <Section title="Purchase history">
            <DataTable
              caption="Orders"
              rows={data.orders}
              rowKey={(r: any) => r.id}
              onRowClick={(r: any) => navigate(`/orders/${r.id}`)}
              empty={<p className="text-graphite">No orders yet.</p>}
              columns={[
                { key: 'n', header: 'Order', render: (r: any) => <span className="num">{r.order_number}</span> },
                { key: 'd', header: 'Placed', render: (r: any) => date(r.created_at) },
                { key: 's', header: 'Status', render: (r: any) => <Badge tone={orderTone(r.status)}>{orderStatus(r.status)}</Badge> },
                { key: 't', header: 'Total', align: 'end', render: (r: any) => money(r.total, r.currency) },
              ]}
            />
          </Section>
        </div>
        <div className="grid content-start gap-6">
          <Section title="Contact">
            <p><a className="underline underline-offset-2" href={`mailto:${p.email}`}>{p.email}</a></p>
            <p dir="ltr" className="text-start">{p.phone ?? '—'}</p>
            <p className="mt-2 text-[13px] text-graphite">Language: {p.locale === 'ar' ? 'Arabic' : 'English'} · Newsletter: {p.marketing_opt_in ? 'yes' : 'no'}</p>
          </Section>
          <Section title="Addresses">
            {data.addresses.length ? data.addresses.map((a: any) => (
              <address key={a.id} className="mb-3 not-italic">{a.label && <span className="block text-[12px] text-graphite">{a.label}{a.is_default ? ' · default' : ''}</span>}<span className="block">{a.governorate} · {a.area}</span><span className="block text-graphite">{a.landmark}</span><span className="block text-start" dir="ltr">{a.phone}{a.phone_secondary ? ` · ${a.phone_secondary}` : ''}</span></address>
            )) : <p className="text-graphite">None saved.</p>}
          </Section>
          <Section title="Status & notes" description="Visible to staff only.">
            <fieldset disabled={!can('customers.write')} className="grid gap-4">
              <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'active', label: 'Active' }, { value: 'vip', label: 'VIP' }, { value: 'blocked', label: 'Blocked' }]} />
              <TextArea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
              <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
            </fieldset>
          </Section>
        </div>
      </div>
    </div>
  )
}
