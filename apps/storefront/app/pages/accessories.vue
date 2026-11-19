<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('nav.accessories'), description: () => t('catalog.intro.accessories') })
</script>

<template>
  <CatalogView
    :title="$t('nav.accessories')"
    :intro="$t('catalog.intro.accessories')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.accessories') }]"
    :base="{ category: 'accessories' }"
  />
</template>
