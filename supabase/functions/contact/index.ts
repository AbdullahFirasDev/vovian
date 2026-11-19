// POST /functions/v1/contact — client care messages from the storefront.
import { z } from 'zod'
import { clientIp, error, json, preflight, readJson } from '../_shared/http.ts'
import { rateLimit, serviceClient } from '../_shared/supabase.ts'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  order_number: z.string().trim().max(20).optional().or(z.literal('')),
  topic: z.enum(['general', 'order', 'sizing', 'returns', 'repairs', 'press']),
  message: z.string().trim().min(10).max(5000),
  // Honeypot: real visitors never fill this hidden field.
  website: z.string().max(0).optional().or(z.literal('')),
})

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  if (!(await rateLimit(`contact:${clientIp(req)}`, 3600, 5))) return error(req, 429, 'RATE_LIMITED')

  const parsed = schema.safeParse(await readJson(req))
  if (!parsed.success) {
    return error(req, 422, 'VALIDATION', {
      fields: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  const { website: _honeypot, ...msg } = parsed.data

  const db = serviceClient()
  const { error: insertError } = await db.from('contact_messages').insert({
    name: msg.name,
    email: msg.email,
    order_number: msg.order_number || null,
    topic: msg.topic,
    message: msg.message,
  })
  if (insertError) {
    console.error(insertError)
    return error(req, 500, 'UNKNOWN')
  }

  await db.from('notifications').insert({
    audience: 'staff',
    permission: 'customers.read',
    type: 'contact.message',
    title: `New message from ${msg.name}`,
    body: msg.topic,
    link: '/customers/messages',
  })

  return json(req, { received: true }, 201)
})
