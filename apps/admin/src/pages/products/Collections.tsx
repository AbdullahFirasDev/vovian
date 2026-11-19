import { slugify } from '@vovian/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, DataTable, ErrorNote, Modal, PageHeader, Spinner, TextArea, TextField, Thumb, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { supabase, unwrap, uploadImage } from '../../lib/supabase'

interface Collection { id: string; slug: string; name: string; subtitle: string | null; description: string | null; cover_image_url: string | null; hero_image_url: string | null; is_featured: boolean; is_active: boolean; position: number; starts_at: string | null; ends_at: string | null; translations: Record<string, Record<string, string>> }

const blank = { slug: '', name: '', subtitle: '', description: '', cover_image_url: '', hero_image_url: '', is_featured: false, is_active: true, position: 0, starts_at: '', ends_at: '', ar_name: '', ar_subtitle: '', ar_description: '' }

function ImageInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { toast } = useFeedback()
  return (
    <div className="flex items-end gap-3">
      <Thumb src={value || null} size={36} />
      <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      <label className="cursor-pointer border border-ink px-3 py-2 text-[13px]">
        Upload
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { onChange((await uploadImage(f, 'content', 'collections')).url) } catch (err) { toast((err as Error).message, 'error') } }} />
      </label>
    </div>
  )
}

export default function Collections() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Collection | 'new' | null>(null)
  const [form, setForm] = useState(blank)

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => unwrap(await supabase.from('collections').select('*, product_collections(count)').is('deleted_at', null).order('position')) as (Collection & { product_collections: { count: number }[] })[],
  })

  function open(c: Collection | 'new') {
    setEditing(c)
    setForm(c === 'new' ? blank : {
      ...c, subtitle: c.subtitle ?? '', description: c.description ?? '', cover_image_url: c.cover_image_url ?? '', hero_image_url: c.hero_image_url ?? '',
      starts_at: c.starts_at?.slice(0, 16) ?? '', ends_at: c.ends_at?.slice(0, 16) ?? '',
      ar_name: c.translations?.ar?.name ?? '', ar_subtitle: c.translations?.ar?.subtitle ?? '', ar_description: c.translations?.ar?.description ?? '',
    })
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) throw new Error('Add a name and a valid slug')
      const { ar_name, ar_subtitle, ar_description, ...rest } = form
      const row = {
        ...rest, subtitle: rest.subtitle || null, description: rest.description || null, cover_image_url: rest.cover_image_url || null, hero_image_url: rest.hero_image_url || null,
        starts_at: rest.starts_at ? new Date(rest.starts_at).toISOString() : null, ends_at: rest.ends_at ? new Date(rest.ends_at).toISOString() : null,
        translations: { ar: { name: ar_name, subtitle: ar_subtitle, description: ar_description } },
      }
      if (editing === 'new') unwrap(await supabase.from('collections').insert(row))
      else unwrap(await supabase.from('collections').update(row).eq('id', (editing as Collection).id))
    },
    onSuccess: () => { toast('Collection saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['collections'] }) },
    onError: (e) => toast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: async (c: Collection) => unwrap(await supabase.from('collections').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', c.id)),
    onSuccess: () => { toast('Collection removed'); qc.invalidateQueries({ queryKey: ['collections'] }) },
  })

  return (
    <div>
      <PageHeader title="Collections" description="Editorial groupings. Featured collections appear on the homepage. Assign products from each product's page." actions={can('products.write') && <Button onClick={() => open('new')}>New collection</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Collections"
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={can('products.write') ? open : undefined}
          columns={[
            { key: 'n', header: 'Collection', render: (r) => <span className="flex items-center gap-3"><Thumb src={r.cover_image_url} size={32} /><span><span className="block font-medium">{r.name}</span><span className="text-[12px] text-graphite">{r.subtitle}</span></span></span> },
            { key: 'p', header: 'Products', align: 'end', render: (r) => r.product_collections?.[0]?.count ?? 0 },
            { key: 'f', header: 'Homepage', render: (r) => (r.is_featured ? <Badge tone="dark">Featured</Badge> : <span className="text-graphite">—</span>) },
            { key: 's', header: 'Status', render: (r) => <Badge tone={r.is_active ? 'outline' : 'neutral'}>{r.is_active ? 'Live' : 'Hidden'}</Badge> },
            { key: 'x', header: '', align: 'end', render: (r) => can('products.delete') && <Button size="sm" variant="ghost" className="text-error" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Remove “${r.name}”?`, { danger: true })) remove.mutate(r) }}>Remove</Button> },
          ]}
        />
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New collection' : 'Edit collection'} wide>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
          <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} />
          <TextField label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint={`/collections/${form.slug}`} />
          <TextField label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <TextField label="Display order" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2" rows={3} />
          <div className="md:col-span-2"><ImageInput label="Cover image (portrait)" value={form.cover_image_url} onChange={(v) => setForm({ ...form, cover_image_url: v })} /></div>
          <div className="md:col-span-2"><ImageInput label="Hero image (wide)" value={form.hero_image_url} onChange={(v) => setForm({ ...form, hero_image_url: v })} /></div>
          <TextField label="Starts" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <TextField label="Ends" type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          <div dir="rtl" className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <TextField label="الاسم" value={form.ar_name} onChange={(e) => setForm({ ...form, ar_name: e.target.value })} />
            <TextField label="العنوان الفرعي" value={form.ar_subtitle} onChange={(e) => setForm({ ...form, ar_subtitle: e.target.value })} />
            <TextArea label="الوصف" value={form.ar_description} onChange={(e) => setForm({ ...form, ar_description: e.target.value })} className="md:col-span-2" rows={2} />
          </div>
          <Checkbox label="Feature on the homepage" checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
          <Checkbox label="Live in the store" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
