import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorNote, PageHeader, Pager, Spinner } from '../components/ui'
import { date } from '../lib/format'
import { supabase, unwrap } from '../lib/supabase'

interface Log { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; changes: Record<string, unknown> | null; created_at: string }
const PER_PAGE = 40

export default function Audit() {
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', page, entity],
    queryFn: async () => {
      let q = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (entity) q = q.eq('entity', entity)
      const res = await q
      if (res.error) throw new Error(res.error.message)
      const logs = (res.data ?? []) as Log[]
      const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))] as string[]
      const actors = actorIds.length ? (unwrap(await supabase.from('profiles').select('id, full_name, email').in('id', actorIds)) as { id: string; full_name: string | null; email: string }[]) : []
      return { logs, total: res.count ?? 0, actors: new Map(actors.map((a) => [a.id, a.full_name ?? a.email])) }
    },
  })

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every staff change to products, prices, orders, settings, content and roles."
        actions={
          <select className="field" aria-label="Filter by area" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1) }}>
            <option value="">All areas</option>
            {['orders', 'products', 'product_variants', 'discount_codes', 'store_settings', 'user_roles', 'homepage_banners', 'homepage_sections', 'pages', 'categories', 'collections', 'shipping_methods', 'profiles'].map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        }
      />
      <ErrorNote error={error} />
      {isLoading || !data ? <Spinner /> : (
        <>
          <ul className="divide-y divide-mist border-y border-mist">
            {data.logs.map((l) => (
              <li key={l.id}>
                <button type="button" className="flex w-full cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-start hover:bg-paper" aria-expanded={open === l.id} onClick={() => setOpen(open === l.id ? null : l.id)}>
                  <span className="w-40 shrink-0 text-[13px] text-graphite">{date(l.created_at, true)}</span>
                  <span className="w-48 shrink-0">{l.actor_id ? data.actors.get(l.actor_id) ?? 'Staff' : 'System / customer'}</span>
                  <span className="font-medium">{l.action}</span>
                  <span className="text-graphite">{l.entity} <span className="font-mono text-[12px]">{l.entity_id?.slice(0, 8)}</span></span>
                </button>
                {open === l.id && <pre className="mb-3 overflow-x-auto bg-paper p-3 text-[12px]">{JSON.stringify(l.changes, null, 2)}</pre>}
              </li>
            ))}
          </ul>
          <Pager page={page} total={data.total} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}
    </div>
  )
}
