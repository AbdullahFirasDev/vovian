<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

const wishlist = useWishlistStore()
const user = useSupabaseUser()
const api = useCatalogApi()
const { t } = useI18n()
usePageSeo({ title: () => t('wishlist.title'), noindex: true })

const products = ref<ProductCard[]>([])
const loading = ref(true)
async function load() {
  wishlist.hydrate()
  products.value = await api.cards(wishlist.ids)
  loading.value = false
}
onMounted(load)
watch(() => wishlist.ids.length, load)
</script>

<template>
  <div class="shell pt-8 pb-24 md:pt-12">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h1 class="display-xl">{{ $t('wishlist.title') }}</h1>
      <p v-if="!user" class="text-[14px] text-graphite">
        {{ $t('wishlist.signInToSync') }}
        <NuxtLink :to="$localePath('/login')" class="link-static text-ink">{{ $t('nav.signIn') }}</NuxtLink>
      </p>
    </div>
    <div class="mt-12">
      <ProductGridSkeleton v-if="loading" :count="4" />
      <ProductGrid v-else-if="products.length" :products="products" />
      <VEmpty v-else :title="$t('wishlist.empty')" :body="$t('wishlist.emptyBody')" :action="{ label: $t('nav.newArrivals'), to: '/new-arrivals' }" />
    </div>
  </div>
</template>
