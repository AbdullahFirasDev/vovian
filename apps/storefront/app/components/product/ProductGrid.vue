<script setup lang="ts">
import type { ProductCard as Card } from '@vovian/types'

withDefaults(defineProps<{ products: Card[]; layout?: 'grid' | 'list'; columns?: 3 | 4; priorityCount?: number }>(), {
  layout: 'grid',
  columns: 4,
  priorityCount: 4,
})
</script>

<template>
  <ul
    v-if="layout === 'grid'"
    class="grid grid-cols-2 gap-x-[var(--gutter)] gap-y-10 md:grid-cols-3 md:gap-y-14"
    :class="columns === 4 && 'xl:grid-cols-4'"
  >
    <li v-for="(p, i) in products" :key="p.id">
      <ProductCard :product="p" :priority="i < priorityCount" :sizes="columns === 4 ? 'xs:50vw md:33vw xl:25vw' : 'xs:50vw md:33vw'" />
    </li>
  </ul>
  <ul v-else class="divide-y divide-mist">
    <li v-for="(p, i) in products" :key="p.id" class="py-6 first:pt-0">
      <ProductCard :product="p" layout="list" :priority="i < 2" sizes="xs:40vw md:25vw" />
    </li>
  </ul>
</template>
