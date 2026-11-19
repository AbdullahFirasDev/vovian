import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, ErrorNote, Modal, PageHeader, Section, SelectField, Spinner, TextArea, TextField, Thumb, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { STOREFRONT_URL, supabase, unwrap, uploadImage } from '../../lib/supabase'

interface Banner { id: string; placement: string; title: string; subtitle: string | null; body: string | null; image_url: string | null; image_url_secondary: string | null; cta_label: string | null; cta_href: string | null; cta_secondary_label: string | null; cta_secondary_href: string | null; is_active: boolean; position: number; starts_at: string | null; ends_at: string | null; translations: Record<string, Record<string, string>> }
interface SectionRow { id: string; type: string; title: string | null; subtitle: string | null; body: string | null; config: unknown; is_active: boolean; position: number; translations: Record<string, Record<string, string>> }

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (uses the hero banner)', editorial_intro: 'Editorial introduction', categories: 'Shop by category', featured_collections: 'Featured collections',
  new_arrivals: 'New arrivals', campaign: 'Campaign (uses the campaign banner)', best_sellers: 'Best sellers', philosophy: 'Brand philosophy', newsletter: 'Newsletter',
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { toast } = useFeedback()
  return (
    <div className="flex items-end gap-3">
      <Thumb src={value || null} size={40} />
      <TextField label={label} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" hint="Add ?sat=-100 to an Unsplash URL for monochrome" />
      <label className="mb-5 cursor-pointer border border-ink px-3 py-2 text-[13px]">
        Upload
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { onChange((await uploadImage(f, 'content', 'homepage')).url) } catch (err) { toast((err as Error).message, 'error') } }} />
      </label>
    </div>
  )
}

export default function Homepage() {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const editable = can('content.write')
  const [banner, setBanner] = useState<(Banner & { ar: Record<string, string> }) | null>(null)
  const [section, setSection] = useState<(SectionRow & { ar: Record<string, string>; configText: string }) | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['homepage'],
    queryFn: async () => ({
      banners: unwrap(await supabase.from('homepage_banners').select('*').order('placement').order('position')) as Banner[],
      sections: unwrap(await supabase.from('homepage_sections').select('*').order('position')) as SectionRow[],
    }),
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['homepage'] })

  const saveBanner = useMutation({
    mutationFn: async () => {
      const { ar, id, ...b } = banner!
      const row = { ...b, translations: { ...b.translations, ar }, starts_at: b.starts_at || null, ends_at: b.ends_at || null }
      if (id) unwrap(await supabase.from('homepage_banners').update(row).eq('id', id))
      else unwrap(await supabase.from('homepage_banners').insert(row))
    },
    onSuccess: () => { toast('Banner saved — live on the storefront within two minutes'); setBanner(null); refresh() },
    onError: (e) => toast(e.message, 'error'),
  })

  const saveSection = useMutation({
    mutationFn: async () => {
      let config: unknown
      try {
        config = JSON.parse(section!.configText || '{}')
      } catch {
        setConfigError('This isn’t valid JSON')
        throw new Error('Fix the configuration JSON')
      }
      const { ar, configText: _c, id, ...s } = section!
      unwrap(await supabase.from('homepage_sections').update({ ...s, config, translations: { ...s.translations, ar } }).eq('id', id))
    },
    onSuccess: () => { toast('Section saved'); setSection(null); refresh() },
    onError: (e) => toast(e.message, 'error'),
  })

  const move = useMutation({
    mutationFn: async ({ i, d }: { i: number; d: -1 | 1 }) => {
      const list = data!.sections
      const a = list[i]!, b = list[i + d]!
      unwrap(await supabase.from('homepage_sections').update({ position: b.position }).eq('id', a.id))
      unwrap(await supabase.from('homepage_sections').update({ position: a.position }).eq('id', b.id))
    },
    onSuccess: refresh,
  })

  const toggle = useMutation({
    mutationFn: async (s: SectionRow) => unwrap(await supabase.from('homepage_sections').update({ is_active: !s.is_active }).eq('id', s.id)),
    onSuccess: refresh,
  })

  if (isLoading || !data) return <Spinner />

  const newBanner = (placement: string): Banner & { ar: Record<string, string> } => ({ id: '', placement, title: '', subtitle: '', body: '', image_url: '', image_url_secondary: '', cta_label: '', cta_href: '', cta_secondary_label: '', cta_secondary_href: '', is_active: true, position: 0, starts_at: null, ends_at: null, translations: {}, ar: {} })

  return (
    <div>
      <PageHeader title="Homepage" description="Every block on the homepage, in order. Changes appear on the storefront within two minutes." actions={<a href={STOREFRONT_URL} target="_blank" rel="noreferrer" className="text-[13px] underline underline-offset-2">Open storefront ↗</a>} />
      <ErrorNote error={error} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Banners" description="Hero and campaign imagery. The active banner with the lowest order is shown." actions={editable && <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setBanner(newBanner('hero'))}>New hero</Button><Button size="sm" variant="outline" onClick={() => setBanner(newBanner('campaign'))}>New campaign</Button></span>}>
          <ul className="divide-y divide-mist">
            {data.banners.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3">
                <Thumb src={b.image_url} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{b.title}</span>
                  <span className="text-[12px] text-graphite">{b.placement} · {b.subtitle}</span>
                </span>
                <Badge tone={b.is_active ? 'dark' : 'neutral'}>{b.is_active ? 'Live' : 'Off'}</Badge>
                {editable && <Button size="sm" variant="ghost" onClick={() => setBanner({ ...b, subtitle: b.subtitle ?? '', body: b.body ?? '', image_url: b.image_url ?? '', image_url_secondary: b.image_url_secondary ?? '', cta_label: b.cta_label ?? '', cta_href: b.cta_href ?? '', cta_secondary_label: b.cta_secondary_label ?? '', cta_secondary_href: b.cta_secondary_href ?? '', ar: { ...(b.translations?.ar ?? {}) } })}>Edit</Button>}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Sections" description="Reorder or hide blocks.">
          <ol className="divide-y divide-mist">
            {data.sections.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 text-[12px] text-graphite num">{i + 1}</span>
                <span className="min-w-0 flex-1"><span className="block">{SECTION_LABELS[s.type] ?? s.type}</span>{s.title && <span className="text-[12px] text-graphite">{s.title}</span>}</span>
                {editable && (
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move.mutate({ i, d: -1 })} aria-label="Move up">↑</Button>
                    <Button size="sm" variant="ghost" disabled={i === data.sections.length - 1} onClick={() => move.mutate({ i, d: 1 })} aria-label="Move down">↓</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle.mutate(s)}>{s.is_active ? 'Hide' : 'Show'}</Button>
                    <Button size="sm" variant="outline" onClick={() => { setConfigError(null); setSection({ ...s, ar: { ...(s.translations?.ar ?? {}) }, configText: JSON.stringify(s.config, null, 2) }) }}>Edit</Button>
                  </span>
                )}
                {!s.is_active && <Badge>Hidden</Badge>}
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Modal open={!!banner} onClose={() => setBanner(null)} title={banner?.id ? 'Edit banner' : 'New banner'} wide>
        {banner && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveBanner.mutate() }}>
            <SelectField label="Placement" value={banner.placement} onChange={(e) => setBanner({ ...banner, placement: e.target.value })} options={[{ value: 'hero', label: 'Hero' }, { value: 'campaign', label: 'Campaign' }, { value: 'promo_strip', label: 'Promo strip' }]} />
            <TextField label="Order" type="number" value={banner.position} onChange={(e) => setBanner({ ...banner, position: Number(e.target.value) })} />
            <TextField label="Title" required value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} />
            <TextField label="Subtitle" value={banner.subtitle ?? ''} onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })} />
            <TextArea label="Body" value={banner.body ?? ''} onChange={(e) => setBanner({ ...banner, body: e.target.value })} className="md:col-span-2" rows={2} />
            <div className="md:col-span-2"><ImageField label={banner.placement === 'hero' ? 'Left image (women)' : 'Image (shown monochrome)'} value={banner.image_url ?? ''} onChange={(v) => setBanner({ ...banner, image_url: v })} /></div>
            <div className="md:col-span-2"><ImageField label={banner.placement === 'hero' ? 'Right image (men)' : 'Colour image (revealed by the lens)'} value={banner.image_url_secondary ?? ''} onChange={(v) => setBanner({ ...banner, image_url_secondary: v })} /></div>
            <TextField label="Button label" value={banner.cta_label ?? ''} onChange={(e) => setBanner({ ...banner, cta_label: e.target.value })} />
            <TextField label="Button link" value={banner.cta_href ?? ''} onChange={(e) => setBanner({ ...banner, cta_href: e.target.value })} placeholder="/women" />
            <TextField label="Second button label" value={banner.cta_secondary_label ?? ''} onChange={(e) => setBanner({ ...banner, cta_secondary_label: e.target.value })} />
            <TextField label="Second button link" value={banner.cta_secondary_href ?? ''} onChange={(e) => setBanner({ ...banner, cta_secondary_href: e.target.value })} placeholder="/men" />
            <div dir="rtl" className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <TextField label="العنوان" value={banner.ar.title ?? ''} onChange={(e) => setBanner({ ...banner, ar: { ...banner.ar, title: e.target.value } })} />
              <TextField label="العنوان الفرعي" value={banner.ar.subtitle ?? ''} onChange={(e) => setBanner({ ...banner, ar: { ...banner.ar, subtitle: e.target.value } })} />
              <TextArea label="النص" value={banner.ar.body ?? ''} onChange={(e) => setBanner({ ...banner, ar: { ...banner.ar, body: e.target.value } })} className="md:col-span-2" rows={2} />
              <TextField label="نص الزر" value={banner.ar.cta_label ?? ''} onChange={(e) => setBanner({ ...banner, ar: { ...banner.ar, cta_label: e.target.value } })} />
              <TextField label="نص الزر الثاني" value={banner.ar.cta_secondary_label ?? ''} onChange={(e) => setBanner({ ...banner, ar: { ...banner.ar, cta_secondary_label: e.target.value } })} />
            </div>
            <Checkbox label="Live" checked={banner.is_active} onChange={(v) => setBanner({ ...banner, is_active: v })} />
            <div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" onClick={() => setBanner(null)}>Cancel</Button><Button type="submit" loading={saveBanner.isPending}>Save banner</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={!!section} onClose={() => setSection(null)} title={section ? SECTION_LABELS[section.type] ?? 'Section' : ''} wide>
        {section && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveSection.mutate() }}>
            <TextField label="Title" value={section.title ?? ''} onChange={(e) => setSection({ ...section, title: e.target.value })} />
            <TextField label="Subtitle" value={section.subtitle ?? ''} onChange={(e) => setSection({ ...section, subtitle: e.target.value })} />
            <TextArea label="Body" value={section.body ?? ''} onChange={(e) => setSection({ ...section, body: e.target.value })} className="md:col-span-2" rows={3} />
            <div dir="rtl" className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <TextField label="العنوان" value={section.ar.title ?? ''} onChange={(e) => setSection({ ...section, ar: { ...section.ar, title: e.target.value } })} />
              <TextField label="العنوان الفرعي" value={section.ar.subtitle ?? ''} onChange={(e) => setSection({ ...section, ar: { ...section.ar, subtitle: e.target.value } })} />
              <TextArea label="النص" value={section.ar.body ?? ''} onChange={(e) => setSection({ ...section, ar: { ...section.ar, body: e.target.value } })} className="md:col-span-2" rows={3} />
            </div>
            <TextArea
              label="Layout settings (JSON)"
              className="md:col-span-2 font-mono"
              rows={10}
              value={section.configText}
              error={configError}
              hint="Images, links, items and limits for this block. Keep the same keys; edit values."
              onChange={(e) => { setConfigError(null); setSection({ ...section, configText: e.target.value }) }}
            />
            <div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" onClick={() => setSection(null)}>Cancel</Button><Button type="submit" loading={saveSection.isPending}>Save section</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
