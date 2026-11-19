<script setup lang="ts">
const props = defineProps<{ slug: string; image?: string }>()
const supabase = useSupabaseClient()
const { locale, t } = useI18n()
const render = useMarkdown()
const { date } = useFormat()

const { data: page } = await useAsyncData(
  () => `page:${props.slug}:${locale.value}`,
  async () => {
    const { data } = await supabase.rpc('get_page', { p_slug: props.slug, p_locale: locale.value })
    return data as unknown as { title: string; summary: string | null; body: string; seo_title: string | null; seo_description: string | null; updated_at: string } | null
  },
  { watch: [locale] },
)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

usePageSeo({ title: () => page.value?.seo_title ?? page.value?.title, description: () => page.value?.seo_description ?? page.value?.summary })
const html = computed(() => render(page.value?.body))
</script>

<template>
  <article v-if="page" class="pb-24">
    <header class="shell grid-editorial gap-y-6 pt-8 pb-12 md:pt-12 md:pb-16">
      <div class="col-span-4 md:col-span-12">
        <VBreadcrumbs :items="[{ label: t('nav.home'), to: '/' }, { label: page.title }]" />
      </div>
      <h1 class="col-span-4 mt-4 display-xl md:col-span-8">{{ page.title }}</h1>
      <p v-if="page.summary" class="col-span-4 self-end text-[16px] text-graphite md:col-span-4 md:col-start-9">{{ page.summary }}</p>
    </header>
    <div v-if="image" class="shell mb-16">
      <VImage :src="image" :alt="page.title" ratio="21/9" sizes="xs:100vw md:100vw lg:100vw xl:100vw 2xl:100vw" priority />
    </div>
    <div class="shell grid-editorial">
      <!-- eslint-disable-next-line vue/no-v-html -- rendered with markdown-it, raw HTML disabled -->
      <div class="prose-vovian col-span-4 md:col-span-7 md:col-start-3" v-html="html" />
    </div>
  </article>
</template>
