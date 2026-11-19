<script setup lang="ts">
const props = defineProps<{ price: number | null | undefined; compareAt?: number | null; size?: 'sm' | 'md' | 'lg' }>()
const { money } = useFormat()
const onSale = computed(() => props.compareAt != null && props.price != null && props.compareAt > props.price)
</script>

<template>
  <p class="flex flex-wrap items-baseline gap-x-2 tabular-nums" :class="{ sm: 'text-[14px]', md: 'text-[15px]', lg: 'text-[18px]' }[size ?? 'md']">
    <span v-if="onSale" class="sr-only">{{ $t('product.salePrice') }}</span>
    <span data-price><bdi>{{ money(price) }}</bdi></span>
    <template v-if="onSale">
      <span class="sr-only">{{ $t('product.originalPrice') }}</span>
      <s class="text-graphite"><bdi>{{ money(compareAt) }}</bdi></s>
    </template>
  </p>
</template>
