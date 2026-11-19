import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Badge, Button, DataTable, ErrorNote, LinkButton, PageHeader, Pager, Spinner, Thumb, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { money } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

const PER_PAGE = 25

interface Row {
  id: string
  name: string
  slug: string
  style_code: string
  department: string
  price: number
  sale_price: number | null
  status: 'draft' | 'active' | 'archived'
  is_featured: boolean
  categories: { name: string } | null
  product_images: { url: string; position: number }[]
  product_variants: { id: string; deleted_at: string | null; inventory: { on_hand: number; reserved: number } | null }[]
}

export default function ProductsList() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const dept = params.get('dept') ?? ''
  const page = Number(params.get('page') ?? 1)
  const [search, setSearch] = useState(q)

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    if (!('page' in patch)) next.delete('page')
    setParams(next)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', q, status, dept, page],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, slug, style_code, department, price, sale_price, status, is_featured, categories(name), product_images(url, position), product_variants(id, deleted_at, inventory(on_hand, reserved))', { count: 'exact' })
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (q) query = query.or(`name.ilike.%${q.replace(/[%,()]/g, '')}%,style_code.ilike.%${q.replace(/[%,()]/g, '')}%`)
      if (status) query = query.eq('status', status)
      if (dept) query = query.eq('department', dept)
      const res = await query
      if (res.error) throw new Error(res.error.message)
      return { rows: (res.data ?? []) as unknown as Row[], total: res.count ?? 0 }
    },
  })

  const duplicate = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.rpc('admin_duplicate_product', { p_product_id: id })) as string,
    onSuccess: (newId) => {
      toast('Product duplicated as a draft')
      qc.invalidateQueries({ queryKey: ['products'] })
      navigate(`/products/${newId}`)
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Row['status'] }) => unwrap(await supabase.from('products').update({ status }).eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: (e) => toast(e.message, 'error'),
  })

  const archive = useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.rpc('admin_archive_product', { p_product_id: id })),
    onSuccess: () => {
      toast('Product deleted from the catalogue')
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const stock = (r: Row) => r.product_variants.filter((v) => !v.deleted_at).reduce((n, v) => n + Math.max(0, (v.inventory?.on_hand ?? 0) - (v.inventory?.reserved ?? 0)), 0)

  return (
    <div>
      <PageHeader
        title="Products"
        description={data ? `${data.total} products` : undefined}
        actions={can('products.write') && <LinkButton to="/products/new">New product</LinkButton>}
      />
      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          set({ q: search })
        }}
      >
        <label className="min-w-64 flex-1">
          <span className="mb-1.5 block text-[13px] text-graphite">Search</span>
          <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or style code" />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] text-graphite">Status</span>
          <select className="field" value={status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] text-graphite">Department</span>
          <select className="field" value={dept} onChange={(e) => set({ dept: e.target.value })}>
            <option value="">All</option><option value="women">Women</option><option value="men">Men</option><option value="unisex">Unisex</option>
          </select>
        </label>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <ErrorNote error={error} />
      {isLoading || !data ? (
        <Spinner />
      ) : (
        <>
          <DataTable
            caption="Products"
            rows={data.rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/products/${r.id}`)}
            columns={[
              {
                key: 'name', header: 'Product', render: (r) => (
                  <span className="flex items-center gap-3">
                    <Thumb src={[...r.product_images].sort((a, b) => a.position - b.position)[0]?.url} size={36} />
                    <span>
                      <span className="block font-medium">{r.name}</span>
                      <span className="text-[12px] text-graphite">{r.style_code} · {r.categories?.name ?? 'Uncategorised'} · {r.department}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'dark' : r.status === 'draft' ? 'outline' : 'neutral'}>{r.status}</Badge> },
              { key: 'stock', header: 'Available', align: 'end', render: (r) => <span className={stock(r) === 0 ? 'text-error' : ''}>{stock(r)}</span> },
              { key: 'price', header: 'Price', align: 'end', render: (r) => (r.sale_price ? <span>{money(r.sale_price)} <s className="text-graphite">{money(r.price)}</s></span> : money(r.price)) },
              {
                key: 'actions', header: '', align: 'end', render: (r) => can('products.write') && (
                  <span className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: r.status === 'active' ? 'draft' : 'active' })}>
                      {r.status === 'active' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicate.mutate(r.id)}>Duplicate</Button>
                    {can('products.delete') && (
                      <Button size="sm" variant="ghost" className="text-error" onClick={async () => (await confirm(`Delete “${r.name}”? It disappears from the store; past orders keep their records.`, { danger: true, confirmLabel: 'Delete product' })) && archive.mutate(r.id)}>
                        Delete
                      </Button>
                    )}
                  </span>
                ),
              },
            ]}
          />
          <Pager page={page} total={data.total} perPage={PER_PAGE} onChange={(p) => set({ page: String(p) })} />
        </>
      )}
    </div>
  )
}
