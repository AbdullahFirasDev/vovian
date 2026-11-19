import { slugify } from '@vovian/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, DataTable, ErrorNote, Modal, PageHeader, Spinner, TextArea, TextField, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { date } from '../../lib/format'
import { STOREFRONT_URL, supabase, unwrap } from '../../lib/supabase'

interface Page { id: string; slug: string; title: string; summary: string | null; body: string; is_published: boolean; seo_title: string | null; seo_description: string | null; updated_at: string; translations: Record<string, Record<string, string>> }
const blank = { id: '', slug: '', title: '', summary: '', body: '', is_published: true, seo_title: '', seo_description: '', ar_title: '', ar_summary: '', ar_body: '' }

export default function Pages() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const [form, setForm] = useState<typeof blank | null>(null)
  const [tab, setTab] = useState<'en' | 'ar'>('en')

  const { data = [], isLoading, error } = useQuery({ queryKey: ['pages'], queryFn: async () => unwrap(await supabase.from('pages').select('*').order('slug')) as Page[] })

  const save = useMutation({
    mutationFn: async () => {
      const f = form!
      if (!f.title.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) throw new Error('Add a title and a valid slug')
      const row = { slug: f.slug, title: f.title, summary: f.summary || null, body: f.body, is_published: f.is_published, seo_title: f.seo_title || null, seo_description: f.seo_description || null, translations: { ar: { title: f.ar_title, summary: f.ar_summary, body: f.ar_body } } }
      if (f.id) unwrap(await supabase.from('pages').update(row).eq('id', f.id))
      else unwrap(await supabase.from('pages').insert(row))
    },
    onSuccess: () => { toast('Page saved'); setForm(null); qc.invalidateQueries({ queryKey: ['pages'] }) },
    onError: (e) => toast(e.message.includes('duplicate') ? 'A page with that slug exists' : e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: async (p: Page) => unwrap(await supabase.from('pages').delete().eq('id', p.id)),
    onSuccess: () => { toast('Page deleted'); qc.invalidateQueries({ queryKey: ['pages'] }) },
  })

  const url = (slug: string) => (slug === 'about' ? '/about' : `/pages/${slug}`)

  return (
    <div>
      <PageHeader title="Pages" description="About, policies and FAQ. Written in Markdown; raw HTML is not allowed." actions={can('content.write') && <Button onClick={() => { setTab('en'); setForm(blank) }}>New page</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Pages"
          rows={data}
          rowKey={(r) => r.id}
          onRowClick={can('content.write') ? (p) => { setTab('en'); setForm({ ...p, summary: p.summary ?? '', seo_title: p.seo_title ?? '', seo_description: p.seo_description ?? '', ar_title: p.translations?.ar?.title ?? '', ar_summary: p.translations?.ar?.summary ?? '', ar_body: p.translations?.ar?.body ?? '' }) } : undefined}
          columns={[
            { key: 't', header: 'Page', render: (r) => <span><span className="block font-medium">{r.title}</span><span className="text-[12px] text-graphite">{url(r.slug)}</span></span> },
            { key: 'a', header: 'Arabic', render: (r) => (r.translations?.ar?.body ? 'Translated' : <span className="text-graphite">Missing</span>) },
            { key: 's', header: 'Status', render: (r) => <Badge tone={r.is_published ? 'dark' : 'neutral'}>{r.is_published ? 'Published' : 'Draft'}</Badge> },
            { key: 'u', header: 'Updated', render: (r) => date(r.updated_at) },
            { key: 'x', header: '', align: 'end', render: (r) => <span className="flex justify-end gap-1"><a href={`${STOREFRONT_URL}${url(r.slug)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="px-2 text-[13px] underline">View</a>{can('content.write') && <Button size="sm" variant="ghost" className="text-error" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Delete “${r.title}”? Links to it will show a not-found page.`, { danger: true })) remove.mutate(r) }}>Delete</Button>}</span> },
          ]}
        />
      )}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit page' : 'New page'} wide>
        {form && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <div className="flex gap-4 border-b border-mist" role="tablist">
              {(['en', 'ar'] as const).map((l) => <button key={l} type="button" role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={`-mb-px cursor-pointer pb-2 text-[14px] ${tab === l ? 'border-b border-ink' : 'text-graphite'}`}>{l === 'en' ? 'English' : 'Arabic'}</button>)}
            </div>
            {tab === 'en' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
                  <TextField label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint={url(form.slug || '…')} />
                </div>
                <TextField label="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                <TextArea label="Body (Markdown)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={14} className="font-mono" hint="## Heading, **bold**, - list, [link](/contact), | tables |" />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="SEO title" value={form.seo_title} maxLength={70} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                  <TextField label="SEO description" value={form.seo_description} maxLength={160} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                </div>
              </>
            ) : (
              <div dir="rtl" className="grid gap-4">
                <TextField label="العنوان" value={form.ar_title} onChange={(e) => setForm({ ...form, ar_title: e.target.value })} />
                <TextField label="الملخص" value={form.ar_summary} onChange={(e) => setForm({ ...form, ar_summary: e.target.value })} />
                <TextArea label="المحتوى (Markdown)" value={form.ar_body} onChange={(e) => setForm({ ...form, ar_body: e.target.value })} rows={14} />
              </div>
            )}
            <Checkbox label="Published" checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>Save page</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
