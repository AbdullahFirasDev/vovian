<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('departments.men'), description: () => t('catalog.intro.men') })
</script>

<template>
  <CatalogView
    :title="$t('departments.men')"
    :intro="$t('catalog.intro.men')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('departments.men') }]"
    :base="{ department: 'men' }"
    show-categories
  />
</template>
