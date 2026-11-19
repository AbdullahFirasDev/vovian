// Transactional email. Uses Resend when RESEND_API_KEY is configured; otherwise
// logs the message (local development — Supabase's Mailpit only captures Auth mail).

interface Email {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(email: Email): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM') ?? 'VOVIAN <orders@vovian.example>'
  if (!key) {
    console.log(`[email:dev] to=${email.to} subject="${email.subject}"`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: email.to, subject: email.subject, html: email.html, text: email.text }),
  })
  if (!res.ok) console.error('email send failed', res.status, await res.text())
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function orderConfirmationEmail(opts: {
  to: string
  name: string
  orderNumber: string
  total: string
  storefrontUrl: string
  accessToken: string
  instructions?: string
  locale: 'en' | 'ar'
}): Email {
  const link = `${opts.storefrontUrl}/order/${opts.orderNumber}?token=${opts.accessToken}`
  const ar = opts.locale === 'ar'
  const subject = ar ? `تم استلام طلبك ${opts.orderNumber}` : `We have your order ${opts.orderNumber}`
  const lines = ar
    ? [`مرحباً ${opts.name}،`, `شكراً لطلبك من فوفيان. الإجمالي: ${opts.total}.`, opts.instructions ?? '', `تفاصيل الطلب: ${link}`]
    : [`Hello ${opts.name},`, `Thank you for your VOVIAN order. Total: ${opts.total}.`, opts.instructions ?? '', `Order details: ${link}`]
  const text = lines.filter(Boolean).join('\n\n')
  const html = `<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:Helvetica,Arial,sans-serif;color:#000;max-width:560px">
    <p style="font-size:22px;letter-spacing:.3em;margin:0 0 32px">VOVIAN</p>
    ${lines.filter(Boolean).map((l) => `<p style="font-size:15px;line-height:1.6">${esc(l)}</p>`).join('')}
  </div>`
  return { to: opts.to, subject, html, text }
}
