<script setup lang="ts">
import type { CatalogFilters, CatalogSort, Department } from '@vovian/types'

const props = defineProps<{
  title: string
  intro?: string | null
  breadcrumbs: { label: string; to?: string }[]
  base: Partial<CatalogFilters>
  showCategories?: boolean
  heroImage?: string | null
}>()

const route = useRoute()
const router = useRouter()
const api = useCatalogApi()
const { locale } = useI18n()
const { t } = useI18n()

const filters = computed(() => filtersFromQuery(route.query))
const effective = computed<CatalogFilters>(() => ({ per_page: 24, ...props.base, ...filters.value }))

// Department scoping from mega-menu links (/new-arrivals?dept=women)
const deptFromQuery = computed(() => {
  const d = route.query.dept
  return d === 'women' || d === 'men' ? (d as Department) : undefined
})

const key = computed(() => `catalog:${locale.value}:${JSON.stringify(props.base)}:${route.fullPath}`)
const { data, status, error } = await useAsyncData(
  key,
  () => api.search({ ...effective.value, ...(deptFromQuery.value ? { department: deptFromQuery.value } : {}) }),
  { watch: [() => route.fullPath, locale] },
)
if (error.value) throw createError({ statusCode: 500, statusMessage: 'Catalogue unavailable' })

const pending = computed(() => status.value === 'pending')
const layout = useCookie<'grid' | 'list'>('vovian_layout', { default: () => 'grid', sameSite: 'lax' })
const drawerOpen = ref(false)

function update(patch: Partial<CatalogFilters>) {
  const next = { ...filters.value, ...patch }
  router.push({ query: { ...(deptFromQuery.value ? { dept: deptFromQuery.value } : {}), ...queryFromFilters(next) } })
}

function setPage(page: number) {
  update({ page })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const sorts: { value: CatalogSort; label: string }[] = [
  { value: 'featured', label: 'catalog.sortFeatured' },
  { value: 'newest', label: 'catalog.sortNewest' },
  { value: 'best_selling', label: 'catalog.sortBestSelling' },
  { value: 'price_asc', label: 'catalog.sortPriceAsc' },
  { value: 'price_desc', label: 'catalog.sortPriceDesc' },
]
const sort = computed({
  get: () => filters.value.sort ?? 'featured',
  set: (v: CatalogSort) => update({ sort: v, page: 1 }),
})

const { money } = useFormat()
const chips = computed(() => {
  const f = filters.value
  const out: { label: string; clear: Partial<CatalogFilters> }[] = []
  for (const c of f.categories ?? []) out.push({ label: data.value?.facets.categories.find((x) => x.slug === c)?.name ?? c, clear: { categories: (f.categories ?? []).filter((x) => x !== c) } })
  for (const c of f.colors ?? []) out.push({ label: c.charAt(0).toUpperCase() + c.slice(1), clear: { colors: (f.colors ?? []).filter((x) => x !== c) } })
  for (const s of f.sizes ?? []) out.push({ label: t('filters.sizeChip', { size: s }), clear: { sizes: (f.sizes ?? []).filter((x) => x !== s) } })
  if (f.min_price != null || f.max_price != null) out.push({ label: `${f.min_price != null ? money(f.min_price) : money(0)} – ${f.max_price != null ? money(f.max_price) : '∞'}`, clear: { min_price: undefined, max_price: undefined } })
  if (f.in_stock) out.push({ label: t('filters.inStock'), clear: { in_stock: undefined } })
  if (f.on_sale) out.push({ label: t('filters.onSale'), clear: { on_sale: undefined } })
  if (f.q) out.push({ label: `“${f.q}”`, clear: { q: undefined } })
  return out
})

function clearAll() {
  router.push({ query: deptFromQuery.value ? { dept: deptFromQuery.value } : {} })
}

const total = computed(() => data.value?.total ?? 0)
</script>

<template>
  <div>
    <!-- Header -->
    <header class="shell pt-8 md:pt-12" :class="heroImage ? 'pb-0' : 'pb-8 md:pb-12'">
      <VBreadcrumbs :items="breadcrumbs" />
      <div class="mt-8 grid-editorial items-end gap-y-4">
        <h1 class="col-span-4 display-xl md:col-span-8">{{ title }}</h1>
        <p v-if="intro" class="col-span-4 max-w-[46ch] text-[15px] text-graphite md:col-span-4 md:col-start-9">{{ intro }}</p>
      </div>
    </header>

    <div v-if="heroImage" class="shell mt-8 mb-10 md:mb-14">
      <VImage :src="heroImage" :alt="title" ratio="21/9" sizes="xs:100vw md:100vw lg:100vw xl:100vw 2xl:100vw" priority />
    </div>

    <!-- Toolbar -->
    <div class="sticky top-[var(--header-h)] z-30 border-y border-mist bg-white/95 backdrop-blur-sm">
      <div class="shell flex h-14 items-center justify-between gap-4">
        <div class="flex items-center gap-5">
          <button type="button" class="flex items-center gap-2 text-[14px] lg:hidden cursor-pointer" :aria-expanded="drawerOpen" @click="drawerOpen = true">
            <VIcon name="filter" :size="18" />
            {{ $t('filters.title') }}<span v-if="chips.length" class="tabular-nums"> ({{ chips.length }})</span>
          </button>
          <p class="hidden text-[14px] text-graphite lg:block tabular-nums" aria-live="polite">
            {{ $t('catalog.count', { n: total }, total) }}
          </p>
        </div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-[14px]">
            <span class="hidden text-graphite sm:inline">{{ $t('catalog.sortBy') }}</span>
            <span class="relative">
              <select v-model="sort" class="cursor-pointer appearance-none bg-transparent pe-6 text-[14px] outline-none" :aria-label="$t('catalog.sortBy')">
                <option v-for="s in sorts" :key="s.value" :value="s.value">{{ $t(s.label) }}</option>
              </select>
              <VIcon name="chevron-down" :size="14" class="pointer-events-none absolute end-0 top-1/2 -translate-y-1/2" />
            </span>
          </label>
          <div class="hidden items-center gap-1 sm:flex" role="group" :aria-label="$t('catalog.layout')">
            <button type="button" class="grid size-9 place-items-center cursor-pointer" :class="layout === 'grid' ? 'text-ink' : 'text-stone'" :aria-pressed="layout === 'grid'" :aria-label="$t('catalog.gridView')" @click="layout = 'grid'">
              <VIcon name="grid" :size="18" />
            </button>
            <button type="button" class="grid size-9 place-items-center cursor-pointer" :class="layout === 'list' ? 'text-ink' : 'text-stone'" :aria-pressed="layout === 'list'" :aria-label="$t('catalog.listView')" @click="layout = 'list'">
              <VIcon name="list" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="shell grid gap-[var(--gutter)] py-8 lg:grid-cols-12 lg:py-10">
      <!-- Desktop filters -->
      <aside class="hidden lg:col-span-3 lg:block xl:col-span-2" :aria-label="$t('filters.title')">
        <div class="sticky top-[calc(var(--header-h)+4.5rem)] max-h-[calc(100svh-var(--header-h)-6rem)] overflow-y-auto pe-4 no-scrollbar">
          <FilterPanel :facets="data?.facets ?? null" :filters="filters" :show-categories="showCategories" @update="update" />
        </div>
      </aside>

      <section class="lg:col-span-9 xl:col-span-10" :aria-busy="pending">
        <div v-if="chips.length" class="mb-6 flex flex-wrap items-center gap-2">
          <button
            v-for="chip in chips"
            :key="chip.label"
            type="button"
            class="flex h-9 items-center gap-2 border border-mist px-3 text-[13px] hover:border-ink cursor-pointer"
            :aria-label="$t('filters.removeChip', { name: chip.label })"
            @click="update({ ...chip.clear, page: 1 })"
          >
            {{ chip.label }} <VIcon name="close" :size="14" />
          </button>
          <button type="button" class="ms-2 text-[13px] link-static cursor-pointer" @click="clearAll">{{ $t('filters.clearAll') }}</button>
        </div>

        <ProductGridSkeleton v-if="pending && !data" />
        <div v-else-if="data && data.items.length" :class="pending && 'opacity-50 transition-opacity'">
          <ProductGrid :products="data.items" :layout="layout" :columns="4" />
          <div class="mt-16 flex flex-col items-center gap-4">
            <p class="text-[13px] text-graphite tabular-nums">
              {{ $t('catalog.showing', { from: (data.page - 1) * data.per_page + 1, to: Math.min(data.page * data.per_page, data.total), total: data.total }) }}
            </p>
            <VPagination :page="data.page" :total="data.total" :per-page="data.per_page" @change="setPage" />
          </div>
        </div>
        <VEmpty v-else :title="$t('catalog.emptyTitle')" :body="$t('catalog.emptyBody')">
          <button v-if="chips.length" type="button" class="mt-6 link-static cursor-pointer" @click="clearAll">{{ $t('filters.clearAll') }}</button>
        </VEmpty>
      </section>
    </div>

    <!-- Mobile filter drawer -->
    <VDrawer v-model="drawerOpen" side="start" :label="$t('filters.title')" width="24rem">
      <div class="flex h-[var(--header-h)] items-center justify-between border-b border-mist px-[var(--gutter)]">
        <h2 class="font-display text-2xl">{{ $t('filters.title') }}</h2>
        <button type="button" class="-me-2 grid size-11 place-items-center cursor-pointer" :aria-label="$t('common.close')" @click="drawerOpen = false">
          <VIcon name="close" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-[var(--gutter)]">
        <FilterPanel :facets="data?.facets ?? null" :filters="filters" :show-categories="showCategories" @update="update" />
      </div>
      <div class="grid grid-cols-2 gap-2 border-t border-mist p-[var(--gutter)]">
        <VButton variant="outline" @click="clearAll">{{ $t('filters.clear') }}</VButton>
        <VButton @click="drawerOpen = false">{{ $t('filters.showResults', { n: total }, total) }}</VButton>
      </div>
    </VDrawer>
  </div>
</template>
