import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const url = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** Privileged client. Server-side only — the service role key never leaves the edge runtime. */
export function serviceClient(): SupabaseClient {
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Client acting as the caller, so RLS and permission checks apply to them. */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

/**
 * Resolves the signed-in user from the Authorization header, verifying the JWT
 * with Supabase Auth. Returns null for guests (anon / publishable keys).
 */
export async function getCaller(req: Request): Promise<{ user: User; token: string } | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  // Only user access tokens are JWTs with three segments; API keys are not users.
  if (!token || token.split('.').length !== 3) return null
  const { data, error } = await serviceClient().auth.getUser(token)
  if (error || !data.user || data.user.role !== 'authenticated') return null
  return { user: data.user, token }
}

export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const { data, error } = await serviceClient().rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  })
  if (error) {
    console.error('rate limit check failed', error.message)
    return true // fail open on infrastructure errors; DB constraints still protect integrity
  }
  return data === true
}
