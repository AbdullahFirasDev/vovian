<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const { locale, t } = useI18n()
const slug = computed(() => String(route.params.slug))

const { data: collection } = await useAsyncData(
  () => `collection:${slug.value}:${locale.value}`,
  async () => {
    const { data } = await supabase.rpc('get_collection', { p_slug: slug.value, p_locale: locale.value })
    return data as unknown as { name: string; subtitle: string | null; description: string | null; hero_image_url: string | null; cover_image_url: string | null; seo_title: string | null; seo_description: string | null } | null
  },
  { watch: [locale] },
)
if (!collection.value) throw createError({ statusCode: 404, statusMessage: 'Collection not found', fatal: true })

usePageSeo({
  title: () => collection.value?.seo_title ?? collection.value?.name,
  description: () => collection.value?.seo_description ?? collection.value?.description,
  image: () => collection.value?.cover_image_url,
})
</script>

<template>
  <CatalogView
    v-if="collection"
    :title="collection.name"
    :intro="collection.description"
    :hero-image="collection.hero_image_url"
    :breadcrumbs="[{ label: t('nav.home'), to: '/' }, { label: t('nav.collections'), to: '/collections' }, { label: collection.name }]"
    :base="{ collection: slug }"
    show-categories
  />
</template>
