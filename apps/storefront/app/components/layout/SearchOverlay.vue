<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

const ui = useUiStore()
const api = useCatalogApi()
const history = useSearchHistory()
const localePath = useLocalePath()
const router = useRouter()

const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, toRef(ui, 'searchOpen'), () => (ui.searchOpen = false))

const q = ref('')
const loading = ref(false)
const results = ref<{ products: ProductCard[]; categories: { slug: string; department: string; name: string }[] }>({ products: [], categories: [] })

let timer: ReturnType<typeof setTimeout> | undefined
let seq = 0
watch(q, (value) => {
  clearTimeout(timer)
  if (value.trim().length < 2) {
    results.value = { products: [], categories: [] }
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    const id = ++seq
    const r = await api.suggestions(value.trim())
    if (id === seq) {
      results.value = r
      loading.value = false
    }
  }, 180)
})

function submit(term = q.value) {
  const t = term.trim()
  if (!t) return
  history.push(t)
  ui.searchOpen = false
  router.push(localePath({ path: '/search', query: { q: t } }))
}

const route = useRoute()
watch(() => route.fullPath, () => (ui.searchOpen = false))
watch(() => ui.searchOpen, (open) => open && history.load())

const popular = computed(() => [
  { label: 'nav.newArrivals', to: '/new-arrivals' },
  { label: 'search.popularCoats', to: '/women/outerwear' },
  { label: 'search.popularTailoring', to: '/men/tailoring' },
  { label: 'search.popularKnitwear', to: '/search?q=knit' },
])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="ui.searchOpen" class="fixed inset-0 z-[65] bg-ink/40" @click="ui.searchOpen = false" />
    </Transition>
    <Transition
      enter-active-class="transition-[clip-path] duration-[600ms] ease-[var(--ease-couture)]"
      leave-active-class="transition-[clip-path] duration-300 ease-[var(--ease-curtain)]"
      enter-from-class="[clip-path:inset(0_0_100%_0)]"
      leave-to-class="[clip-path:inset(0_0_100%_0)]"
    >
      <div v-if="ui.searchOpen" ref="panel" role="dialog" aria-modal="true" :aria-label="$t('search.title')" class="fixed inset-x-0 top-0 z-[66] max-h-[100svh] overflow-y-auto bg-white">
        <form class="shell flex items-center gap-4 border-b border-ink py-5 md:py-8" role="search" @submit.prevent="submit()">
          <VIcon name="search" :size="26" />
          <label for="site-search" class="sr-only">{{ $t('search.label') }}</label>
          <input
            id="site-search"
            v-model="q"
            data-autofocus
            type="search"
            autocomplete="off"
            enterkeyhint="search"
            :placeholder="$t('search.placeholder')"
            class="min-w-0 flex-1 bg-transparent font-display text-[28px] outline-none placeholder:text-stone md:text-[44px]"
          >
          <button type="button" class="grid size-11 place-items-center cursor-pointer" :aria-label="$t('common.close')" @click="ui.searchOpen = false">
            <VIcon name="close" />
          </button>
        </form>

        <div class="shell grid gap-10 py-8 md:grid-cols-12 md:py-12">
          <!-- Suggestions -->
          <template v-if="q.trim().length >= 2">
            <div class="md:col-span-3">
              <p class="mb-4 text-[13px] text-graphite">{{ $t('search.categories') }}</p>
              <ul v-if="results.categories.length" class="space-y-2">
                <li v-for="c in results.categories" :key="`${c.department}-${c.slug}`">
                  <NuxtLink :to="localePath(`/${c.department}/${c.slug}`)" class="link-draw text-[16px]">
                    {{ c.name }} <span class="text-graphite">· {{ $t(`departments.${c.department}`) }}</span>
                  </NuxtLink>
                </li>
              </ul>
              <p v-else-if="!loading" class="text-[14px] text-graphite">{{ $t('search.noCategories') }}</p>
            </div>
            <div class="md:col-span-9">
              <div class="mb-4 flex items-baseline justify-between">
                <p class="text-[13px] text-graphite">{{ $t('search.products') }}</p>
                <button v-if="results.products.length" type="button" class="link-static text-[14px] cursor-pointer" @click="submit()">{{ $t('search.seeAll', { q }) }}</button>
              </div>
              <ul v-if="results.products.length" class="grid grid-cols-2 gap-[var(--gutter)] sm:grid-cols-3 lg:grid-cols-6">
                <li v-for="p in results.products" :key="p.id">
                  <NuxtLink :to="localePath(`/products/${p.slug}`)" class="group block">
                    <VImage :src="p.images[0]?.url" :alt="p.images[0]?.alt ?? p.name" sizes="xs:40vw md:20vw lg:15vw" />
                    <p class="mt-2 text-[14px] leading-snug">{{ p.name }}</p>
                    <VPrice :price="p.price" :compare-at="p.compare_at" size="sm" class="text-graphite" />
                  </NuxtLink>
                </li>
              </ul>
              <p v-else-if="!loading" class="text-[15px]">{{ $t('search.noResults', { q }) }}</p>
              <ul v-else class="grid grid-cols-2 gap-[var(--gutter)] sm:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
                <li v-for="i in 6" :key="i" class="skeleton aspect-[3/4]" />
              </ul>
            </div>
          </template>

          <!-- Empty state: history + popular -->
          <template v-else>
            <div v-if="history.items.value.length" class="md:col-span-4">
              <div class="mb-4 flex items-baseline justify-between">
                <p class="text-[13px] text-graphite">{{ $t('search.recent') }}</p>
                <button type="button" class="text-[13px] link-static cursor-pointer" @click="history.clear()">{{ $t('search.clear') }}</button>
              </div>
              <ul class="space-y-2">
                <li v-for="term in history.items.value" :key="term">
                  <button type="button" class="link-draw text-[18px] cursor-pointer" @click="submit(term)">{{ term }}</button>
                </li>
              </ul>
            </div>
            <div class="md:col-span-4">
              <p class="mb-4 text-[13px] text-graphite">{{ $t('search.popular') }}</p>
              <ul class="space-y-2">
                <li v-for="p in popular" :key="p.to">
                  <NuxtLink :to="localePath(p.to)" class="link-draw text-[18px]">{{ $t(p.label) }}</NuxtLink>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
