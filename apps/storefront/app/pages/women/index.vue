<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('departments.women'), description: () => t('catalog.intro.women') })
</script>

<template>
  <CatalogView
    :title="$t('departments.women')"
    :intro="$t('catalog.intro.women')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('departments.women') }]"
    :base="{ department: 'women' }"
    show-categories
  />
</template>
