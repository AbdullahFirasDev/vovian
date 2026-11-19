import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, ErrorNote, PageHeader, Spinner, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { date } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

interface Message { id: string; name: string; email: string; order_number: string | null; topic: string; message: string; is_resolved: boolean; created_at: string }

export default function Messages() {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const [showResolved, setShowResolved] = useState(false)
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['messages', showResolved],
    queryFn: async () => {
      let q = supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
      if (!showResolved) q = q.eq('is_resolved', false)
      return unwrap(await q) as Message[]
    },
  })
  const resolve = useMutation({
    mutationFn: async (m: Message) => unwrap(await supabase.from('contact_messages').update({ is_resolved: !m.is_resolved }).eq('id', m.id)),
    onSuccess: () => { toast('Updated'); qc.invalidateQueries({ queryKey: ['messages'] }) },
  })
  return (
    <div>
      <PageHeader title="Messages" description="From the storefront contact form." actions={<Button variant="outline" onClick={() => setShowResolved((v) => !v)}>{showResolved ? 'Hide resolved' : 'Show resolved'}</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <ul className="grid gap-4">
          {data.map((m) => (
            <li key={m.id} className="border border-mist p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p><span className="font-medium">{m.name}</span> · <a className="underline underline-offset-2" href={`mailto:${m.email}?subject=Re: your message to VOVIAN`}>{m.email}</a></p>
                <span className="flex items-center gap-2 text-[13px] text-graphite"><Badge>{m.topic}</Badge>{m.order_number && <span className="num">{m.order_number}</span>}{date(m.created_at, true)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line">{m.message}</p>
              {can('customers.write') && <Button size="sm" variant={m.is_resolved ? 'ghost' : 'outline'} className="mt-4" onClick={() => resolve.mutate(m)}>{m.is_resolved ? 'Reopen' : 'Mark resolved'}</Button>}
            </li>
          ))}
          {!data.length && <li className="py-16 text-center text-graphite">No open messages.</li>}
        </ul>
      )}
    </div>
  )
}
