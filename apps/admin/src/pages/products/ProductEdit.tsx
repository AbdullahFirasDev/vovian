import { productSchema } from '@vovian/validation'
import { slugify, sortSizes } from '@vovian/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Badge, Button, Checkbox, ErrorNote, PageHeader, Section, SelectField, Spinner, TextArea, TextField, Thumb, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { currency } from '../../lib/format'
import { STOREFRONT_URL, supabase, unwrap, uploadImage } from '../../lib/supabase'

interface Variant { id?: string; sku: string; color: string | null; size: string | null; price: string; sale_price: string; is_active: boolean; on_hand?: number; threshold?: number; newStock?: string }
interface Image { id?: string; url: string; storage_path?: string | null; alt: string; color: string | null; position: number; _delete?: boolean }
interface ColorOpt { value: string; hex: string; ar: string }

const emptyForm = {
  name: '', slug: '', style_code: '', department: 'women', category_id: '' as string, price: '', sale_price: '', status: 'draft',
  description: '', material: '', care: '', fit: '', details: '', size_guide: 'apparel', is_featured: false, is_new_arrival: true,
  is_best_seller: false, tags: '', seo_title: '', seo_description: '',
  ar_name: '', ar_description: '', ar_material: '', ar_care: '',
}
type Form = typeof emptyForm

const PRESET_SIZES: Record<string, string[]> = {
  'Women apparel': ['XS', 'S', 'M', 'L', 'XL'],
  'Men apparel': ['S', 'M', 'L', 'XL', 'XXL'],
  'Women denim': ['25', '26', '27', '28', '29', '30', '31'],
  'Men denim': ['28', '29', '30', '31', '32', '34', '36'],
  'Women shoes': ['36', '37', '38', '39', '40', '41'],
  'Men shoes': ['40', '41', '42', '43', '44', '45'],
  'One size': ['One Size'],
}

export default function ProductEdit() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = useAccess()
  const { toast, confirm } = useFeedback()
  const editable = can('products.write')

  const [form, setForm] = useState<Form>(emptyForm)
  const [colors, setColors] = useState<ColorOpt[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [collectionIds, setCollectionIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [newColor, setNewColor] = useState<ColorOpt>({ value: '', hex: '#000000', ar: '' })
  const [newSize, setNewSize] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => unwrap(await supabase.from('categories').select('id, name, department').is('deleted_at', null).order('department').order('position')),
  })
  const { data: collections = [] } = useQuery({
    queryKey: ['collections-all'],
    queryFn: async () => unwrap(await supabase.from('collections').select('id, name').is('deleted_at', null).order('position')),
  })

  const { data: loaded, isLoading, error } = useQuery({
    queryKey: ['product', id],
    enabled: !isNew,
    queryFn: async () => {
      const p = unwrap(await supabase
        .from('products')
        .select('*, product_options(*), product_variants(*, inventory(on_hand, reserved, low_stock_threshold)), product_images(*), product_collections(collection_id)')
        .eq('id', id!)
        .single())
      return p as Record<string, any>
    },
  })

  useEffect(() => {
    if (!loaded) return
    const ar = loaded.translations?.ar ?? {}
    setForm({
      name: loaded.name, slug: loaded.slug, style_code: loaded.style_code, department: loaded.department, category_id: loaded.category_id ?? '',
      price: String(loaded.price), sale_price: loaded.sale_price != null ? String(loaded.sale_price) : '', status: loaded.status,
      description: loaded.description ?? '', material: loaded.material ?? '', care: loaded.care ?? '', fit: loaded.fit ?? '',
      details: (loaded.details ?? []).join('\n'), size_guide: loaded.size_guide, is_featured: loaded.is_featured,
      is_new_arrival: loaded.is_new_arrival, is_best_seller: loaded.is_best_seller, tags: (loaded.tags ?? []).join(', '),
      seo_title: loaded.seo_title ?? '', seo_description: loaded.seo_description ?? '',
      ar_name: ar.name ?? '', ar_description: ar.description ?? '', ar_material: ar.material ?? '', ar_care: ar.care ?? '',
    })
    const opts = (loaded.product_options ?? []) as any[]
    setColors(opts.filter((o) => o.kind === 'color').sort((a, b) => a.position - b.position).map((o) => ({ value: o.value, hex: o.swatch_hex ?? '#000000', ar: o.translations?.ar?.label ?? '' })))
    setSizes(sortSizes(opts.filter((o) => o.kind === 'size').sort((a, b) => a.position - b.position).map((o) => o.value)))
    setVariants(((loaded.product_variants ?? []) as any[]).filter((v) => !v.deleted_at).sort((a, b) => a.position - b.position).map((v) => ({
      id: v.id, sku: v.sku, color: v.color, size: v.size, price: v.price != null ? String(v.price) : '', sale_price: v.sale_price != null ? String(v.sale_price) : '',
      is_active: v.is_active, on_hand: v.inventory?.on_hand ?? 0, threshold: v.inventory?.low_stock_threshold ?? 3,
    })))
    setImages(((loaded.product_images ?? []) as any[]).sort((a, b) => a.position - b.position).map((i) => ({ id: i.id, url: i.url, storage_path: i.storage_path, alt: i.alt ?? '', color: i.color, position: i.position })))
    setCollectionIds(((loaded.product_collections ?? []) as any[]).map((c) => c.collection_id))
  }, [loaded])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === 'name' && !slugTouched) next.slug = slugify(String(v))
      return next
    })
  }

  // ── Variant matrix ──────────────────────────────────────────────────────
  const colorCode = (c: string) => (c.includes(' ') ? c.split(/\s+/).map((w) => w[0]).join('') : c.slice(0, 3)).toUpperCase()
  const sizeCode = (s: string) => (s === 'One Size' ? 'OS' : s.toUpperCase())
  function generateVariants() {
    const base = form.style_code.trim().toUpperCase() || 'SKU'
    const combos = (colors.length ? colors.map((c) => c.value) : [null]).flatMap((c) => (sizes.length ? sizes : [null]).map((s) => [c, s] as const))
    const existing = new Set(variants.map((v) => `${v.color}|${v.size}`))
    const added = combos
      .filter(([c, s]) => !existing.has(`${c}|${s}`))
      .map(([c, s]) => ({ sku: [base, c && colorCode(c), s && sizeCode(s)].filter(Boolean).join('-'), color: c, size: s, price: '', sale_price: '', is_active: true, newStock: '0' }))
    setVariants((v) => [...v, ...added])
    toast(added.length ? `Added ${added.length} variant${added.length === 1 ? '' : 's'}` : 'All combinations already exist')
  }
  const updateVariant = (i: number, patch: Partial<Variant>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)))

  // ── Images ──────────────────────────────────────────────────────────────
  async function onUpload(files: FileList | null) {
    if (!files?.length || !id) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const { url, path } = await uploadImage(file, 'products', id)
        setImages((imgs) => [...imgs, { url, storage_path: path, alt: form.name, color: null, position: imgs.length }])
      }
      toast('Images uploaded. Save to publish them.')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setUploading(false)
    }
  }
  const moveImage = (i: number, d: -1 | 1) => setImages((imgs) => {
    const next = [...imgs]
    const j = i + d
    if (j < 0 || j >= next.length) return imgs
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    return next
  })

  const visibleImages = images.filter((i) => !i._delete)

  // ── Save ────────────────────────────────────────────────────────────────
  async function save() {
    setErrors({})
    const translations = { ...(loaded?.translations ?? {}), ar: { name: form.ar_name, description: form.ar_description, material: form.ar_material, care: form.ar_care } }
    const parsed = productSchema.safeParse({
      ...form,
      category_id: form.category_id || null,
      details: form.details.split('\n').map((d) => d.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      translations,
    })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      toast('Check the highlighted fields', 'error')
      return
    }
    const dupSku = variants.map((v) => v.sku.trim().toUpperCase()).find((s, i, a) => a.indexOf(s) !== i)
    if (dupSku) return toast(`SKU ${dupSku} is used twice`, 'error')
    if (form.status === 'active' && !variants.some((v) => v.is_active)) return toast('Add at least one active variant before publishing', 'error')

    setSaving(true)
    try {
      const p = parsed.data
      const row = { ...p, seo_title: p.seo_title || null, seo_description: p.seo_description || null }
      let productId = id
      if (isNew) {
        const created = unwrap(await supabase.from('products').insert(row).select('id').single())
        productId = created.id
      } else {
        unwrap(await supabase.from('products').update(row).eq('id', id!))
      }

      // Options: upsert the new ordered sets FIRST, then remove only what was
      // dropped — a failed write can never leave a product without options.
      // Every row carries identical keys: PostgREST bulk writes send NULL for
      // keys missing from some rows, which would violate NOT NULL defaults.
      const optionRows = [
        ...colors.map((c, i) => ({ product_id: productId!, kind: 'color' as const, value: c.value, swatch_hex: c.hex, translations: c.ar ? { ar: { label: c.ar } } : {}, position: i })),
        ...sizes.map((s, i) => ({ product_id: productId!, kind: 'size' as const, value: s, swatch_hex: null, translations: s === 'One Size' ? { ar: { label: 'مقاس واحد' } } : {}, position: i })),
      ]
      const kept = optionRows.length
        ? (unwrap(await supabase.from('product_options').upsert(optionRows, { onConflict: 'product_id,kind,value' }).select('id')) as { id: string }[]).map((o) => o.id)
        : []
      let dropOptions = supabase.from('product_options').delete().eq('product_id', productId!)
      if (kept.length) dropOptions = dropOptions.not('id', 'in', `(${kept.join(',')})`)
      unwrap(await dropOptions)

      // Variants: update existing, insert new, soft-delete removed
      const keep = new Set(variants.filter((v) => v.id).map((v) => v.id!))
      const removed = ((loaded?.product_variants ?? []) as any[]).filter((v) => !v.deleted_at && !keep.has(v.id))
      for (const v of removed) unwrap(await supabase.from('product_variants').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', v.id))
      for (const [i, v] of variants.entries()) {
        const vrow = {
          product_id: productId!, sku: v.sku.trim().toUpperCase(), color: v.color, size: v.size, position: i, is_active: v.is_active,
          price: v.price === '' ? null : Number(v.price), sale_price: v.sale_price === '' ? null : Number(v.sale_price),
        }
        if (v.id) {
          unwrap(await supabase.from('product_variants').update(vrow).eq('id', v.id))
        } else {
          const created = unwrap(await supabase.from('product_variants').insert(vrow).select('id').single())
          const qty = Number(v.newStock ?? 0)
          if (qty > 0 && can('inventory.write')) {
            unwrap(await supabase.rpc('admin_adjust_inventory', { p_variant_id: created.id, p_delta: qty, p_reason: 'initial', p_note: 'Opening stock' }))
          }
        }
      }

      // Images
      for (const img of images.filter((i) => i._delete && i.id)) {
        unwrap(await supabase.from('product_images').delete().eq('id', img.id!))
        if (img.storage_path) await supabase.storage.from('media').remove([img.storage_path])
      }
      for (const [i, img] of visibleImages.entries()) {
        const irow = { product_id: productId!, url: img.url, storage_path: img.storage_path ?? null, alt: img.alt || null, color: img.color, position: i }
        if (img.id) unwrap(await supabase.from('product_images').update(irow).eq('id', img.id))
        else unwrap(await supabase.from('product_images').insert(irow))
      }

      // Collections: same upsert-then-prune pattern
      if (collectionIds.length) {
        unwrap(await supabase.from('product_collections').upsert(collectionIds.map((cid) => ({ product_id: productId!, collection_id: cid })), { onConflict: 'product_id,collection_id', ignoreDuplicates: true }))
      }
      let dropCollections = supabase.from('product_collections').delete().eq('product_id', productId!)
      if (collectionIds.length) dropCollections = dropCollections.not('collection_id', 'in', `(${collectionIds.join(',')})`)
      unwrap(await dropCollections)

      toast('Product saved')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', productId] })
      if (isNew) navigate(`/products/${productId}`, { replace: true })
    } catch (e) {
      const msg = (e as Error).message
      toast(msg.includes('duplicate key') ? 'That slug, style code or SKU is already in use.' : msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function setStock(i: number) {
    const v = variants[i]!
    if (!v.id || v.newStock === undefined || v.newStock === '') return
    try {
      const after = unwrap(await supabase.rpc('admin_set_inventory', { p_variant_id: v.id, p_quantity: Number(v.newStock), p_note: 'Set from product editor' })) as number
      updateVariant(i, { on_hand: after, newStock: undefined })
      toast(`Stock for ${v.sku} set to ${after}`)
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Uncategorised' }, ...categories.filter((c: any) => form.department === 'unisex' || c.department === form.department).map((c: any) => ({ value: c.id, label: c.name }))],
    [categories, form.department],
  )

  if (!isNew && isLoading) return <Spinner />
  if (error) return <ErrorNote error={error} />

  return (
    <div>
      <PageHeader
        title={isNew ? 'New product' : form.name || 'Product'}
        back={{ to: '/products', label: 'Products' }}
        description={!isNew && <span className="flex items-center gap-2"><Badge tone={form.status === 'active' ? 'dark' : 'outline'}>{form.status}</Badge> {form.style_code}</span>}
        actions={
          <>
            {!isNew && form.status === 'active' && <a href={`${STOREFRONT_URL}/products/${form.slug}`} target="_blank" rel="noreferrer" className="text-[13px] underline underline-offset-2">View in store ↗</a>}
            {editable && <Button onClick={save} loading={saving}>Save product</Button>}
          </>
        }
      />

      <fieldset disabled={!editable} className="grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 xl:col-span-2">
          <Section title="Basics">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} className="md:col-span-2" />
              <TextField label="URL slug" required value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }} error={errors.slug} hint={`/products/${form.slug || '…'}`} />
              <TextField label="Style code (base SKU)" required value={form.style_code} onChange={(e) => set('style_code', e.target.value.toUpperCase())} error={errors.style_code} />
              <SelectField label="Department" value={form.department} onChange={(e) => set('department', e.target.value)} options={[{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'unisex', label: 'Unisex' }]} />
              <SelectField label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} options={categoryOptions} />
              <TextArea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} className="md:col-span-2" rows={4} />
              <TextField label="Material" value={form.material} onChange={(e) => set('material', e.target.value)} />
              <TextField label="Fit" value={form.fit} onChange={(e) => set('fit', e.target.value)} />
              <TextArea label="Care" value={form.care} onChange={(e) => set('care', e.target.value)} rows={2} />
              <TextArea label="Details (one per line)" value={form.details} onChange={(e) => set('details', e.target.value)} rows={3} error={errors.details} />
            </div>
          </Section>

          <Section title="Arabic" description="Shown on /ar pages. Leave blank to fall back to English.">
            <div dir="rtl" className="grid gap-4 md:grid-cols-2">
              <TextField label="الاسم" value={form.ar_name} onChange={(e) => set('ar_name', e.target.value)} className="md:col-span-2" />
              <TextArea label="الوصف" value={form.ar_description} onChange={(e) => set('ar_description', e.target.value)} className="md:col-span-2" rows={3} />
              <TextField label="الخامة" value={form.ar_material} onChange={(e) => set('ar_material', e.target.value)} />
              <TextField label="العناية" value={form.ar_care} onChange={(e) => set('ar_care', e.target.value)} />
            </div>
          </Section>

          <Section title="Images" description="First image leads in grids. Assign a colour so the gallery follows the shopper's colour choice.">
            {isNew ? (
              <p className="text-graphite">Save the product first, then upload images.</p>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {visibleImages.map((img) => {
                    const i = images.indexOf(img)
                    return (
                      <li key={img.id ?? img.url} className="border border-mist p-2">
                        <Thumb src={img.url} size={140} alt={img.alt} />
                        <select className="field mt-2 !py-1 text-[12px]" value={img.color ?? ''} onChange={(e) => setImages((all) => all.map((x, j) => (j === i ? { ...x, color: e.target.value || null } : x)))} aria-label="Image colour">
                          <option value="">All colours</option>
                          {colors.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                        </select>
                        <input className="field mt-1 !py-1 text-[12px]" value={img.alt} placeholder="Alt text" aria-label="Alt text" onChange={(e) => setImages((all) => all.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
                        <div className="mt-1 flex justify-between text-[12px]">
                          <span className="flex gap-1">
                            <button type="button" className="cursor-pointer px-1" onClick={() => moveImage(i, -1)} aria-label="Move earlier">←</button>
                            <button type="button" className="cursor-pointer px-1" onClick={() => moveImage(i, 1)} aria-label="Move later">→</button>
                          </span>
                          <button type="button" className="cursor-pointer text-error" onClick={() => setImages((all) => all.map((x, j) => (j === i ? { ...x, _delete: true } : x)))}>Remove</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 border border-ink px-4 py-2 text-[14px]">
                  {uploading ? 'Uploading…' : 'Upload images'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => onUpload(e.target.files)} disabled={uploading} />
                </label>
                <p className="mt-2 text-[12px] text-graphite">JPEG, PNG, WebP or AVIF up to 10 MB. Portrait 4:5 or 3:4 works best.</p>
              </>
            )}
          </Section>

          <Section title="Options & variants" description="Each colour × size is a variant with its own SKU, optional price and stock.">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[13px] text-graphite">Colours</p>
                <ul className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <li key={c.value} className="flex items-center gap-2 border border-mist py-1 ps-1 pe-2 text-[13px]">
                      <span className="size-5 border border-ink/20" style={{ background: c.hex }} /> {c.value}
                      <button type="button" className="cursor-pointer text-graphite" aria-label={`Remove ${c.value}`} onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))}>×</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-end gap-2">
                  <input className="field" placeholder="Name, e.g. Camel" aria-label="Colour name" value={newColor.value} onChange={(e) => setNewColor({ ...newColor, value: e.target.value })} />
                  <input type="color" className="h-[38px] w-12 cursor-pointer border border-mist" aria-label="Swatch" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} />
                  <input className="field" dir="rtl" placeholder="عربي" aria-label="Arabic colour name" value={newColor.ar} onChange={(e) => setNewColor({ ...newColor, ar: e.target.value })} />
                  <Button variant="outline" onClick={() => { if (newColor.value.trim() && !colors.some((c) => c.value === newColor.value.trim())) { setColors([...colors, { ...newColor, value: newColor.value.trim() }]); setNewColor({ value: '', hex: '#000000', ar: '' }) } }}>Add</Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[13px] text-graphite">Sizes</p>
                <ul className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <li key={s} className="flex items-center gap-2 border border-mist px-2 py-1 text-[13px]">
                      {s} <button type="button" className="cursor-pointer text-graphite" aria-label={`Remove ${s}`} onClick={() => setSizes((ss) => ss.filter((x) => x !== s))}>×</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-end gap-2">
                  <input className="field" placeholder="e.g. M or 32" aria-label="Size" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
                  <Button variant="outline" onClick={() => { if (newSize.trim() && !sizes.includes(newSize.trim())) setSizes(sortSizes([...sizes, newSize.trim()])); setNewSize('') }}>Add</Button>
                  <select className="field" aria-label="Size preset" value="" onChange={(e) => e.target.value && setSizes(PRESET_SIZES[e.target.value]!)}>
                    <option value="">Preset…</option>
                    {Object.keys(PRESET_SIZES).map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <Button variant="outline" className="mt-5" onClick={generateVariants}>Generate missing variants</Button>

            {variants.length > 0 && (
              <div className="mt-5 overflow-x-auto border border-mist">
                <table className="w-full min-w-[820px] text-[13px]">
                  <caption className="sr-only">Variants</caption>
                  <thead className="bg-paper text-graphite">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">Variant</th>
                      <th className="px-3 py-2 text-start font-medium">SKU</th>
                      <th className="px-3 py-2 text-start font-medium">Price override</th>
                      <th className="px-3 py-2 text-start font-medium">Sale override</th>
                      <th className="px-3 py-2 text-start font-medium">Stock</th>
                      <th className="px-3 py-2 text-start font-medium">Active</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={v.id ?? `${v.color}|${v.size}`} className="border-t border-mist">
                        <td className="px-3 py-2">{[v.color, v.size].filter(Boolean).join(' / ') || 'Default'}</td>
                        <td className="px-3 py-2"><input className="field !py-1 font-mono text-[12px]" aria-label="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value.toUpperCase() })} /></td>
                        <td className="px-3 py-2"><input className="field !py-1 w-24" inputMode="decimal" aria-label="Price override" placeholder={form.price} value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} /></td>
                        <td className="px-3 py-2"><input className="field !py-1 w-24" inputMode="decimal" aria-label="Sale override" value={v.sale_price} onChange={(e) => updateVariant(i, { sale_price: e.target.value })} /></td>
                        <td className="px-3 py-2">
                          {v.id ? (
                            <span className="flex items-center gap-2">
                              <span className={`w-8 num ${v.on_hand === 0 ? 'text-error' : ''}`}>{v.on_hand}</span>
                              {can('inventory.write') && (
                                <>
                                  <input className="field !py-1 w-16" inputMode="numeric" aria-label={`Set stock for ${v.sku}`} placeholder="Set" value={v.newStock ?? ''} onChange={(e) => updateVariant(i, { newStock: e.target.value })} />
                                  <Button size="sm" variant="ghost" onClick={() => setStock(i)} disabled={!v.newStock}>Set</Button>
                                </>
                              )}
                            </span>
                          ) : (
                            <input className="field !py-1 w-20" inputMode="numeric" aria-label="Opening stock" value={v.newStock ?? '0'} onChange={(e) => updateVariant(i, { newStock: e.target.value })} />
                          )}
                        </td>
                        <td className="px-3 py-2"><input type="checkbox" className="size-4 accent-black" aria-label="Active" checked={v.is_active} onChange={(e) => updateVariant(i, { is_active: e.target.checked })} /></td>
                        <td className="px-3 py-2 text-end">
                          <button type="button" className="cursor-pointer text-error" onClick={async () => (!v.id || (await confirm(`Remove variant ${v.sku}? Past orders keep their records.`, { danger: true }))) && setVariants((vs) => vs.filter((_, j) => j !== i))}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="grid content-start gap-6">
          <Section title="Status">
            <div className="grid gap-4">
              <SelectField label="Visibility" value={form.status} onChange={(e) => set('status', e.target.value)} options={[{ value: 'draft', label: 'Draft — hidden' }, { value: 'active', label: 'Active — on sale' }, { value: 'archived', label: 'Archived' }]} />
              <Checkbox label="New arrival" checked={form.is_new_arrival} onChange={(v) => set('is_new_arrival', v)} />
              <Checkbox label="Best seller" checked={form.is_best_seller} onChange={(v) => set('is_best_seller', v)} hint="Also ranked automatically by units sold" />
              <Checkbox label="Featured" checked={form.is_featured} onChange={(v) => set('is_featured', v)} hint="Leads the default “Featured” sort" />
            </div>
          </Section>
          <Section title="Pricing" description="Variants inherit these unless overridden.">
            <div className="grid gap-4">
              <TextField label={`Price (${currency()})`} inputMode="decimal" required value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price} />
              <TextField label={`Sale price (${currency()})`} inputMode="decimal" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} error={errors.sale_price} hint="Leave blank when not on sale" />
              <SelectField label="Size guide" value={form.size_guide} onChange={(e) => set('size_guide', e.target.value)} options={[{ value: 'apparel', label: 'Apparel' }, { value: 'denim', label: 'Denim' }, { value: 'shoes', label: 'Shoes' }, { value: 'none', label: 'None (one size)' }]} />
            </div>
          </Section>
          <Section title="Collections">
            <div className="grid gap-2">
              {collections.map((c: any) => (
                <Checkbox key={c.id} label={c.name} checked={collectionIds.includes(c.id)} onChange={(on) => setCollectionIds((ids) => (on ? [...ids, c.id] : ids.filter((x) => x !== c.id)))} />
              ))}
            </div>
          </Section>
          <Section title="Search & SEO">
            <div className="grid gap-4">
              <TextField label="Tags (comma separated)" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
              <TextField label="SEO title" value={form.seo_title} maxLength={70} onChange={(e) => set('seo_title', e.target.value)} hint={`${form.seo_title.length}/70`} />
              <TextArea label="SEO description" value={form.seo_description} maxLength={160} onChange={(e) => set('seo_description', e.target.value)} hint={`${form.seo_description.length}/160`} rows={3} />
            </div>
          </Section>
        </div>
      </fieldset>
    </div>
  )
}
