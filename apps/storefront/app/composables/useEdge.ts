/** Calls a VOVIAN edge function with the visitor's session (if any). */
export function useEdge() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()

  async function call<T>(name: string, body: unknown): Promise<{ data: T | null; error: { code: string; [k: string]: unknown } | null; status: number }> {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const key = (config.public.supabase as { key: string }).key
    try {
      const res = await fetch(`${config.public.functionsUrl}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${token ?? key}`,
        },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return { data: null, error: json.error ?? { code: 'UNKNOWN' }, status: res.status }
      return { data: json as T, error: null, status: res.status }
    } catch {
      return { data: null, error: { code: 'NETWORK' }, status: 0 }
    }
  }

  return { call }
}
