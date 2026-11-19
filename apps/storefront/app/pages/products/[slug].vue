<script setup lang="ts">
import type { ProductCard as Card, ProductDetail } from '@vovian/types'

const route = useRoute()
const router = useRouter()
const api = useCatalogApi()
const cart = useCartStore()
const wishlist = useWishlistStore()
const ui = useUiStore()
const store = useStoreConfig()
const localePath = useLocalePath()
const { locale, t } = useI18n()

const slug = computed(() => String(route.params.slug))
const { data: product } = await useAsyncData(() => `product:${slug.value}:${locale.value}`, () => api.product(slug.value), { watch: [locale] })
if (!product.value) throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
const p = computed(() => product.value as ProductDetail)

// ── Selection ───────────────────────────────────────────────────────────
const colors = computed(() => p.value.options.filter((o) => o.kind === 'color'))
const initialColor = colors.value.find((c) => c.value === route.query.color)?.value ?? colors.value.find((c) => p.value.variants.some((v) => v.color === c.value && v.available > 0))?.value ?? colors.value[0]?.value ?? null
const color = ref<string | null>(initialColor)
const size = ref<string | null>(null)
const quantity = ref(1)
const sizeError = ref(false)

const variantsForColor = computed(() => p.value.variants.filter((v) => !color.value || v.color === color.value))
const sizeOptions = computed(() => variantsForColor.value)
const isOneSize = computed(() => sizeOptions.value.length === 1 && (sizeOptions.value[0]?.size === 'One Size' || !sizeOptions.value[0]?.size))
const selected = computed(() =>
  isOneSize.value ? sizeOptions.value[0] : sizeOptions.value.find((v) => v.size === size.value),
)
watch(isOneSize, (one) => one && (size.value = sizeOptions.value[0]?.size ?? null), { immediate: true })

const price = computed(() => selected.value?.price ?? Math.min(...variantsForColor.value.map((v) => v.price)))
const compareAt = computed(() => selected.value?.compare_at ?? variantsForColor.value.find((v) => v.price === price.value)?.compare_at ?? null)
const maxQty = computed(() => Math.min(10, selected.value?.available ?? 10))
watch(selected, () => (quantity.value = Math.min(quantity.value, Math.max(1, maxQty.value))))

function selectColor(value: string) {
  color.value = value
  const stillThere = p.value.variants.find((v) => v.color === value && v.size === size.value)
  if (!stillThere || stillThere.available <= 0) size.value = null
  router.replace({ query: { ...route.query, color: value } })
}

// Gallery follows the selected colour (and explicit variant imagery)
const images = computed(() => {
  const all = p.value.images
  const variantId = selected.value?.id
  const specific = all.filter((i) => (color.value && i.color === color.value) || (variantId && i.variant_ids?.includes(variantId)))
  const general = all.filter((i) => !i.color && !specific.includes(i))
  const list = [...specific, ...general]
  return list.length ? list : all
})

// ── Actions ─────────────────────────────────────────────────────────────
const adding = ref(false)
function addToBag(buyNow = false) {
  if (!selected.value) {
    sizeError.value = true
    document.getElementById('size-picker')?.focus()
    return
  }
  if (selected.value.available <= 0) return
  adding.value = true
  cart.add({
    variant_id: selected.value.id,
    quantity: quantity.value,
    product_id: p.value.id,
    slug: p.value.slug,
    name: p.value.name,
    image: images.value[0]?.url ?? null,
    color: selected.value.color,
    size: selected.value.size,
    price: selected.value.price,
    compare_at: selected.value.compare_at,
    available: selected.value.available,
  })
  adding.value = false
  if (buyNow) router.push(localePath('/checkout'))
  else ui.cartOpen = true
}
watch(size, () => (sizeError.value = false))

const wished = computed(() => wishlist.has(p.value.id))
async function toggleWish() {
  const added = await wishlist.toggle(p.value.id)
  ui.toast(added ? t('wishlist.added') : t('wishlist.removed'))
}

const sizeGuideOpen = ref(false)
const openPanel = ref<string | null>('description')

// ── Recently viewed ─────────────────────────────────────────────────────
const recent = useRecentlyViewed()
const recentCards = ref<Card[]>([])
onMounted(async () => {
  recent.load()
  const others = recent.items.value.filter((id) => id !== p.value.id).slice(0, 8)
  recent.push(p.value.id)
  recentCards.value = await api.cards(others)
})

// ── SEO ─────────────────────────────────────────────────────────────────
usePageSeo({
  title: () => p.value.seo_title ?? p.value.name,
  description: () => p.value.seo_description ?? p.value.description,
  image: () => p.value.images[0]?.url,
})
useProductSchema(product as Ref<ProductDetail | null>, store.currency)

const deptLabel = computed(() => t(`departments.${p.value.department === 'unisex' ? 'women' : p.value.department}`))
const breadcrumbs = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: deptLabel.value, to: `/${p.value.department === 'unisex' ? 'women' : p.value.department}` },
  ...(p.value.category ? [{ label: p.value.category.name, to: `/${p.value.category.department}/${p.value.category.slug}` }] : []),
  { label: p.value.name },
])
const lowStock = computed(() => selected.value && selected.value.available > 0 && selected.value.available <= 3)
</script>

<template>
  <div>
    <div class="shell pt-6 pb-4 lg:hidden">
      <VBreadcrumbs :items="breadcrumbs" />
    </div>

    <div class="lg:shell lg:grid lg:grid-cols-12 lg:gap-[var(--gutter)] lg:pt-8">
      <div class="lg:col-span-7">
        <ProductGallery :images="images" :name="p.name" />
      </div>

      <section class="shell py-8 lg:col-span-5 lg:px-0 lg:py-0 xl:col-span-4 xl:col-start-9" :aria-labelledby="'product-title'">
        <div class="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          <div class="hidden lg:block"><VBreadcrumbs :items="breadcrumbs" /></div>

          <p v-if="p.is_new" class="mt-6 text-[13px] text-graphite">{{ $t('product.newIn') }}</p>
          <h1 id="product-title" class="mt-2 display-md lg:mt-3">{{ p.name }}</h1>
          <VPrice :price="price" :compare-at="compareAt" size="lg" class="mt-3" />
          <p class="mt-1 text-[13px] text-graphite">{{ $t('product.taxIncluded') }}</p>

          <!-- Colour -->
          <fieldset v-if="colors.length" class="mt-8">
            <legend class="text-[14px]">
              {{ $t('product.colour') }}: <span class="text-graphite">{{ colors.find((c) => c.value === color)?.label }}</span>
            </legend>
            <div class="mt-3 flex flex-wrap gap-2.5">
              <button
                v-for="c in colors"
                :key="c.value"
                type="button"
                class="size-9 border cursor-pointer"
                :class="color === c.value ? 'outline outline-1 outline-offset-[3px] outline-ink border-ink/30' : 'border-ink/20 hover:border-ink'"
                :style="{ backgroundColor: c.hex ?? '#ccc' }"
                :aria-pressed="color === c.value"
                :aria-label="c.label"
                @click="selectColor(c.value)"
              />
            </div>
          </fieldset>

          <!-- Size -->
          <fieldset v-if="!isOneSize" id="size-picker" class="mt-7" tabindex="-1" :aria-invalid="sizeError || undefined" :aria-describedby="sizeError ? 'size-error' : undefined">
            <div class="flex items-baseline justify-between">
              <legend class="text-[14px]">{{ $t('product.size') }}<span v-if="size" class="text-graphite">: {{ size }}</span></legend>
              <button v-if="p.size_guide !== 'none'" type="button" class="flex items-center gap-1.5 text-[13px] link-static cursor-pointer" @click="sizeGuideOpen = true">
                <VIcon name="ruler" :size="16" /> {{ $t('product.sizeGuide') }}
              </button>
            </div>
            <div class="mt-3 grid grid-cols-5 gap-1.5">
              <label
                v-for="v in sizeOptions"
                :key="v.id"
                class="relative grid h-12 place-items-center border text-[14px] transition-colors"
                :class="[
                  v.available <= 0 ? 'cursor-not-allowed border-mist text-stone' : 'cursor-pointer hover:border-ink',
                  size === v.size ? 'border-ink bg-ink text-white' : 'border-mist',
                ]"
              >
                <input v-model="size" type="radio" name="size" :value="v.size" :disabled="v.available <= 0" class="peer sr-only">
                <span :class="v.available <= 0 && 'line-through'">{{ v.size }}</span>
                <span v-if="v.available <= 0" class="sr-only">{{ $t('product.soldOut') }}</span>
                <span class="pointer-events-none absolute -inset-0.5 hidden outline-2 outline-ink peer-focus-visible:block" />
              </label>
            </div>
            <p v-if="sizeError" id="size-error" class="mt-2 text-[13px] text-error" role="alert">{{ $t('product.selectSizeError') }}</p>
            <p v-else-if="lowStock" class="mt-2 text-[13px]">{{ $t('product.onlyLeft', { n: selected!.available }) }}</p>
          </fieldset>

          <!-- Quantity + actions -->
          <!-- Narrow screens: quantity + wishlist share a row, the main action spans full width below. -->
          <div class="mt-7 flex flex-wrap gap-2">
            <VQuantity v-model="quantity" :max="Math.max(1, maxQty)" :label="$t('product.quantity')" />
            <VButton
              class="order-last basis-full xs:order-none xs:basis-auto xs:flex-1"
              size="lg"
              :loading="adding"
              :disabled="selected ? selected.available <= 0 : variantsForColor.every((v) => v.available <= 0)"
              @click="addToBag(false)"
            >
              {{ selected && selected.available <= 0 ? $t('product.soldOut') : $t('product.addToBag') }}
            </VButton>
            <ClientOnly>
              <button
                type="button"
                class="ms-auto grid h-12 w-14 shrink-0 place-items-center border border-mist hover:border-ink xs:ms-0 xs:h-14 cursor-pointer"
                :aria-pressed="wished"
                :aria-label="wished ? $t('wishlist.remove') : $t('wishlist.add')"
                @click="toggleWish"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
                  <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
                </svg>
              </button>
            </ClientOnly>
          </div>
          <VButton variant="outline" block size="lg" class="mt-2" :disabled="!!selected && selected.available <= 0" @click="addToBag(true)">{{ $t('product.buyNow') }}</VButton>

          <ul class="mt-6 space-y-2 text-[13px] text-graphite">
            <li class="flex items-center gap-2"><VIcon name="truck" :size="18" /> {{ $t('product.deliveryNote') }}</li>
            <li class="flex items-center gap-2"><VIcon name="return" :size="18" /> {{ $t('product.returnsNote') }}</li>
            <li class="flex items-center gap-2"><VIcon name="needle" :size="18" /> {{ $t('product.repairsNote') }}</li>
          </ul>

          <p class="mt-6 text-[12px] text-graphite">{{ $t('product.reference') }} {{ selected?.sku ?? p.style_code }}</p>

          <!-- Details accordions -->
          <div class="mt-8 border-t border-mist">
            <div v-for="panel in ['description', 'details', 'care', 'delivery']" :key="panel" class="border-b border-mist">
              <h2>
                <button
                  type="button"
                  class="flex w-full items-center justify-between py-4 text-start text-[15px] cursor-pointer"
                  :aria-expanded="openPanel === panel"
                  :aria-controls="`panel-${panel}`"
                  @click="openPanel = openPanel === panel ? null : panel"
                >
                  {{ $t(`product.panels.${panel}`) }}
                  <VIcon :name="openPanel === panel ? 'minus' : 'plus'" :size="16" />
                </button>
              </h2>
              <div v-show="openPanel === panel" :id="`panel-${panel}`" class="pb-6 text-[15px] leading-relaxed">
                <p v-if="panel === 'description'">{{ p.description }}</p>
                <template v-else-if="panel === 'details'">
                  <p v-if="p.fit"><strong class="font-medium">{{ $t('product.fit') }}:</strong> {{ p.fit }}</p>
                  <ul class="mt-3 list-disc space-y-1 ps-5">
                    <li v-for="d in p.details" :key="d">{{ d }}</li>
                  </ul>
                </template>
                <template v-else-if="panel === 'care'">
                  <p><strong class="font-medium">{{ $t('product.material') }}:</strong> {{ p.material }}</p>
                  <p class="mt-2"><strong class="font-medium">{{ $t('product.care') }}:</strong> {{ p.care }}</p>
                </template>
                <template v-else>
                  <p>{{ $t('product.deliveryPanel') }}</p>
                  <p class="mt-2">
                    <NuxtLink :to="localePath('/pages/shipping-policy')" class="link-static">{{ $t('nav.shipping') }}</NuxtLink>
                    ·
                    <NuxtLink :to="localePath('/pages/returns')" class="link-static">{{ $t('nav.returns') }}</NuxtLink>
                  </p>
                </template>
              </div>
            </div>
          </div>

          <!-- Reviews -->
          <div v-if="p.rating?.count" class="mt-8">
            <p class="flex items-baseline gap-3">
              <span class="font-display text-3xl tabular-nums">{{ p.rating.average }}</span>
              <span class="text-[13px] text-graphite">{{ $t('product.reviewCount', { n: p.rating.count }, p.rating.count) }}</span>
            </p>
            <ul class="mt-4 space-y-5">
              <li v-for="r in p.reviews.slice(0, 3)" :key="r.created_at + r.author" class="border-t border-mist pt-4">
                <p class="text-[13px]" :aria-label="$t('product.ratingOf', { n: r.rating })">
                  <span aria-hidden="true">{{ '●'.repeat(r.rating) }}<span class="text-mist">{{ '●'.repeat(5 - r.rating) }}</span></span>
                </p>
                <p class="mt-1 text-[15px] font-medium">{{ r.title }}</p>
                <p class="mt-1 text-[14px] text-graphite">{{ r.body }}</p>
                <p class="mt-2 text-[12px] text-graphite">{{ r.author }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <ProductRail v-if="p.related.length" :title="$t('product.related')" :products="p.related" />
    <ClientOnly>
      <ProductRail v-if="recentCards.length" :title="$t('product.recentlyViewed')" :products="recentCards" class="border-t border-mist" />
    </ClientOnly>

    <VModal v-model="sizeGuideOpen" :title="$t('product.sizeGuide')" size="lg">
      <SizeGuide :guide="p.size_guide" :department="p.department" />
    </VModal>
  </div>
</template>
