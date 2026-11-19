import type { MenuItem } from '@vovian/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, ErrorNote, PageHeader, Section, Spinner, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { supabase, unwrap } from '../../lib/supabase'

interface Menu { id: string; handle: string; name: string; items: MenuItem[] }

function MenuEditor({ menu }: { menu: Menu }) {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [items, setItems] = useState<MenuItem[]>(menu.items)
  useEffect(() => setItems(menu.items), [menu.items])
  const editable = can('content.write')

  const update = (i: number, patch: Partial<MenuItem>) => setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const move = (i: number, d: -1 | 1) => setItems((list) => {
    const next = [...list]
    const j = i + d
    if (j < 0 || j >= next.length) return list
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    return next
  })

  const save = useMutation({
    mutationFn: async () => {
      const clean = items.filter((i) => i.label.trim() && i.href.trim())
      if (clean.some((i) => !i.href.startsWith('/') && !i.href.startsWith('https://'))) throw new Error('Links must start with / or https://')
      unwrap(await supabase.from('navigation_menus').update({ items: clean }).eq('id', menu.id))
    },
    onSuccess: () => { toast(`${menu.name} saved`); qc.invalidateQueries({ queryKey: ['menus'] }) },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <Section title={menu.name} description={`handle: ${menu.handle}`} actions={editable && <Button size="sm" onClick={() => save.mutate()} loading={save.isPending}>Save</Button>}>
      <fieldset disabled={!editable}>
        <table className="w-full text-[13px]">
          <caption className="sr-only">{menu.name} links</caption>
          <thead className="text-graphite"><tr><th className="pb-2 text-start font-normal">Label</th><th className="pb-2 text-start font-normal">Arabic label</th><th className="pb-2 text-start font-normal">Link</th><th /></tr></thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-1 pe-2"><input className="field !py-1.5" aria-label="Label" value={item.label} onChange={(e) => update(i, { label: e.target.value })} /></td>
                <td className="py-1 pe-2"><input className="field !py-1.5" dir="rtl" aria-label="Arabic label" value={item.translations?.ar?.label ?? ''} onChange={(e) => update(i, { translations: { ...item.translations, ar: { label: e.target.value } } })} /></td>
                <td className="py-1 pe-2"><input className="field !py-1.5" aria-label="Link" value={item.href} onChange={(e) => update(i, { href: e.target.value })} /></td>
                <td className="whitespace-nowrap py-1 text-end">
                  <button type="button" className="cursor-pointer px-1.5" aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="cursor-pointer px-1.5" aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
                  <button type="button" className="cursor-pointer px-1.5 text-error" aria-label="Remove" onClick={() => setItems((l) => l.filter((_, j) => j !== i))}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {editable && <Button size="sm" variant="outline" className="mt-3" onClick={() => setItems((l) => [...l, { label: '', href: '/' }])}>Add link</Button>}
        {menu.handle === 'main' && <p className="mt-3 text-[12px] text-graphite">Women, Men and Collections open mega menus built from categories and collections automatically.</p>}
      </fieldset>
    </Section>
  )
}

export default function Menus() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['menus'], queryFn: async () => unwrap(await supabase.from('navigation_menus').select('*').order('handle')) as Menu[] })
  return (
    <div>
      <PageHeader title="Navigation" description="Header and footer links in both languages." />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : <div className="grid gap-6 xl:grid-cols-2">{data.map((m) => <MenuEditor key={m.id} menu={m} />)}</div>}
    </div>
  )
}
