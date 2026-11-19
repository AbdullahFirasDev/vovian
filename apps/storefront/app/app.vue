<script setup lang="ts">
const i18nHead = useLocaleHead({ seo: true })
const store = useStoreConfig()
await store.load()

const seo = computed(() => store.setting<{ title: string; description: string; og_image?: string; title_template?: string }>('seo'))

useHead({
  htmlAttrs: { lang: () => i18nHead.value.htmlAttrs?.lang, dir: () => i18nHead.value.htmlAttrs?.dir },
  link: () => [...(i18nHead.value.link ?? [])],
  meta: () => [...(i18nHead.value.meta ?? [])],
  titleTemplate: (title?: string) => {
    const tpl = seo.value?.title_template ?? '%s · VOVIAN'
    return title ? tpl.replace('%s', title) : (seo.value?.title ?? 'VOVIAN')
  },
})

useSeoMeta({
  description: () => seo.value?.description,
  ogSiteName: 'VOVIAN',
  ogType: 'website',
  ogImage: () => seo.value?.og_image,
  twitterCard: 'summary_large_image',
})

useSchemaOrg()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
