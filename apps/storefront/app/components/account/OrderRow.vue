<script setup lang="ts">
defineProps<{ order: { order_number: string; status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'; total: number; currency: string; created_at: string; item_count?: number } }>()
const { money, date, orderStatus } = useFormat()
const localePath = useLocalePath()
</script>

<template>
  <li>
    <NuxtLink :to="localePath(`/account/orders/${order.order_number}`)" class="group grid grid-cols-2 items-baseline gap-2 py-5 text-[15px] sm:grid-cols-4">
      <span class="font-medium tabular-nums">{{ order.order_number }}</span>
      <span class="text-end text-graphite sm:text-start">{{ date(order.created_at) }}</span>
      <span>{{ orderStatus(order.status) }}</span>
      <span class="flex items-center justify-end gap-3 tabular-nums">
        {{ money(order.total, order.currency) }}
        <VIcon name="chevron-right" :size="16" class="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
      </span>
    </NuxtLink>
  </li>
</template>
