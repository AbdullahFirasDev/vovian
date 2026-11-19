import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@vovian/shared'
import type { AppRole } from '@vovian/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Checkbox, DataTable, ErrorNote, Modal, PageHeader, Spinner, TextField, useFeedback } from '../components/ui'
import { useAccess } from '../lib/access'
import { date } from '../lib/format'
import { callEdge, supabase, unwrap } from '../lib/supabase'

interface StaffRow { user_id: string; email: string; full_name: string | null; roles: AppRole[]; last_sign_in_at: string | null; created_at: string }
const ROLES = Object.keys(ROLE_LABELS) as AppRole[]

export default function Staff() {
  const { session } = useAccess()
  const { toast, confirm } = useFeedback()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<StaffRow | 'new' | null>(null)
  const [form, setForm] = useState<{ email: string; full_name: string; roles: AppRole[] }>({ email: '', full_name: '', roles: [] })

  const { data = [], isLoading, error } = useQuery({ queryKey: ['staff'], queryFn: async () => unwrap(await supabase.rpc('admin_staff')) as unknown as StaffRow[] })

  const save = useMutation({
    mutationFn: async () => {
      if (editing === 'new') {
        if (!form.roles.length) throw new Error('Choose at least one role')
        await callEdge('admin-staff', { action: 'invite', email: form.email, full_name: form.full_name, roles: form.roles })
      } else {
        await callEdge('admin-staff', { action: 'set_roles', user_id: (editing as StaffRow).user_id, roles: form.roles })
      }
    },
    onSuccess: () => { toast(editing === 'new' ? 'Invitation sent' : 'Roles updated'); setEditing(null); qc.invalidateQueries({ queryKey: ['staff'] }) },
    onError: (e) => toast(e.message.includes('super admin') ? 'At least one super admin must remain.' : e.message, 'error'),
  })

  const revoke = useMutation({
    mutationFn: async (r: StaffRow) => callEdge('admin-staff', { action: 'set_roles', user_id: r.user_id, roles: [] }),
    onSuccess: () => { toast('Access removed'); qc.invalidateQueries({ queryKey: ['staff'] }) },
    onError: (e) => toast(e.message.includes('super admin') ? 'At least one super admin must remain.' : e.message, 'error'),
  })

  return (
    <div>
      <PageHeader title="Staff & roles" description="Permissions are enforced by the database for every request." actions={<Button onClick={() => { setForm({ email: '', full_name: '', roles: [] }); setEditing('new') }}>Invite staff</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Staff"
          rows={data}
          rowKey={(r) => r.user_id}
          onRowClick={(r) => { setForm({ email: r.email, full_name: r.full_name ?? '', roles: r.roles }); setEditing(r) }}
          columns={[
            { key: 'n', header: 'Person', render: (r) => <span><span className="block font-medium">{r.full_name ?? r.email}</span><span className="text-[12px] text-graphite">{r.email}</span></span> },
            { key: 'r', header: 'Roles', render: (r) => <span className="flex flex-wrap gap-1">{r.roles.map((role) => <Badge key={role} tone={role === 'super_admin' ? 'dark' : 'neutral'}>{ROLE_LABELS[role]}</Badge>)}</span> },
            { key: 'l', header: 'Last sign-in', render: (r) => date(r.last_sign_in_at, true) },
            { key: 'x', header: '', align: 'end', render: (r) => r.user_id !== session?.user.id && <Button size="sm" variant="ghost" className="text-error" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Remove all admin access for ${r.email}? Their customer account stays.`, { danger: true })) revoke.mutate(r) }}>Remove access</Button> },
          ]}
        />
      )}

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r} className="border border-mist p-4"><p className="font-medium">{ROLE_LABELS[r]}</p><p className="mt-1 text-[13px] text-graphite">{ROLE_DESCRIPTIONS[r]}</p></div>
        ))}
      </section>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Invite staff' : 'Edit roles'}>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
          {editing === 'new' ? (
            <>
              <TextField label="Full name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint="They receive an email to set a password. Existing accounts just gain the roles." />
            </>
          ) : <p>{form.full_name || form.email}</p>}
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-[13px] text-graphite">Roles</legend>
            {ROLES.map((r) => <Checkbox key={r} label={ROLE_LABELS[r]} hint={ROLE_DESCRIPTIONS[r]} checked={form.roles.includes(r)} onChange={(on) => setForm({ ...form, roles: on ? [...form.roles, r] : form.roles.filter((x) => x !== r) })} />)}
          </fieldset>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" loading={save.isPending}>{editing === 'new' ? 'Send invitation' : 'Save roles'}</Button></div>
        </form>
      </Modal>
    </div>
  )
}
