#!/usr/bin/env node
// Creates (or promotes) the first super admin. Run once per environment from a
// trusted machine — the service role key is read from the environment and is
// never written anywhere.
//
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   npm run admin:create -- owner@yourbrand.com "Full Name"
//
// If the user doesn't exist they receive an invitation email to set a password.
import { createClient } from '@supabase/supabase-js'

const [email, fullName = 'Store owner'] = process.argv.slice(2)
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:5173'

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Usage: npm run admin:create -- <email> ["Full Name"]')
  process.exit(1)
}
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell (never commit them).')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

let { data: profile } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle()
if (!profile) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${adminUrl}/reset-password`,
  })
  if (error) {
    console.error('Invite failed:', error.message)
    process.exit(1)
  }
  profile = { id: data.user.id }
  console.log(`Invitation sent to ${email}.`)
}

const { error } = await supabase.from('user_roles').upsert({ user_id: profile.id, role: 'super_admin' }, { onConflict: 'user_id,role' })
if (error) {
  console.error('Could not assign role:', error.message)
  process.exit(1)
}
console.log(`${email} is now a super admin. Sign in at ${adminUrl}`)
