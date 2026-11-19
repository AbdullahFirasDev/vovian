<script setup lang="ts">
import type { Quote } from '@vovian/types'

/** Totals block driven entirely by the server quote. */
// Vue casts an omitted Boolean prop to false, so the default must be explicit.
const props = withDefaults(defineProps<{ quote: Quote | null; loading?: boolean; showShipping?: boolean; estimate?: boolean }>(), { showShipping: true })
const { money } = useFormat()
const { t } = useI18n()

const shippingLabel = computed(() => {
  if (!props.quote?.shipping_method) return '—'
  return props.quote.shipping_total === 0 ? t('cart.free') : money(props.quote.shipping_total)
})
</script>

<template>
  <dl class="space-y-3 text-[15px]" :class="loading && 'opacity-60 transition-opacity'" aria-live="polite">
    <div class="flex justify-between">
      <dt>{{ $t('cart.subtotal') }}</dt>
      <dd class="tabular-nums">{{ money(quote?.subtotal ?? 0) }}</dd>
    </div>
    <div v-if="quote?.discount_total" class="flex justify-between">
      <dt>{{ $t('cart.discount') }} <span class="text-graphite">({{ quote.discount?.code }})</span></dt>
      <dd class="tabular-nums">−{{ money(quote.discount_total) }}</dd>
    </div>
    <div v-if="showShipping !== false" class="flex justify-between">
      <dt>
        {{ estimate ? $t('cart.shippingEstimate') : $t('cart.shipping') }}
        <span v-if="quote?.shipping_method" class="block text-[13px] text-graphite">{{ quote.shipping_method.name }}</span>
      </dt>
      <dd class="tabular-nums">{{ shippingLabel }}</dd>
    </div>
    <div v-if="quote && !quote.tax_inclusive && quote.tax_total" class="flex justify-between">
      <dt>{{ $t('cart.tax', { label: quote.tax_label }) }}</dt>
      <dd class="tabular-nums">{{ money(quote.tax_total) }}</dd>
    </div>
    <div class="flex items-baseline justify-between border-t border-ink pt-4">
      <dt class="text-[16px] font-medium">{{ $t('cart.total') }}</dt>
      <dd class="font-display text-2xl tabular-nums">{{ money(quote?.total ?? 0) }}</dd>
    </div>
    <p v-if="quote?.tax_inclusive && quote.tax_total" class="text-end text-[13px] text-graphite">
      {{ $t('cart.taxIncluded', { label: quote.tax_label }) }} {{ money(quote.tax_total) }}
    </p>
  </dl>
</template>
