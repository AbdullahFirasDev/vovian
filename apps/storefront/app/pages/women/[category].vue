<script setup lang="ts">
const route = useRoute()
const store = useStoreConfig()
const { t } = useI18n()
const slug = computed(() => String(route.params.category))
const category = computed(() => store.categories('women').find((c) => c.slug === slug.value))
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })

usePageSeo({
  title: () => `${category.value?.name} · ${t('departments.women')}`,
  description: () => t('catalog.categoryIntro', { category: category.value?.name?.toLowerCase(), dept: t('departments.women').toLowerCase() }),
  image: () => category.value?.image_url,
})
</script>

<template>
  <CatalogView
    :key="slug"
    :title="category?.name ?? ''"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('departments.women'), to: '/women' }, { label: category?.name ?? '' }]"
    :base="{ department: 'women', category: slug }"
  />
</template>
