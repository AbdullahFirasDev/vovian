<script setup lang="ts">
const cart = useCartStore()
const { money } = useFormat()
</script>

<template>
  <ul class="space-y-4">
    <li v-for="l in cart.lines" :key="l.variant_id" class="flex gap-4">
      <div class="relative w-16 shrink-0">
        <VImage :src="l.image" :alt="l.name ?? ''" sizes="64px" />
        <span class="absolute -end-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white tabular-nums">{{ l.quantity }}</span>
      </div>
      <div class="min-w-0 flex-1 text-[14px]">
        <p class="leading-snug">{{ l.name }}</p>
        <p class="text-[13px] text-graphite">{{ [l.color, l.size].filter(Boolean).join(' / ') }}</p>
        <p v-if="l.status && l.status !== 'ok'" class="text-[13px] text-error">
          {{ l.status === 'insufficient_stock' ? $t('cart.onlyLeft', { n: l.available }) : $t('cart.noLongerAvailable') }}
        </p>
      </div>
      <p class="text-[14px] tabular-nums">{{ money(l.price != null ? l.price * l.quantity : null) }}</p>
    </li>
  </ul>
</template>
