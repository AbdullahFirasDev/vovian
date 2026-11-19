import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Badge, Button, Checkbox, ErrorNote, Modal, PageHeader, Section, SelectField, Spinner, TextArea, TextField, Thumb, useFeedback } from '../components/ui'
import { useAccess } from '../lib/access'
import { currency, money } from '../lib/format'
import { supabase, unwrap, uploadImage } from '../lib/supabase'

type Json = Record<string, any>
const TABS = ['Store', 'Localisation & tax', 'Shipping', 'Payments', 'Notifications', 'Social & SEO', 'Maintenance'] as const

function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const rows = unwrap(await supabase.from('store_settings').select('key, value, is_public')) as { key: string; value: any; is_public: boolean }[]
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Json
    },
  })
}

function SettingForm({ settingKey, initial, isPublic = true, toValue = (v) => v, children }: { settingKey: string; initial: Json; isPublic?: boolean; toValue?: (v: Json) => unknown; children: (v: Json, set: (patch: Json) => void) => React.ReactNode }) {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [value, setValue] = useState<Json>(initial)
  useEffect(() => setValue(initial), [initial])
  const save = useMutation({
    mutationFn: async () => unwrap(await supabase.from('store_settings').upsert({ key: settingKey, value: toValue(value), is_public: isPublic })),
    onSuccess: () => { toast('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }) },
    onError: (e) => toast(e.message, 'error'),
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
      <fieldset disabled={!can('settings.write')} className="grid gap-4">
        {children(value, (patch) => setValue((v) => ({ ...v, ...patch })))}
        {can('settings.write') && <Button type="submit" className="w-fit" loading={save.isPending}>Save</Button>}
      </fieldset>
    </form>
  )
}

function ShippingSettings() {
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const editable = can('settings.write')
  const [zone, setZone] = useState<Json | null>(null)
  const [method, setMethod] = useState<Json | null>(null)
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['shipping'],
    queryFn: async () => unwrap(await supabase.from('shipping_zones').select('*, shipping_methods(*)').order('position')) as Json[],
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['shipping'] })
  const { data: governorates = [] } = useGovernorates()
  const govName = (code: string) => (code === '*' ? 'All other governorates' : governorates.find((g) => g.code === code)?.name ?? code)

  const saveZone = useMutation({
    mutationFn: async () => {
      const regions = zone!.regions as string[]
      if (!zone!.name?.trim() || !regions.length) throw new Error('Add a name and choose at least one governorate')
      const row = { name: zone!.name, regions, is_active: zone!.is_active, position: Number(zone!.position) || 0 }
      if (zone!.id) unwrap(await supabase.from('shipping_zones').update(row).eq('id', zone!.id))
      else unwrap(await supabase.from('shipping_zones').insert(row))
    },
    onSuccess: () => { toast('Zone saved'); setZone(null); refresh() },
    onError: (e) => toast(e.message, 'error'),
  })
  const saveMethod = useMutation({
    mutationFn: async () => {
      const m = method!
      const row = {
        zone_id: m.zone_id, code: m.code, name: m.name, description: m.description || null, rate: Number(m.rate), free_over: m.free_over === '' || m.free_over == null ? null : Number(m.free_over),
        min_days: Number(m.min_days), max_days: Number(m.max_days), is_active: m.is_active, position: Number(m.position) || 0,
        translations: { ar: { name: m.ar_name ?? '', description: m.ar_description ?? '' } },
      }
      if (!row.name || !/^[a-z0-9_-]+$/.test(row.code) || Number.isNaN(row.rate)) throw new Error('Add a name, a lowercase code and a rate')
      if (m.id) unwrap(await supabase.from('shipping_methods').update(row).eq('id', m.id))
      else unwrap(await supabase.from('shipping_methods').insert(row))
    },
    onSuccess: () => { toast('Delivery method saved'); setMethod(null); refresh() },
    onError: (e) => toast(e.message, 'error'),
  })

  if (isLoading) return <Spinner />
  return (
    <div className="grid gap-6">
      {editable && <Button className="w-fit" variant="outline" onClick={() => setZone({ name: '', regions: [], is_active: true, position: zones.length + 1 })}>New zone</Button>}
      {zones.map((z) => (
        <Section
          key={z.id}
          title={z.name}
          description={(z.regions as string[]).map(govName).join(', ')}
          actions={editable && <span className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setZone({ ...z, regions: [...z.regions] })}>Edit zone</Button><Button size="sm" variant="outline" onClick={() => setMethod({ zone_id: z.id, code: '', name: '', description: '', rate: '', free_over: '', min_days: 2, max_days: 5, is_active: true, position: z.shipping_methods.length + 1 })}>Add method</Button></span>}
        >
          <ul className="divide-y divide-mist">
            {[...z.shipping_methods].sort((a: Json, b: Json) => a.position - b.position).map((m: Json) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 py-2.5">
                <span className="min-w-0 flex-1"><span className="block font-medium">{m.name}</span><span className="text-[12px] text-graphite">{m.max_days === 0 ? 'Same day' : `${m.min_days}–${m.max_days} business days`} · {m.description}</span></span>
                <span className="num">{money(m.rate)}{m.free_over != null && <span className="block text-[12px] text-graphite">Free over {money(m.free_over)}</span>}</span>
                {!m.is_active && <Badge>Off</Badge>}
                {editable && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setMethod({ ...m, free_over: m.free_over ?? '', ar_name: m.translations?.ar?.name ?? '', ar_description: m.translations?.ar?.description ?? '' })}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-error" onClick={async () => { if (await confirm(`Delete ${m.name}?`, { danger: true })) { unwrap(await supabase.from('shipping_methods').delete().eq('id', m.id)); refresh() } }}>Delete</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <Modal open={!!zone} onClose={() => setZone(null)} title={zone?.id ? 'Edit zone' : 'New zone'}>
        {zone && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); saveZone.mutate() }}>
            <TextField label="Name" value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} required />
            <fieldset>
              <legend className="mb-2 text-[13px] text-graphite">Governorates in this zone</legend>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto border border-mist p-3">
                <Checkbox label="All other governorates (*)" checked={zone.regions.includes('*')} onChange={(on) => setZone({ ...zone, regions: on ? [...zone.regions, '*'] : zone.regions.filter((r: string) => r !== '*') })} />
                {governorates.map((g) => (
                  <Checkbox key={g.code} label={g.name} checked={zone.regions.includes(g.code)} onChange={(on) => setZone({ ...zone, regions: on ? [...zone.regions, g.code] : zone.regions.filter((r: string) => r !== g.code) })} />
                ))}
              </div>
              <p className="mt-1 text-[12px] text-graphite">A governorate listed in a zone always wins over “all other governorates”.</p>
            </fieldset>
            <TextField label="Priority" type="number" value={zone.position} onChange={(e) => setZone({ ...zone, position: e.target.value })} />
            <Checkbox label="Active" checked={zone.is_active} onChange={(v) => setZone({ ...zone, is_active: v })} />
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setZone(null)}>Cancel</Button><Button type="submit" loading={saveZone.isPending}>Save</Button></div>
          </form>
        )}
      </Modal>
      <Modal open={!!method} onClose={() => setMethod(null)} title={method?.id ? 'Edit delivery method' : 'New delivery method'} wide>
        {method && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveMethod.mutate() }}>
            <TextField label="Name" value={method.name} onChange={(e) => setMethod({ ...method, name: e.target.value })} required />
            <TextField label="Code" value={method.code} onChange={(e) => setMethod({ ...method, code: e.target.value.toLowerCase() })} hint="e.g. standard, express" required />
            <TextField label="Description" value={method.description ?? ''} onChange={(e) => setMethod({ ...method, description: e.target.value })} className="md:col-span-2" />
            <TextField label={`Rate (${currency()})`} inputMode="decimal" value={method.rate} onChange={(e) => setMethod({ ...method, rate: e.target.value })} required />
            <TextField label={`Free over (${currency()})`} inputMode="decimal" value={method.free_over} onChange={(e) => setMethod({ ...method, free_over: e.target.value })} hint="Blank for never free" />
            <TextField label="Min days (0 = same day)" type="number" value={method.min_days} onChange={(e) => setMethod({ ...method, min_days: e.target.value })} />
            <TextField label="Max days" type="number" value={method.max_days} onChange={(e) => setMethod({ ...method, max_days: e.target.value })} />
            <TextField label="الاسم بالعربية" dir="rtl" value={method.ar_name ?? ''} onChange={(e) => setMethod({ ...method, ar_name: e.target.value })} />
            <TextField label="الوصف بالعربية" dir="rtl" value={method.ar_description ?? ''} onChange={(e) => setMethod({ ...method, ar_description: e.target.value })} />
            <Checkbox label="Active" checked={method.is_active} onChange={(v) => setMethod({ ...method, is_active: v })} />
            <div className="flex justify-end gap-2 md:col-span-2"><Button variant="outline" onClick={() => setMethod(null)}>Cancel</Button><Button type="submit" loading={saveMethod.isPending}>Save</Button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function useGovernorates() {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: async () => unwrap(await supabase.from('governorates').select('*').order('position')) as { code: string; name: string; is_active: boolean; region: string; translations: Json }[],
  })
}

function GovernorateSelect({ label, value, onChange }: { label: string; value: string; onChange: (code: string) => void }) {
  const { data = [] } = useGovernorates()
  return <SelectField label={label} value={value} onChange={(e) => onChange(e.target.value)} options={data.map((g) => ({ value: g.code, label: g.name }))} />
}

/** Pause or resume delivery to a governorate (hidden from checkout when off). */
function GovernorateAvailability() {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const { data = [], isLoading } = useGovernorates()
  const toggle = useMutation({
    mutationFn: async (g: { code: string; is_active: boolean }) => unwrap(await supabase.from('governorates').update({ is_active: !g.is_active }).eq('code', g.code)),
    onSuccess: () => { toast('Delivery area updated'); qc.invalidateQueries({ queryKey: ['governorates'] }) },
    onError: (e) => toast(e.message, 'error'),
  })
  return (
    <Section title="Delivery governorates" description="Turn a governorate off to stop taking orders for it. Existing orders are not affected.">
      {isLoading ? <Spinner /> : (
        <ul className="grid gap-x-6 sm:grid-cols-2">
          {data.map((g) => (
            <li key={g.code} className="flex items-center justify-between border-b border-mist py-2 text-[14px]">
              <span>{g.name} <span className="text-graphite" dir="rtl">{g.translations?.ar?.name}</span>{g.region === 'kurdistan' && <span className="ms-2 text-[12px] text-graphite">Kurdistan Region</span>}</span>
              {can('settings.write')
                ? <Button size="sm" variant={g.is_active ? 'ghost' : 'outline'} onClick={() => toggle.mutate(g)}>{g.is_active ? 'Delivering' : 'Paused'}</Button>
                : <Badge tone={g.is_active ? 'dark' : 'neutral'}>{g.is_active ? 'Delivering' : 'Paused'}</Badge>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Store')
  const { data: s, isLoading, error } = useSettings()
  const { toast } = useFeedback()

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-mist" role="tablist">
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px cursor-pointer pb-3 text-[14px] ${tab === t ? 'border-b border-ink' : 'text-graphite hover:text-ink'}`}>{t}</button>)}
      </div>
      <ErrorNote error={error} />
      {isLoading || !s ? <Spinner /> : (
        <div className="max-w-3xl">
          {tab === 'Store' && (
            <Section title="Store information" description="Shown in the footer, contact page and invoices.">
              <SettingForm settingKey="store" initial={s.store ?? {}}>
                {(v, set) => (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField label="Store name" value={v.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
                      <TextField label="Legal name" value={v.legal_name ?? ''} onChange={(e) => set({ legal_name: e.target.value })} />
                      <TextField label="Email" type="email" value={v.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
                      <TextField label="Phone" value={v.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
                    </div>
                    <TextField label="Address" value={v.address ?? ''} onChange={(e) => set({ address: e.target.value })} />
                    <TextField label="Opening hours" value={v.hours ?? ''} onChange={(e) => set({ hours: e.target.value })} />
                    <TextField label="Tagline" value={v.tagline ?? ''} onChange={(e) => set({ tagline: e.target.value })} />
                    <div className="flex items-end gap-3">
                      <Thumb src={v.logo_url} size={40} />
                      <TextField label="Logo URL" value={v.logo_url ?? ''} onChange={(e) => set({ logo_url: e.target.value || null })} className="flex-1" />
                      <label className="cursor-pointer border border-ink px-3 py-2 text-[13px]">Upload<input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { set({ logo_url: (await uploadImage(f, 'brand')).url }) } catch (err) { toast((err as Error).message, 'error') } }} /></label>
                    </div>
                  </>
                )}
              </SettingForm>
            </Section>
          )}

          {tab === 'Localisation & tax' && (
            <div className="grid gap-6">
              <Section title="Currency">
                <SettingForm settingKey="currency" initial={s.currency ?? {}}>
                  {(v, set) => (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField label="Currency code (ISO 4217)" value={v.code ?? ''} maxLength={3} onChange={(e) => set({ code: e.target.value.toUpperCase() })} hint="Prices are stored in this currency (IQD for Iraqi dinar)" />
                      <TextField label="Symbol" value={v.symbol ?? ''} onChange={(e) => set({ symbol: e.target.value })} />
                    </div>
                  )}
                </SettingForm>
              </Section>
              <Section title="Languages">
                <SettingForm settingKey="languages" initial={s.languages ?? {}}>
                  {(v, set) => (
                    <>
                      <Checkbox label="English (default, always on)" checked onChange={() => {}} />
                      <Checkbox label="Arabic (right-to-left)" checked={(v.enabled ?? []).includes('ar')} onChange={(on) => set({ enabled: on ? ['en', 'ar'] : ['en'] })} />
                    </>
                  )}
                </SettingForm>
              </Section>
              <Section title="Tax" description="Prices are tax-inclusive by default; the tax portion is shown at checkout and on invoices.">
                <SettingForm settingKey="tax" initial={s.tax ?? {}}>
                  {(v, set) => (
                    <>
                      <Checkbox label="Charge tax" checked={!!v.enabled} onChange={(on) => set({ enabled: on })} />
                      <Checkbox label="Prices include tax" checked={v.inclusive !== false} onChange={(on) => set({ inclusive: on })} hint="Off: tax is added on top of prices at checkout" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField label="Label" value={v.label ?? ''} onChange={(e) => set({ label: e.target.value })} />
                        <TextField label="Default rate (%)" inputMode="decimal" value={String(Math.round((v.rate ?? 0) * 10000) / 100)} onChange={(e) => set({ rate: Number(e.target.value) / 100 })} />
                      </div>
                      <TextArea
                        label="Rates by governorate"
                        rows={5}
                        value={Object.entries(v.rates ?? {}).map(([c, r]) => `${c} ${Math.round(Number(r) * 10000) / 100}`).join('\n')}
                        onChange={(e) => set({ rates: Object.fromEntries(e.target.value.split('\n').map((l) => l.trim().split(/\s+/)).filter((p) => /^[a-z0-9-]+$/i.test(p[0] ?? '') && p[1]).map(([c, r]) => [c!.toLowerCase(), Number(r) / 100])) })}
                        hint="One per line: governorate code and percent, e.g. “baghdad 2”"
                      />
                    </>
                  )}
                </SettingForm>
              </Section>
              <Section title="Checkout">
                <SettingForm settingKey="checkout" initial={s.checkout ?? {}}>
                  {(v, set) => (
                    <>
                      <GovernorateSelect label="Default governorate at checkout" value={v.default_governorate ?? 'baghdad'} onChange={(code) => set({ default_governorate: code, country: 'IQ' })} />
                      <Checkbox label="Allow guest checkout" checked={v.guest_checkout !== false} onChange={(on) => set({ guest_checkout: on })} />
                    </>
                  )}
                </SettingForm>
              </Section>
              <GovernorateAvailability />
            </div>
          )}

          {tab === 'Shipping' && <ShippingSettings />}

          {tab === 'Payments' && (
            <Section title="Payment methods" description="Orders are always created first and confirmed by staff or a verified provider webhook. Nothing is charged in the browser.">
              <SettingForm settingKey="payment_methods" initial={{ list: s.payment_methods ?? [] }} toValue={(v) => v.list}>
                {(v, set) => {
                  const list = (v.list ?? []) as Json[]
                  const upd = (i: number, patch: Json) => set({ list: list.map((m, j) => (j === i ? { ...m, ...patch } : m)) })
                  return (
                    <>
                      {list.map((m, i) => (
                        <div key={m.code} className="grid gap-3 border border-mist p-4">
                          <div className="flex items-center justify-between">
                            <Checkbox label={`${m.label} (${m.code})`} checked={!!m.enabled} onChange={(on) => upd(i, { enabled: on })} />
                            {m.provider && <Badge>Requires {m.provider} integration</Badge>}
                          </div>
                          <TextField label="Label" value={m.label} onChange={(e) => upd(i, { label: e.target.value })} />
                          <TextField label="Description" value={m.description ?? ''} onChange={(e) => upd(i, { description: e.target.value })} />
                          {m.code === 'manual' && <TextArea label="Payment instructions" rows={3} value={m.instructions ?? ''} onChange={(e) => upd(i, { instructions: e.target.value })} />}
                        </div>
                      ))}
                    </>
                  )
                }}
              </SettingForm>
            </Section>
          )}

          {tab === 'Notifications' && (
            <Section title="Staff notifications">
              <SettingForm settingKey="notifications" initial={s.notifications ?? {}} isPublic={false}>
                {(v, set) => (
                  <>
                    <TextField label="Order emails to" type="email" value={v.order_email ?? ''} onChange={(e) => set({ order_email: e.target.value })} />
                    <TextField label="Stock alerts to" type="email" value={v.low_stock_email ?? ''} onChange={(e) => set({ low_stock_email: e.target.value })} />
                    <Checkbox label="Notify on new orders" checked={!!v.notify_on_order} onChange={(on) => set({ notify_on_order: on })} />
                    <Checkbox label="Notify on low stock" checked={!!v.notify_on_low_stock} onChange={(on) => set({ notify_on_low_stock: on })} />
                    <p className="text-[12px] text-graphite">In-app notifications always appear under Notifications. Email delivery uses the RESEND_API_KEY configured on the edge functions.</p>
                  </>
                )}
              </SettingForm>
            </Section>
          )}

          {tab === 'Social & SEO' && (
            <div className="grid gap-6">
              <Section title="Search defaults">
                <SettingForm settingKey="seo" initial={s.seo ?? {}}>
                  {(v, set) => (
                    <>
                      <TextField label="Site title" value={v.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
                      <TextField label="Title template" value={v.title_template ?? ''} onChange={(e) => set({ title_template: e.target.value })} hint="%s is replaced by the page title" />
                      <TextArea label="Default description" value={v.description ?? ''} maxLength={160} onChange={(e) => set({ description: e.target.value })} rows={2} />
                      <TextField label="Default share image URL" value={v.og_image ?? ''} onChange={(e) => set({ og_image: e.target.value })} />
                    </>
                  )}
                </SettingForm>
              </Section>
              <Section title="Social links">
                <SettingForm settingKey="social" initial={s.social ?? {}}>
                  {(v, set) => (
                    <>
                      {['instagram', 'tiktok', 'pinterest', 'facebook', 'x'].map((k) => <TextField key={k} label={k[0]!.toUpperCase() + k.slice(1)} type="url" value={v[k] ?? ''} onChange={(e) => set({ [k]: e.target.value || undefined })} />)}
                    </>
                  )}
                </SettingForm>
              </Section>
            </div>
          )}

          {tab === 'Maintenance' && (
            <div className="grid gap-6">
              <Section title="Announcement bar">
                <SettingForm settingKey="announcement" initial={s.announcement ?? {}}>
                  {(v, set) => (
                    <>
                      <Checkbox label="Show announcement" checked={!!v.enabled} onChange={(on) => set({ enabled: on })} />
                      <TextField label="Text" value={v.text ?? ''} onChange={(e) => set({ text: e.target.value })} />
                      <TextField label="Arabic text" dir="rtl" value={v.translations?.ar?.text ?? ''} onChange={(e) => set({ translations: { ...v.translations, ar: { text: e.target.value } } })} />
                      <TextField label="Link" value={v.href ?? ''} onChange={(e) => set({ href: e.target.value })} />
                    </>
                  )}
                </SettingForm>
              </Section>
              <Section title="Maintenance mode" description="Shows a notice across the storefront. Browsing and checkout stay available.">
                <SettingForm settingKey="maintenance" initial={s.maintenance ?? {}}>
                  {(v, set) => (
                    <>
                      <Checkbox label="Show maintenance notice" checked={!!v.enabled} onChange={(on) => set({ enabled: on })} />
                      <TextField label="Message" value={v.message ?? ''} onChange={(e) => set({ message: e.target.value })} />
                    </>
                  )}
                </SettingForm>
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
