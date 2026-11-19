<script setup lang="ts">
import type { CustomerOrder, PaymentMethodSetting } from '@vovian/types'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const store = useStoreConfig()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const { date } = useFormat()

const number = computed(() => String(route.params.number).toUpperCase())
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : null))

const { data: order, status } = await useAsyncData(
  () => `order:${number.value}:${token.value}`,
  async () => {
    if (token.value) {
      const { data } = await supabase.rpc('get_order_by_token', { p_order_number: number.value, p_token: token.value })
      if (data) return data as unknown as CustomerOrder
    }
    if (user.value) {
      const { data } = await supabase.rpc('get_my_order', { p_order_number: number.value })
      return (data as unknown as CustomerOrder) ?? null
    }
    return null
  },
  { server: false },
)

usePageSeo({ title: () => t('account.order', { number: number.value }), noindex: true })

const method = computed(() => (store.setting<PaymentMethodSetting[]>('payment_methods') ?? []).find((m) => m.code === order.value?.payment_method))
const instructions = computed(() => method.value?.translations?.[locale.value as 'en' | 'ar']?.instructions ?? method.value?.instructions)
const firstName = computed(() => order.value?.customer_name.split(' ')[0] ?? '')
</script>

<template>
  <div class="shell pt-10 pb-24 md:pt-16">
    <div v-if="status === 'pending'" class="skeleton h-40" />
    <template v-else-if="order">
      <header class="grid-editorial gap-y-6 border-b border-mist pb-10">
        <div class="col-span-4 md:col-span-7">
          <h1 class="display-xl">{{ $t('checkout.confirmationTitle', { name: firstName }) }}</h1>
          <p v-if="order.email" class="mt-5 text-[16px] text-graphite">{{ $t('checkout.confirmationBody', { email: order.email }) }}</p>
        </div>
        <dl class="col-span-4 self-end md:col-span-4 md:col-start-9">
          <dt class="text-[13px] text-graphite">{{ $t('checkout.orderNumber') }}</dt>
          <dd class="font-display text-3xl tabular-nums" data-testid="order-number">{{ order.order_number }}</dd>
          <dd class="mt-1 text-[13px] text-graphite">{{ date(order.created_at, { dateStyle: 'long' }) }}</dd>
        </dl>
      </header>

      <section class="grid-editorial gap-y-8 border-b border-mist py-10">
        <h2 class="col-span-4 font-display text-2xl md:col-span-3">{{ $t('checkout.whatNext') }}</h2>
        <ol class="col-span-4 list-decimal space-y-2 ps-5 text-[15px] md:col-span-5">
          <li>{{ $t('checkout.nextConfirm') }}</li>
          <li v-if="order.payment_method === 'cod'">{{ $t('checkout.nextPay') }}</li>
          <li>{{ $t('checkout.nextShip') }}</li>
        </ol>
        <div v-if="order.payment_method === 'manual' && instructions" class="col-span-4 bg-paper p-6 md:col-span-4 md:col-start-9">
          <h3 class="text-[13px] text-graphite">{{ $t('checkout.paymentInstructions') }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed">{{ instructions }}</p>
        </div>
      </section>

      <div class="py-10">
        <OrderDetail :order="order" />
      </div>

      <div class="flex flex-wrap gap-3 border-t border-mist pt-10">
        <VButton to="/new-arrivals">{{ $t('checkout.continueShopping') }}</VButton>
        <VButton v-if="!user" :to="`/register?email=${encodeURIComponent(order.email ?? '')}`" variant="outline">{{ $t('checkout.createAccount') }}</VButton>
        <VButton v-else :to="`/account/orders/${order.order_number}`" variant="outline">{{ $t('account.viewOrder') }}</VButton>
      </div>
    </template>
    <VEmpty v-else :title="$t('checkout.orderNotFound')" :action="{ label: $t('nav.trackOrder'), to: '/track-order' }" />
  </div>
</template>
