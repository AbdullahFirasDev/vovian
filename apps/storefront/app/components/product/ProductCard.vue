<script setup lang="ts">
import type { ProductCard } from '@vovian/types'
import { sortSizes } from '@vovian/shared'

const props = withDefaults(defineProps<{ product: ProductCard; priority?: boolean; layout?: 'grid' | 'list'; sizes?: string }>(), {
  layout: 'grid',
  sizes: 'xs:50vw md:33vw lg:25vw',
})

const cart = useCartStore()
const wishlist = useWishlistStore()
const ui = useUiStore()
const localePath = useLocalePath()
const { t } = useI18n()

const activeColor = ref<string | null>(props.product.colors[0]?.value ?? null)
const imagesForColor = computed(() => {
  const scoped = props.product.images.filter((i) => !i.color || i.color === activeColor.value)
  return scoped.length ? scoped : props.product.images
})
const primary = computed(() => imagesForColor.value[0])
const secondary = computed(() => imagesForColor.value[1] ?? (props.product.colors.length <= 1 ? props.product.images[1] : undefined))

const href = computed(() => localePath(`/products/${props.product.slug}${activeColor.value && props.product.colors.length > 1 ? `?color=${encodeURIComponent(activeColor.value)}` : ''}`))

const variantsForColor = computed(() => props.product.variants.filter((v) => v.color === activeColor.value || !activeColor.value))
const sizeOptions = computed(() => {
  const bySize = new Map(variantsForColor.value.map((v) => [v.size ?? '', v]))
  return sortSizes([...bySize.keys()]).map((s) => bySize.get(s)!)
})
const oneSize = computed(() => sizeOptions.value.length === 1)

const quickOpen = ref(false)
const wished = computed(() => wishlist.has(props.product.id))
const mounted = ref(false)
onMounted(() => (mounted.value = true))

function add(variantId: string) {
  const v = props.product.variants.find((x) => x.id === variantId)
  if (!v || v.available <= 0) return
  cart.add({
    variant_id: v.id,
    quantity: 1,
    product_id: props.product.id,
    slug: props.product.slug,
    name: props.product.name,
    image: primary.value?.url ?? null,
    color: v.color,
    size: v.size,
    price: props.product.price,
    compare_at: props.product.compare_at,
    available: v.available,
  })
  quickOpen.value = false
  ui.cartOpen = true
}

function onQuickAdd() {
  if (oneSize.value && sizeOptions.value[0]) add(sizeOptions.value[0].id)
  else quickOpen.value = !quickOpen.value
}

async function toggleWish() {
  const added = await wishlist.toggle(props.product.id)
  ui.toast(added ? t('wishlist.added') : t('wishlist.removed'), added ? { action: { label: t('wishlist.view'), to: '/wishlist' } } : {})
}

const badge = computed(() => {
  if (!props.product.in_stock) return t('product.soldOut')
  if (props.product.compare_at) return t('product.sale')
  if (props.product.is_new) return t('product.new')
  return null
})
</script>

<template>
  <article class="group relative" :class="layout === 'list' ? 'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-[var(--gutter)] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : ''">
    <div class="relative">
      <NuxtLink :to="href" class="block" :aria-label="product.name" tabindex="-1">
        <VImage :src="primary?.url" :alt="primary?.alt ?? product.name" :sizes="sizes" :priority="priority">
          <NuxtImg
            v-if="secondary"
            :src="secondary.url"
            :alt="''"
            :sizes="sizes"
            loading="lazy"
            class="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-couture)] [@media(hover:hover)]:group-hover:opacity-100"
          />
        </VImage>
      </NuxtLink>

      <p v-if="badge" class="pointer-events-none absolute start-3 top-3 bg-white px-2 py-1 text-[12px] leading-none">{{ badge }}</p>

      <ClientOnly>
        <button
          type="button"
          class="absolute end-1 top-1 grid size-11 place-items-center cursor-pointer"
          :aria-pressed="wished"
          :aria-label="wished ? $t('wishlist.removeNamed', { name: product.name }) : $t('wishlist.addNamed', { name: product.name })"
          @click="toggleWish"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
            <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
          </svg>
        </button>
      </ClientOnly>

      <!-- Quick add -->
      <div v-if="product.in_stock && layout === 'grid'" class="absolute inset-x-0 bottom-0">
        <Transition
          enter-active-class="transition duration-300 ease-[var(--ease-couture)]"
          leave-active-class="transition duration-200"
          enter-from-class="translate-y-2 opacity-0"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div v-if="quickOpen" class="bg-white/95 p-3 backdrop-blur-sm">
            <p class="mb-2 text-[12px] text-graphite">{{ $t('product.selectSize') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="v in sizeOptions"
                :key="v.id"
                type="button"
                class="h-9 min-w-10 border border-mist px-2 text-[13px] transition-colors hover:border-ink disabled:cursor-not-allowed disabled:text-stone disabled:line-through cursor-pointer"
                :disabled="v.available <= 0"
                :aria-label="v.available > 0 ? $t('product.addSize', { size: v.size }) : $t('product.sizeSoldOut', { size: v.size })"
                @click="add(v.id)"
              >
                {{ v.size }}
              </button>
            </div>
          </div>
        </Transition>
        <button
          v-if="!quickOpen"
          type="button"
          class="absolute bottom-2 end-2 grid size-10 place-items-center bg-white transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
          :aria-label="$t('product.quickAddNamed', { name: product.name })"
          :aria-expanded="quickOpen"
          @click="onQuickAdd"
        >
          <VIcon name="plus" :size="18" />
        </button>
        <button v-else type="button" class="absolute end-1 top-1 grid size-9 place-items-center cursor-pointer" :aria-label="$t('common.close')" @click="quickOpen = false">
          <VIcon name="close" :size="16" />
        </button>
      </div>
    </div>

    <div :class="layout === 'list' ? 'flex flex-col justify-center' : 'pt-3'">
      <h3 class="text-[14px] leading-snug md:text-[15px]" :class="layout === 'list' && 'font-display text-2xl md:text-3xl'">
        <NuxtLink :to="href" class="after:absolute after:inset-0 after:content-[''] md:after:hidden">{{ product.name }}</NuxtLink>
      </h3>
      <VPrice :price="product.price" :compare-at="product.compare_at" size="sm" class="mt-1 text-graphite" />
      <ul v-if="product.colors.length > 1" class="relative z-10 mt-2.5 flex gap-1.5" :aria-label="$t('product.colours')">
        <li v-for="c in product.colors" :key="c.value">
          <button
            type="button"
            class="block size-3 border cursor-pointer"
            :class="activeColor === c.value ? 'border-ink outline outline-1 outline-offset-2 outline-ink' : 'border-ink/20'"
            :style="{ backgroundColor: c.hex ?? '#ccc' }"
            :aria-label="c.label"
            :aria-pressed="activeColor === c.value"
            @click="activeColor = c.value"
          />
        </li>
      </ul>
      <template v-if="layout === 'list'">
        <p class="mt-4 text-[14px] text-graphite">
          {{ $t('product.sizesAvailable') }}:
          <span class="text-ink">{{ sizeOptions.filter((v) => v.available > 0).map((v) => v.size).join(', ') || $t('product.soldOut') }}</span>
        </p>
        <div class="mt-6 flex flex-wrap gap-2">
          <VButton :to="`/products/${product.slug}`" variant="outline" size="sm">{{ $t('product.view') }}</VButton>
        </div>
      </template>
    </div>
  </article>
</template>
