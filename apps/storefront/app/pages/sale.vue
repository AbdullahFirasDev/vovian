<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('nav.sale'), description: () => t('catalog.intro.sale') })
</script>

<template>
  <CatalogView
    :title="$t('nav.sale')"
    :intro="$t('catalog.intro.sale')"
    :breadcrumbs="[{ label: $t('nav.home'), to: '/' }, { label: $t('nav.sale') }]"
    :base="{ on_sale: true }"
    show-categories
  />
</template>
