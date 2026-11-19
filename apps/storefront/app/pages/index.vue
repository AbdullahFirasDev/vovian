<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

definePageMeta({ headerOverlay: true })

interface HomeSection {
  id: string
  type: string
  title: string | null
  subtitle: string | null
  body: string | null
  config: Record<string, unknown>
  products: ProductCard[] | null
  collections: unknown[] | null
}
interface HomeBanner { placement: 'hero' | 'campaign' | 'promo_strip'; [k: string]: unknown }

const supabase = useSupabaseClient()
const { locale, t } = useI18n()

const { data } = await useAsyncData(
  () => `home:${locale.value}`,
  async () => {
    const { data, error } = await supabase.rpc('get_homepage', { p_locale: locale.value })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data as unknown as { banners: HomeBanner[]; sections: HomeSection[] }
  },
  { watch: [locale] },
)

const hero = computed(() => data.value?.banners.find((b) => b.placement === 'hero') ?? null)
const campaign = computed(() => data.value?.banners.find((b) => b.placement === 'campaign') ?? null)
const sections = computed(() => data.value?.sections ?? [])

usePageSeo({ title: () => undefined, description: () => t('home.metaDescription'), image: () => hero.value?.image_url as string | undefined })

// Mark motion support before hydration so the hero's first paint is its start state.
useHead({
  script: [{
    key: 'motion-ok',
    innerHTML: "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion-ok')",
    tagPosition: 'head',
  }],
})
</script>

<template>
  <div>
    <template v-for="s in sections" :key="s.id">
      <HomeHero v-if="s.type === 'hero'" :banner="hero as any" />
      <HomeEditorialIntro v-else-if="s.type === 'editorial_intro'" :section="s as any" />
      <HomeCategories v-else-if="s.type === 'categories'" :section="s as any" />
      <HomeCollections v-else-if="s.type === 'featured_collections'" :section="s as any" />
      <HomeProducts v-else-if="s.type === 'new_arrivals' && s.products?.length" :section="s as any" />
      <HomeCampaign v-else-if="s.type === 'campaign'" :banner="campaign as any" :interactive="(s.config as { three?: boolean }).three" />
      <ProductRail
        v-else-if="s.type === 'best_sellers' && s.products?.length"
        :title="s.title ?? ''"
        :subtitle="s.subtitle"
        :products="s.products"
        :href="(s.config as { href?: string }).href"
      />
      <HomePhilosophy v-else-if="s.type === 'philosophy'" :section="s as any" />
      <HomeNewsletter v-else-if="s.type === 'newsletter'" :section="s as any" />
    </template>
  </div>
</template>
