import type { Permission } from '@vovian/shared'
import { ROLE_LABELS } from '@vovian/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAccess } from '../lib/access'
import { setCurrency } from '../lib/format'
import { supabase, STOREFRONT_URL } from '../lib/supabase'

const NAV: { group: string; items: { to: string; label: string; permission: Permission }[] }[] = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', permission: 'dashboard.view' }] },
  {
    group: 'Commerce',
    items: [
      { to: '/orders', label: 'Orders', permission: 'orders.read' },
      { to: '/customers', label: 'Customers', permission: 'customers.read' },
      { to: '/messages', label: 'Messages', permission: 'customers.read' },
      { to: '/discounts', label: 'Discounts', permission: 'discounts.read' },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { to: '/products', label: 'Products', permission: 'products.read' },
      { to: '/inventory', label: 'Inventory', permission: 'inventory.read' },
      { to: '/categories', label: 'Categories', permission: 'products.read' },
      { to: '/collections', label: 'Collections', permission: 'products.read' },
    ],
  },
  {
    group: 'Content',
    items: [
      { to: '/content/homepage', label: 'Homepage', permission: 'content.read' },
      { to: '/content/pages', label: 'Pages', permission: 'content.read' },
      { to: '/content/menus', label: 'Navigation', permission: 'content.read' },
      { to: '/content/subscribers', label: 'Subscribers', permission: 'content.read' },
    ],
  },
  {
    group: 'Store',
    items: [
      { to: '/settings', label: 'Settings', permission: 'settings.read' },
      { to: '/staff', label: 'Staff & roles', permission: 'staff.manage' },
      { to: '/audit', label: 'Audit log', permission: 'audit.read' },
    ],
  },
]

export function Layout() {
  const { can, name, roles, signOut } = useAccess()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const qc = useQueryClient()
  useEffect(() => setOpen(false), [location.pathname])

  // Realtime: refresh orders + notifications as they arrive.
  useEffect(() => {
    const channel = supabase
      .channel('staff-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => qc.invalidateQueries({ queryKey: ['notifications'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['orders'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  useQuery({
    queryKey: ['store-currency'],
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'currency').maybeSingle()
      const code = (data?.value as { code?: string } | null)?.code ?? 'IQD'
      setCurrency(code)
      return code
    },
    staleTime: Infinity,
  })

  const { data: unread = 0 } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('audience', 'staff').is('read_at', null)
      return count ?? 0
    },
    refetchInterval: 60_000,
  })

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => can(i.permission))
        if (!items.length) return null
        return (
          <div key={g.group} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] text-white/45">{g.group}</p>
            <ul>
              {items.map((i) => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.to === '/'}
                    className={({ isActive }) => `block px-3 py-1.5 text-[14px] transition-colors ${isActive ? 'bg-white text-ink' : 'text-white/80 hover:text-white'}`}
                  >
                    {i.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-svh">
      <aside className={`no-print fixed inset-y-0 start-0 z-40 flex w-60 flex-col bg-night text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" className="font-display text-[22px] tracking-[0.04em]">VOVIAN</Link>
          <span className="text-[11px] text-white/45">Admin</span>
        </div>
        {nav}
        <div className="border-t border-white/10 px-6 py-4 text-[13px]">
          <p className="truncate">{name}</p>
          <p className="truncate text-white/45">{roles.map((r) => ROLE_LABELS[r]).join(', ')}</p>
          <div className="mt-3 flex gap-4">
            <a href={STOREFRONT_URL} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">Storefront ↗</a>
            <button type="button" onClick={signOut} className="cursor-pointer text-white/70 hover:text-white">Sign out</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="flex min-w-0 flex-1 flex-col lg:ps-60">
        <div className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-mist bg-white/95 px-4 backdrop-blur lg:px-8">
          <button type="button" className="cursor-pointer text-[14px] lg:hidden" aria-expanded={open} onClick={() => setOpen(true)}>Menu</button>
          <span className="hidden lg:block" />
          <Link to="/notifications" className="relative text-[14px] hover:underline" aria-label={`Notifications, ${unread} unread`}>
            Notifications
            {unread > 0 && <span className="ms-2 inline-grid min-w-5 place-items-center bg-ink px-1 text-[11px] text-white num">{unread}</span>}
          </Link>
        </div>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function Forbidden() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-3xl">You don't have access to this area</p>
      <p className="mt-2 text-graphite">Ask a super admin to update your role.</p>
    </div>
  )
}

export function Guard({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can } = useAccess()
  return can(permission) ? <>{children}</> : <Forbidden />
}
