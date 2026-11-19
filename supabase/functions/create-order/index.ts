// POST /functions/v1/create-order
//
// The only way an order can be created. Validates input, identifies the caller,
// rate limits, then hands off to public.place_order() — which recomputes every
// price, discount, shipping and tax value, locks stock rows and writes the order
// atomically. Client-supplied totals are never read.
import { checkoutPayloadSchema } from '../_shared/validation/checkout.ts'
import { clientIp, error, json, preflight, readJson } from '../_shared/http.ts'
import { getCaller, rateLimit, serviceClient } from '../_shared/supabase.ts'
import { getProvider, type PaymentMethodSetting } from '../_shared/payments.ts'
import { orderConfirmationEmail, sendEmail } from '../_shared/notify.ts'

const STOREFRONT_URL = Deno.env.get('STOREFRONT_URL') ?? 'http://localhost:3000'

Deno.serve(async (req) => {
  const early = preflight(req)
  if (early) return early

  const ip = clientIp(req)
  if (!(await rateLimit(`order:ip:${ip}`, 60, 8))) return error(req, 429, 'RATE_LIMITED')

  const body = await readJson(req)
  if (body === null) return error(req, 400, 'INVALID_JSON')

  const parsed = checkoutPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return error(req, 422, 'VALIDATION', {
      fields: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  }
  const input = parsed.data

  if (!(await rateLimit(`order:email:${input.email}`, 600, 6))) return error(req, 429, 'RATE_LIMITED')

  const caller = await getCaller(req)
  const db = serviceClient()

  // Explicit allow-list of fields passed to the database.
  const payload = {
    idempotency_key: input.idempotency_key,
    email: input.email,
    full_name: input.full_name,
    phone: input.phone,
    phone_secondary: input.phone_secondary ?? null,
    shipping_address: {
      governorate: input.shipping_address.governorate,
      area: input.shipping_address.area,
      landmark: input.shipping_address.landmark,
    },
    delivery_instructions: input.delivery_instructions || null,
    shipping_method_id: input.shipping_method_id,
    payment_method: input.payment_method,
    discount_code: input.discount_code || null,
    items: input.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
    locale: input.locale,
  }

  const { data, error: rpcError } = await db.rpc('place_order', {
    p_payload: payload,
    p_user_id: caller?.user.id ?? null,
    p_ip: ip,
  })

  if (rpcError) {
    const message = rpcError.message ?? ''
    const code = message.match(/^([A-Z_]{4,})/)?.[1] ?? 'UNKNOWN'
    const detail = rpcError.details ?? null
    switch (code) {
      case 'CART_INVALID': {
        let issues: unknown = []
        try { issues = detail ? JSON.parse(detail) : [] } catch { /* keep empty */ }
        return error(req, 409, code, { issues })
      }
      case 'DISCOUNT_INVALID':
        return error(req, 409, code, { reason: detail })
      case 'CART_EMPTY':
      case 'SHIPPING_UNAVAILABLE':
      case 'PAYMENT_METHOD_UNAVAILABLE':
        return error(req, 422, code)
      case 'VALIDATION':
        return error(req, 422, code, { fields: [{ path: message.replace(/^VALIDATION:\s*/, ''), message: 'validation.invalid' }] })
      default:
        console.error('place_order failed', rpcError)
        return error(req, 500, 'UNKNOWN')
    }
  }

  const order = data as {
    order_id: string; order_number: string; access_token: string; total: number; currency: string; duplicate: boolean
  }

  // Payment next step from the provider registry
  const { data: pmSetting } = await db.from('store_settings').select('value').eq('key', 'payment_methods').single()
  const setting = ((pmSetting?.value as PaymentMethodSetting[] | undefined) ?? []).find((m) => m.code === input.payment_method)
  const provider = getProvider(input.payment_method)
  const payment = provider && setting
    ? await provider.initiate({ ...order, email: input.email }, setting)
    : { kind: 'none' as const }

  if (!order.duplicate) {
    const background = (async () => {
      if (input.marketing_opt_in) {
        await db.from('newsletter_subscribers').upsert(
          { email: input.email, locale: input.locale, source: 'checkout', user_id: caller?.user.id ?? null, is_subscribed: true },
          { onConflict: 'email' },
        )
      }
      const amount = new Intl.NumberFormat('en-US', { maximumFractionDigits: order.currency === 'IQD' ? 0 : 2 }).format(order.total)
      const total = order.currency === 'IQD' ? (input.locale === 'ar' ? `${amount} د.ع` : `IQD ${amount}`) : `${order.currency} ${amount}`
      await sendEmail(orderConfirmationEmail({
        to: input.email,
        name: input.full_name,
        orderNumber: order.order_number,
        total,
        storefrontUrl: STOREFRONT_URL,
        accessToken: order.access_token,
        instructions: payment.kind === 'instructions' ? payment.instructions : undefined,
        locale: input.locale,
      }))
    })().catch((e) => console.error('post-order tasks failed', e))
    // @ts-ignore EdgeRuntime is provided by Supabase's runtime
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(background)
    else await background
  }

  return json(req, {
    order_number: order.order_number,
    access_token: order.access_token,
    total: order.total,
    currency: order.currency,
    duplicate: order.duplicate,
    payment,
  }, order.duplicate ? 200 : 201)
})
