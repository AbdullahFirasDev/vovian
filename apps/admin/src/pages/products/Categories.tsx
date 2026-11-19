import { categorySchema } from '@vovian/validation'
import { slugify } from '@vovian/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, DataTable, ErrorNote, Modal, PageHeader, SelectField, Spinner, TextArea, TextField, Thumb, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { supabase, unwrap, uploadImage } from '../../lib/supabase'

interface Category { id: string; name: string; slug: string; department: 'women' | 'men' | 'unisex'; parent_id: string | null; description: string | null; image_url: string | null; position: number; is_active: boolean; translations: Record<string, Record<string, string>> }

const blank = { name: '', slug: '', department: 'women', parent_id: '', description: '', image_url: '', position: 0, is_active: true, ar_name: '' }

export default function Categories() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Category | null | 'new'>(null)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => unwrap(await supabase.from('categories').select('*, products(count)').is('deleted_at', null).order('department').order('position')) as (Category & { products: { count: number }[] })[],
  })

  function open(c: Category | 'new') {
    setErrors({})
    setEditing(c)
    setForm(c === 'new' ? blank : { ...c, parent_id: c.parent_id ?? '', description: c.description ?? '', image_url: c.image_url ?? '', ar_name: c.translations?.ar?.name ?? '' })
  }

  const save = useMutation({
    mutationFn: async () => {
      const { ar_name, ...rest } = form
      const parsed = categorySchema.safeParse({ ...rest, parent_id: rest.parent_id || null, image_url: rest.image_url || null, translations: { ar: { name: ar_name } } })
      if (!parsed.success) {
        setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
        throw new Error('Check the highlighted fields')
      }
      const row = { ...parsed.data, image_url: parsed.data.image_url || null }
      if (editing === 'new') unwrap(await supabase.from('categories').insert(row))
      else unwrap(await supabase.from('categories').update(row).eq('id', (editing as Category).id))
    },
    onSuccess: () => {
      toast('Category saved')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast(e.message.includes('duplicate') ? 'That slug already exists in this department' : e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: async (c: Category) => unwrap(await supabase.from('categories').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', c.id)),
    onSuccess: () => {
      toast('Category removed')
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return (
    <div>
      <PageHeader title="Categories" description="Shown in navigation, filters and URLs like /women/dresses." actions={can('products.write') && <Button onClick={() => open('new')}>New category</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Categories"
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={can('products.write') ? open : undefined}
          columns={[
            { key: 'n', header: 'Category', render: (r) => <span className="flex items-center gap-3"><Thumb src={r.image_url} size={32} /><span><span className="block font-medium">{r.name}</span><span className="text-[12px] text-graphite">/{r.department}/{r.slug}</span></span></span> },
            { key: 'd', header: 'Department', render: (r) => r.department },
            { key: 'p', header: 'Products', align: 'end', render: (r) => r.products?.[0]?.count ?? 0 },
            { key: 's', header: 'Status', render: (r) => <Badge tone={r.is_active ? 'dark' : 'neutral'}>{r.is_active ? 'Visible' : 'Hidden'}</Badge> },
            { key: 'o', header: 'Order', align: 'end', render: (r) => r.position },
            {
              key: 'x', header: '', align: 'end', render: (r) => can('products.delete') && (
                <Button size="sm" variant="ghost" className="text-error" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Remove “${r.name}”? Products keep their data but lose this category.`, { danger: true })) remove.mutate(r) }}>Remove</Button>
              ),
            },
          ]}
        />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'New category' : 'Edit category'}>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
          <TextField label="Name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} />
          <TextField label="Arabic name" dir="rtl" value={form.ar_name} onChange={(e) => setForm({ ...form, ar_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Slug" required value={form.slug} error={errors.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <SelectField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={[{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'unisex', label: 'Unisex' }]} />
          </div>
          <SelectField label="Parent" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} options={[{ value: '', label: 'None (top level)' }, ...rows.filter((r) => r.department === form.department && (editing === 'new' || r.id !== (editing as Category)?.id)).map((r) => ({ value: r.id, label: r.name }))]} />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="flex items-end gap-3">
            <TextField label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="flex-1" error={errors.image_url} />
            <label className="cursor-pointer border border-ink px-3 py-2 text-[13px]">
              Upload
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const { url } = await uploadImage(f, 'products', 'categories'); setForm((x) => ({ ...x, image_url: url })) } catch (err) { toast((err as Error).message, 'error') } }} />
            </label>
          </div>
          <TextField label="Display order" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
          <Checkbox label="Visible in the store" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
