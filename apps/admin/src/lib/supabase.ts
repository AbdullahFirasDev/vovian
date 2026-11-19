import { createClient } from '@supabase/supabase-js'

// Publishable key only. Every privileged action is authorised in Postgres
// (RLS + has_permission) or in an edge function — never trusted to this UI.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vovian-admin-auth' },
})

export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3000'
export const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/** Throws on Supabase errors so TanStack Query surfaces them. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  // Mutations without .select() legitimately return null; callers ignore the value.
  return res.data as NonNullable<T>
}

export async function callEdge<T>(name: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_KEY,
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error?.message ?? json?.error?.code ?? `Request failed (${res.status})`)
  return json as T
}

/** Uploads an image to the public `media` bucket under an area folder; returns its public URL. */
export async function uploadImage(file: File, area: 'products' | 'content' | 'brand', prefix = ''): Promise<{ url: string; path: string }> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  if (!allowed.includes(file.type)) throw new Error('Use a JPEG, PNG, WebP or AVIF image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.')
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${area}/${prefix ? `${prefix}/` : ''}${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw new Error(error.message)
  return { url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl, path }
}
