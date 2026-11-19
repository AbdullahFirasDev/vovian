import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Badge, Button, DataTable, ErrorNote, PageHeader, Pager, Spinner } from '../../components/ui'
import { date, money } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

interface Customer { id: string; email: string; full_name: string | null; phone: string | null; status: 'active' | 'vip' | 'blocked'; created_at: string; order_count: number; total_spent: number; last_order_at: string | null }
const PER_PAGE = 25

export default function CustomersList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', term, status, page],
    queryFn: async () => unwrap(await supabase.rpc('admin_customers', { p_search: term || null, p_status: status || null, p_limit: PER_PAGE, p_offset: (page - 1) * PER_PAGE })) as unknown as { total: number; items: Customer[] },
  })

  return (
    <div>
      <PageHeader title="Customers" description={data ? `${data.total} customers` : undefined} />
      <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setTerm(search); setPage(1) }}>
        <label className="min-w-64 flex-1"><span className="mb-1.5 block text-[13px] text-graphite">Search</span><input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone" /></label>
        <label><span className="mb-1.5 block text-[13px] text-graphite">Status</span>
          <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All</option><option value="active">Active</option><option value="vip">VIP</option><option value="blocked">Blocked</option></select>
        </label>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <ErrorNote error={error} />
      {isLoading || !data ? <Spinner /> : (
        <>
          <DataTable
            caption="Customers"
            rows={data.items}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/customers/${r.id}`)}
            columns={[
              { key: 'n', header: 'Customer', render: (r) => <span><span className="block font-medium">{r.full_name ?? '—'}</span><span className="text-[12px] text-graphite">{r.email}</span></span> },
              { key: 's', header: 'Status', render: (r) => <Badge tone={r.status === 'vip' ? 'dark' : r.status === 'blocked' ? 'error' : 'neutral'}>{r.status}</Badge> },
              { key: 'j', header: 'Joined', render: (r) => date(r.created_at) },
              { key: 'l', header: 'Last order', render: (r) => date(r.last_order_at) },
              { key: 'o', header: 'Orders', align: 'end', render: (r) => r.order_count },
              { key: 't', header: 'Total spent', align: 'end', render: (r) => money(r.total_spent) },
            ]}
          />
          <Pager page={page} total={data.total} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}
    </div>
  )
}
