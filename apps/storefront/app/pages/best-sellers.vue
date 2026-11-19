<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('nav.bestSellers'), description: () => t('catalog.intro.best') })
</script>

<template>
  <CatalogView
    :title="$t('nav.bestSellers')"
    :intro="$t('catalog.intro.best')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.bestSellers') }]"
    :base="{ best_sellers: true, sort: 'best_selling' }"
    show-categories
  />
</template>
