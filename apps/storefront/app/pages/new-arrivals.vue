<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('nav.newArrivals'), description: () => t('catalog.intro.new') })
</script>

<template>
  <CatalogView
    :title="$t('nav.newArrivals')"
    :intro="$t('catalog.intro.new')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.newArrivals') }]"
    :base="{ new_arrivals: true, sort: 'newest' }"
    show-categories
  />
</template>
