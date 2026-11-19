import type { Session } from '@supabase/supabase-js'
import type { AppRole } from '@vovian/types'
import type { Permission } from '@vovian/shared'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

interface Access {
  session: Session | null
  loading: boolean
  roles: AppRole[]
  permissions: Set<string>
  can: (p: Permission) => boolean
  name: string
  email: string
  signOut: () => Promise<void>
}

const AccessContext = createContext<Access | null>(null)

/**
 * Loads the signed-in staff member's roles and effective permissions from the
 * database (my_access). Used to shape the UI; the database enforces them anyway.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')

  async function loadAccess(s: Session | null) {
    setSession(s)
    if (!s) {
      setRoles([])
      setPermissions(new Set())
      setLoading(false)
      return
    }
    const [{ data }, { data: profile }] = await Promise.all([
      supabase.rpc('my_access'),
      supabase.from('profiles').select('full_name').eq('id', s.user.id).maybeSingle(),
    ])
    const access = (data ?? {}) as { roles?: AppRole[]; permissions?: string[] }
    setRoles(access.roles ?? [])
    setPermissions(new Set(access.permissions ?? []))
    setName(profile?.full_name ?? s.user.email ?? '')
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadAccess(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setLoading(true)
        loadAccess(s)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: Access = {
    session,
    loading,
    roles,
    permissions,
    can: (p) => permissions.has(p),
    name,
    email: session?.user.email ?? '',
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess(): Access {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccess must be used inside AccessProvider')
  return ctx
}
