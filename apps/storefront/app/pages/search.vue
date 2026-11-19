<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const q = computed(() => String(route.query.q ?? '').trim())
const history = useSearchHistory()
watch(q, (v) => v && import.meta.client && history.push(v), { immediate: true })
usePageSeo({ title: () => (q.value ? t('search.resultsFor', { q: q.value }) : t('search.title')), noindex: true })
</script>

<template>
  <CatalogView
    :title="q ? $t('search.resultsFor', { q }) : $t('search.title')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('search.title') }]"
    :base="{}"
    show-categories
  />
</template>
