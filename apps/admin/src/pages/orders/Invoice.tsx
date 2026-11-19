import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { Button, Spinner } from '../../components/ui'
import { date, money, placeLine } from '../../lib/format'
import { supabase, unwrap } from '../../lib/supabase'

/** Printable A4 invoice. Uses the order's stored snapshots, never live prices. */
export default function Invoice() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const [order, store] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').eq('id', id!).single(),
        supabase.from('store_settings').select('value').eq('key', 'store').single(),
      ])
      return { order: unwrap(order) as any, store: (unwrap(store) as any).value as { legal_name: string; address: string; email: string; phone: string } }
    },
  })

  useEffect(() => {
    if (data) document.title = `Invoice ${data.order.order_number}`
  }, [data])

  if (isLoading || !data) return <Spinner />
  const { order, store } = data
  const a = order.shipping_address

  return (
    <div className="mx-auto max-w-[800px] bg-white p-10 text-[13px]">
      <div className="no-print mb-8 flex justify-between">
        <Link to={`/orders/${order.id}`} className="underline">← Back to order</Link>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <header className="flex items-start justify-between border-b border-ink pb-6">
        <div>
          <p className="font-display text-[34px] leading-none tracking-[0.04em]">VOVIAN</p>
          <p className="mt-3 max-w-xs text-graphite">{store.legal_name}<br />{store.address}<br />{store.email} · {store.phone}</p>
        </div>
        <div className="text-end">
          <p className="font-display text-2xl">Invoice</p>
          <p className="mt-2 num">{order.order_number}</p>
          <p className="text-graphite">{date(order.created_at)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-8 py-6">
        <div><p className="mb-1 text-graphite">Deliver to</p><p>{order.customer_name}<br />{placeLine(a)}<br />Nearest landmark: {a.landmark}<br /><span dir="ltr">{order.phone}{order.phone_secondary ? ` · ${order.phone_secondary}` : ''}</span><br />{order.email}</p></div>
        <div><p className="mb-1 text-graphite">Payment & delivery</p><p>{order.payment_method === 'cod' ? 'Cash on delivery' : 'ZainCash / bank transfer'} · {order.payment_status}<br />{order.shipping_method_name}</p></div>
      </section>
      <table className="w-full">
        <thead><tr className="border-y border-ink text-start"><th className="py-2 text-start font-medium">Item</th><th className="text-start font-medium">SKU</th><th className="text-end font-medium">Qty</th><th className="text-end font-medium">Unit</th><th className="text-end font-medium">Amount</th></tr></thead>
        <tbody>
          {order.order_items.map((i: any) => (
            <tr key={i.id} className="border-b border-mist">
              <td className="py-2">{i.product_name}<span className="block text-graphite">{[i.color, i.size].filter(Boolean).join(' / ')}</span></td>
              <td className="font-mono text-[11px]">{i.sku}</td>
              <td className="text-end num">{i.quantity}</td>
              <td className="text-end num">{money(i.unit_price, order.currency)}</td>
              <td className="text-end num">{money(i.line_total, order.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ms-auto mt-6 grid w-64 gap-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="num">{money(order.subtotal, order.currency)}</dd></div>
        {order.discount_total > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="num">−{money(order.discount_total, order.currency)}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd className="num">{money(order.shipping_total, order.currency)}</dd></div>
        <div className="flex justify-between border-t border-ink pt-2 font-semibold"><dt>Total</dt><dd className="num">{money(order.total, order.currency)}</dd></div>
        {order.tax_total > 0 && <div className="flex justify-between text-graphite"><dt>{order.tax_inclusive ? 'Includes tax' : 'Tax'}</dt><dd className="num">{money(order.tax_total, order.currency)}</dd></div>}
      </dl>
      <p className="mt-16 text-center text-graphite">Thank you for shopping with VOVIAN. Returns and exchanges within 14 days of delivery.</p>
    </div>
  )
}
