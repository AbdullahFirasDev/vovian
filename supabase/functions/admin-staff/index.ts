// POST /functions/v1/admin-staff — invite a staff member and assign roles.
// Requires the caller to hold `staff.manage`; role assignment runs as the caller
// (admin_set_user_roles) so the database enforces and audits it.
import { z } from 'zod'
import { error, json, preflight, readJson } from '../_shared/http.ts'
import { getCaller, serviceClient, userClient } from '../_shared/supabase.ts'

const ADMIN_URL = Deno.env.get('ADMIN_URL') ?? 'http://localhost:5173'

const roles = z.array(z.enum([
  'super_admin', 'store_manager', 'product_manager', 'order_manager', 'inventory_manager', 'content_manager',
])).max(6)

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('invite'), email: z.string().trim().toLowerCase().pipe(z.email()), full_name: z.string().trim().min(2).max(120), roles: roles.min(1) }),
  z.object({ action: z.literal('set_roles'), user_id: z.guid(), roles }),
])

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  const caller = await getCaller(req)
  if (!caller) return error(req, 401, 'AUTH_REQUIRED')

  const asCaller = userClient(caller.token)
  const { data: allowed } = await asCaller.rpc('has_permission', { p_permission: 'staff.manage' })
  if (allowed !== true) return error(req, 403, 'FORBIDDEN')

  const parsed = schema.safeParse(await readJson(req))
  if (!parsed.success) return error(req, 422, 'VALIDATION', { fields: parsed.error.issues.map((i) => i.path.join('.')) })
  const input = parsed.data

  let userId: string
  if (input.action === 'invite') {
    const admin = serviceClient()
    const { data: existing } = await admin.from('profiles').select('id').eq('email', input.email).maybeSingle()
    if (existing) {
      userId = existing.id
    } else {
      const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, {
        data: { full_name: input.full_name },
        redirectTo: `${ADMIN_URL}/reset-password`,
      })
      if (inviteError || !data.user) return error(req, 400, 'INVITE_FAILED', { message: inviteError?.message })
      userId = data.user.id
    }
  } else {
    userId = input.user_id
  }

  const { error: rolesError } = await asCaller.rpc('admin_set_user_roles', { p_user_id: userId, p_roles: input.roles })
  if (rolesError) return error(req, 400, 'ROLES_FAILED', { message: rolesError.message })

  return json(req, { user_id: userId, roles: input.roles })
})
