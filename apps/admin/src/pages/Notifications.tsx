import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Button, ErrorNote, PageHeader, Spinner } from '../components/ui'
import { date } from '../lib/format'
import { supabase, unwrap } from '../lib/supabase'

interface Notification { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }

export default function Notifications() {
  const qc = useQueryClient()
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => unwrap(await supabase.from('notifications').select('*').eq('audience', 'staff').order('created_at', { ascending: false }).limit(100)) as Notification[],
  })
  const markAll = useMutation({
    mutationFn: async () => unwrap(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('audience', 'staff').is('read_at', null)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markOne = (n: Notification) => !n.read_at && supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id).then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))

  return (
    <div>
      <PageHeader title="Notifications" description="New orders, stock alerts and messages for your roles." actions={<Button variant="outline" onClick={() => markAll.mutate()}>Mark all as read</Button>} />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <ul className="divide-y divide-mist border-y border-mist">
          {data.map((n) => (
            <li key={n.id} className="flex items-baseline gap-4 py-3">
              <span className={`size-2 shrink-0 ${n.read_at ? '' : 'bg-ink'}`} aria-label={n.read_at ? undefined : 'Unread'} />
              <span className="min-w-0 flex-1">
                {n.link ? <Link to={n.link} onClick={() => markOne(n)} className={`hover:underline ${n.read_at ? '' : 'font-semibold'}`}>{n.title}</Link> : <span className={n.read_at ? '' : 'font-semibold'}>{n.title}</span>}
                {n.body && <span className="ms-2 text-graphite">{n.body}</span>}
              </span>
              <span className="text-[13px] text-graphite">{date(n.created_at, true)}</span>
            </li>
          ))}
          {!data.length && <li className="py-16 text-center text-graphite">You're all caught up.</li>}
        </ul>
      )}
    </div>
  )
}
