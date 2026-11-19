import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, DataTable, ErrorNote, PageHeader, Spinner, useFeedback } from '../../components/ui'
import { useAccess } from '../../lib/access'
import { date, download, toCsv } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

interface Sub { id: string; email: string; locale: string; source: string; is_subscribed: boolean; created_at: string; unsubscribed_at: string | null }

export default function Subscribers() {
  const { can } = useAccess()
  const { toast } = useFeedback()
  const qc = useQueryClient()
  const { data = [], isLoading, error } = useQuery({ queryKey: ['subscribers'], queryFn: async () => unwrap(await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })) as Sub[] })

  const toggle = useMutation({
    mutationFn: async (s: Sub) => unwrap(await supabase.from('newsletter_subscribers').update({ is_subscribed: !s.is_subscribed, unsubscribed_at: s.is_subscribed ? new Date().toISOString() : null }).eq('id', s.id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
    onError: (e) => toast(e.message, 'error'),
  })

  const active = data.filter((s) => s.is_subscribed)
  return (
    <div>
      <PageHeader
        title="Newsletter subscribers"
        description={`${active.length} subscribed · ${data.length - active.length} unsubscribed`}
        actions={<Button variant="outline" onClick={() => download(`vovian-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(active as never, [{ key: 'email', label: 'Email' }, { key: 'locale', label: 'Language' }, { key: 'source', label: 'Source' }, { key: 'created_at', label: 'Subscribed' }]))}>Export subscribed</Button>}
      />
      <ErrorNote error={error} />
      {isLoading ? <Spinner /> : (
        <DataTable
          caption="Subscribers"
          rows={data}
          rowKey={(r) => r.id}
          columns={[
            { key: 'e', header: 'Email', render: (r) => r.email },
            { key: 'l', header: 'Language', render: (r) => (r.locale === 'ar' ? 'Arabic' : 'English') },
            { key: 's', header: 'Source', render: (r) => r.source },
            { key: 'd', header: 'Joined', render: (r) => date(r.created_at) },
            { key: 'st', header: 'Status', render: (r) => <Badge tone={r.is_subscribed ? 'dark' : 'neutral'}>{r.is_subscribed ? 'Subscribed' : 'Unsubscribed'}</Badge> },
            { key: 'x', header: '', align: 'end', render: (r) => can('content.write') && <Button size="sm" variant="ghost" onClick={() => toggle.mutate(r)}>{r.is_subscribed ? 'Unsubscribe' : 'Resubscribe'}</Button> },
          ]}
        />
      )}
    </div>
  )
}
