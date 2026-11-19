// Pluggable payment providers.
//
// Orders are always created first (status pending, payment pending). A provider
// then decides what the customer must do next. Providers MUST NOT mark anything
// as paid unless the payment processor has confirmed it — that happens later via
// a verified webhook or a staff action (admin_record_payment).
//
// To add an online provider (e.g. Stripe, Checkout.com, Tap):
//   1. implement PaymentProvider with `initiate` creating a hosted session,
//   2. register it below,
//   3. add a webhook function that verifies the provider signature and calls
//      admin_record_payment equivalent logic with the service role,
//   4. enable the method in Settings › Payments.

export interface PlacedOrder {
  order_id: string
  order_number: string
  total: number
  currency: string
  email: string
  access_token: string
}

export type PaymentNextStep =
  | { kind: 'none'; message?: string }
  | { kind: 'instructions'; instructions: string }
  | { kind: 'redirect'; url: string }

export interface PaymentProvider {
  code: string
  initiate(order: PlacedOrder, setting: PaymentMethodSetting): Promise<PaymentNextStep>
}

export interface PaymentMethodSetting {
  code: string
  enabled: boolean
  label: string
  instructions?: string
  provider?: string
}

const cashOnDelivery: PaymentProvider = {
  code: 'cod',
  initiate: () => Promise.resolve({ kind: 'none', message: 'Pay the courier on delivery.' }),
}

const manualTransfer: PaymentProvider = {
  code: 'manual',
  initiate: (_order, setting) =>
    Promise.resolve(
      setting.instructions
        ? { kind: 'instructions', instructions: setting.instructions }
        : { kind: 'none', message: 'We will contact you with payment details.' },
    ),
}

const registry = new Map<string, PaymentProvider>([
  [cashOnDelivery.code, cashOnDelivery],
  [manualTransfer.code, manualTransfer],
])

export function getProvider(code: string): PaymentProvider | null {
  return registry.get(code) ?? null
}
