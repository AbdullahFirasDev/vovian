<script setup lang="ts">
const props = defineProps<{ items: { label: string; to?: string }[] }>()
const localePath = useLocalePath()
const config = useRuntimeConfig()

useHead({
  script: [{
    type: 'application/ld+json',
    key: 'breadcrumbs-ld',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: props.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        ...(item.to ? { item: `${config.public.siteUrl}${localePath(item.to)}` } : {}),
      })),
    })),
  }],
})
</script>

<template>
  <nav :aria-label="$t('common.breadcrumb')">
    <ol class="flex flex-wrap items-center gap-x-2 text-[13px] text-graphite">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-2">
        <NuxtLink v-if="item.to && i < items.length - 1" :to="localePath(item.to)" class="link-draw hover:text-ink">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page" class="text-ink">{{ item.label }}</span>
        <span v-if="i < items.length - 1" aria-hidden="true" class="text-stone">/</span>
      </li>
    </ol>
  </nav>
</template>
