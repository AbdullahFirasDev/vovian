<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

defineProps<{ section: { title: string | null; subtitle: string | null; config: { href?: string }; products: ProductCard[] | null } }>()
const localePath = useLocalePath()
</script>

<template>
  <section class="shell py-20 md:py-28">
    <div class="mb-10 flex items-end justify-between gap-6 md:mb-14">
      <div>
        <h2 class="display-lg">{{ section.title }}</h2>
        <p v-if="section.subtitle" class="mt-3 text-[15px] text-graphite">{{ section.subtitle }}</p>
      </div>
      <NuxtLink v-if="section.config.href" :to="localePath(section.config.href)" class="shrink-0 text-[14px] link-draw">{{ $t('common.viewAll') }}</NuxtLink>
    </div>
    <ProductGrid :products="section.products ?? []" :priority-count="0" />
  </section>
</template>
