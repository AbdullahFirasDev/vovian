<script setup lang="ts">
const route = useRoute()
const store = useStoreConfig()
const { t } = useI18n()
const slug = computed(() => String(route.params.category))
const category = computed(() => store.categories('men').find((c) => c.slug === slug.value))
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })

usePageSeo({
  title: () => `${category.value?.name} · ${t('departments.men')}`,
  description: () => t('catalog.categoryIntro', { category: category.value?.name?.toLowerCase(), dept: t('departments.men').toLowerCase() }),
  image: () => category.value?.image_url,
})
</script>

<template>
  <CatalogView
    :key="slug"
    :title="category?.name ?? ''"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('departments.men'), to: '/men' }, { label: category?.name ?? '' }]"
    :base="{ department: 'men', category: slug }"
  />
</template>
