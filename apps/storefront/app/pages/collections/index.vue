<script setup lang="ts">
const store = useStoreConfig()
const localePath = useLocalePath()
const { t } = useI18n()
const collections = computed(() => store.config.value?.collections ?? [])
usePageSeo({ title: () => t('nav.collections'), description: () => t('collections.intro') })
</script>

<template>
  <div class="shell pt-8 pb-24 md:pt-12">
    <VBreadcrumbs :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.collections') }]" />
    <div class="mt-8 grid-editorial items-end gap-y-4">
      <h1 class="col-span-4 display-xl md:col-span-8">{{ $t('nav.collections') }}</h1>
      <p class="col-span-4 max-w-[46ch] text-[15px] text-graphite md:col-start-9">{{ $t('collections.intro') }}</p>
    </div>

    <ul class="mt-14 grid gap-x-[var(--gutter)] gap-y-16 md:grid-cols-2">
      <li v-for="(c, i) in collections" :key="c.slug" :class="i % 2 === 1 && 'md:mt-32'">
        <NuxtLink :to="localePath(`/collections/${c.slug}`)" class="group block">
          <VImage :src="c.cover_image_url" :alt="c.name" ratio="4/5" sizes="xs:100vw md:50vw xl:50vw 2xl:50vw" :priority="i < 2" img-class="transition-transform duration-[1.4s] ease-[var(--ease-couture)] group-hover:scale-[1.03]" />
          <div class="mt-5 flex items-baseline justify-between gap-4">
            <h2 class="display-md">{{ c.name }}</h2>
            <span class="text-[14px] link-draw">{{ $t('collections.discover') }}</span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
