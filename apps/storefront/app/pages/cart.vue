<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

const cart = useCartStore()
const api = useCatalogApi()
const { t } = useI18n()
usePageSeo({ title: () => t('cart.title'), noindex: true })

onMounted(() => cart.refreshQuote())

// Recommendations: best sellers not already in the bag
const recommended = ref<ProductCard[]>([])
onMounted(async () => {
  const r = await api.search({ best_sellers: true, sort: 'best_selling', per_page: 12 })
  const inBag = new Set(cart.lines.map((l) => l.product_id))
  recommended.value = r.items.filter((p) => !inBag.has(p.id)).slice(0, 8)
})
</script>

<template>
  <div>
    <div class="shell pt-8 pb-16 md:pt-12">
      <h1 class="display-xl">{{ $t('cart.title') }}</h1>

      <VEmpty v-if="cart.hydrated && cart.isEmpty" :title="$t('cart.emptyTitle')" :body="$t('cart.emptyBody')" :action="{ label: $t('cart.continueShopping'), to: '/new-arrivals' }" />

      <div v-else class="mt-10 grid gap-12 lg:grid-cols-12">
        <section class="lg:col-span-7" :aria-label="$t('cart.title')">
          <p v-if="cart.hasIssues" class="mb-6 border border-error p-4 text-[14px] text-error" role="alert">
            {{ $t('cart.issuesNotice') }}
            <button type="button" class="link-static ms-1 cursor-pointer" @click="cart.resolveIssues()">{{ $t('cart.updateBag') }}</button>
          </p>
          <ul class="divide-y divide-mist border-y border-mist">
            <CartLineItem v-for="line in cart.lines" :key="line.variant_id" :line="line" />
          </ul>
        </section>

        <aside class="lg:col-span-4 lg:col-start-9">
          <div class="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <h2 class="mb-6 font-display text-2xl">{{ $t('cart.summary') }}</h2>
            <DiscountForm class="mb-6" />
            <OrderSummary :quote="cart.quote" :loading="cart.quoting" estimate />
            <VButton to="/checkout" block size="lg" class="mt-8" :disabled="cart.hasIssues || cart.isEmpty">{{ $t('cart.checkout') }}</VButton>
            <p class="mt-4 text-center text-[13px] text-graphite">{{ $t('footer.payments') }}</p>
          </div>
        </aside>
      </div>
    </div>

    <ProductRail v-if="recommended.length" :title="$t('cart.recommended')" :products="recommended" class="border-t border-mist" />
  </div>
</template>
