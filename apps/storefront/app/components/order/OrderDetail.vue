<script setup lang="ts">
import type { CustomerOrder } from '@vovian/types'
import { FULFILMENT_STEPS, fulfilmentProgress } from '@vovian/shared'

defineProps<{ order: CustomerOrder }>()
const { money, date, orderStatus, paymentStatus } = useFormat()
const localePath = useLocalePath()
const { locale } = useI18n()
const governorate = (a: CustomerOrder['shipping_address']) => (locale.value === 'ar' ? a.governorate_name_ar : a.governorate_name) ?? a.governorate
</script>

<template>
  <div class="grid gap-12 lg:grid-cols-12">
    <div class="lg:col-span-7">
      <!-- Progress -->
      <section :aria-label="$t('account.progress')">
        <p v-if="order.status === 'cancelled' || order.status === 'returned'" class="font-display text-2xl">{{ orderStatus(order.status) }}</p>
        <ol v-else class="grid grid-cols-5 gap-1">
          <li v-for="(s, i) in FULFILMENT_STEPS" :key="s" class="text-[12px] sm:text-[13px]" :aria-current="order.status === s ? 'step' : undefined">
            <span class="mb-2 block h-0.5" :class="i <= fulfilmentProgress(order.status) ? 'bg-ink' : 'bg-mist'" />
            <span :class="i <= fulfilmentProgress(order.status) ? 'text-ink' : 'text-stone'">{{ orderStatus(s) }}</span>
          </li>
        </ol>
        <p v-if="order.tracking_number" class="mt-6 text-[14px]">
          {{ $t('account.tracking') }}: <span class="tabular-nums">{{ order.tracking_number }}</span>
          <a v-if="order.tracking_url" :href="order.tracking_url" target="_blank" rel="noopener noreferrer" class="ms-2 link-static">{{ $t('account.trackShipment') }}</a>
        </p>
      </section>

      <!-- Items -->
      <section class="mt-12">
        <h2 class="mb-4 text-[13px] text-graphite">{{ $t('account.items') }}</h2>
        <ul class="divide-y divide-mist border-y border-mist">
          <li v-for="(item, i) in order.items" :key="i" class="flex gap-4 py-5">
            <NuxtLink :to="item.product_slug ? localePath(`/products/${item.product_slug}`) : undefined" class="w-20 shrink-0">
              <VImage :src="item.image_url" :alt="item.product_name" sizes="80px" />
            </NuxtLink>
            <div class="flex-1 text-[15px]">
              <p>{{ item.product_name }}</p>
              <p class="text-[13px] text-graphite">{{ [item.color, item.size].filter(Boolean).join(' / ') }} · × {{ item.quantity }}</p>
              <p class="text-[12px] text-graphite">{{ item.sku }}</p>
            </div>
            <p class="text-[15px] tabular-nums">{{ money(item.line_total, order.currency) }}</p>
          </li>
        </ul>
      </section>

      <!-- History -->
      <section v-if="order.history.length" class="mt-12">
        <h2 class="mb-4 text-[13px] text-graphite">{{ $t('track.status') }}</h2>
        <ol class="space-y-2 text-[14px]">
          <li v-for="(h, i) in [...order.history].reverse()" :key="i" class="flex justify-between gap-4">
            <span>{{ orderStatus(h.status) }}</span>
            <time :datetime="h.at" class="text-graphite tabular-nums">{{ date(h.at, { dateStyle: 'medium', timeStyle: 'short' }) }}</time>
          </li>
        </ol>
      </section>
    </div>

    <aside class="space-y-8 lg:col-span-4 lg:col-start-9">
      <div v-if="order.shipping_address?.area">
        <h2 class="mb-2 text-[13px] text-graphite">{{ $t('account.shippingTo') }}</h2>
        <address class="text-[15px] not-italic leading-relaxed">
          {{ order.customer_name }}<br>
          {{ governorate(order.shipping_address) }} · {{ order.shipping_address.area }}<br>
          {{ order.shipping_address.landmark }}<br>
          <span v-if="order.phone" dir="ltr">{{ order.phone }}<template v-if="order.phone_secondary"> · {{ order.phone_secondary }}</template></span>
        </address>
      </div>
      <div>
        <h2 class="mb-2 text-[13px] text-graphite">{{ $t('account.payment') }}</h2>
        <p class="text-[15px]">{{ $t(`payment.${order.payment_method}`) }} · {{ paymentStatus(order.payment_status) }}</p>
        <p class="mt-1 text-[14px] text-graphite">{{ order.shipping_method_name }}</p>
      </div>
      <dl class="space-y-2 border-t border-mist pt-6 text-[15px]">
        <div class="flex justify-between"><dt>{{ $t('cart.subtotal') }}</dt><dd class="tabular-nums">{{ money(order.subtotal, order.currency) }}</dd></div>
        <div v-if="order.discount_total" class="flex justify-between"><dt>{{ $t('cart.discount') }} <span class="text-graphite">({{ order.discount_code }})</span></dt><dd class="tabular-nums">−{{ money(order.discount_total, order.currency) }}</dd></div>
        <div class="flex justify-between"><dt>{{ $t('cart.shipping') }}</dt><dd class="tabular-nums">{{ order.shipping_total ? money(order.shipping_total, order.currency) : $t('cart.free') }}</dd></div>
        <div class="flex items-baseline justify-between border-t border-ink pt-3">
          <dt class="font-medium">{{ $t('cart.total') }}</dt>
          <dd class="font-display text-2xl tabular-nums">{{ money(order.total, order.currency) }}</dd>
        </div>
        <p v-if="order.tax_inclusive && order.tax_total" class="text-end text-[13px] text-graphite">{{ $t('cart.taxIncluded', { label: $t('cart.taxLabel') }) }} {{ money(order.tax_total, order.currency) }}</p>
      </dl>
    </aside>
  </div>
</template>
