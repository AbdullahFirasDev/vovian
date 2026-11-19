<script setup lang="ts">
import type { CatalogFilters, CatalogResult } from '@vovian/types'

const props = defineProps<{ facets: CatalogResult['facets'] | null; filters: Partial<CatalogFilters>; showCategories?: boolean }>()
const emit = defineEmits<{ update: [patch: Partial<CatalogFilters>] }>()
const { money } = useFormat()

const open = reactive<Record<string, boolean>>({ category: true, color: true, size: true, price: true, availability: true })

function toggleIn(key: 'colors' | 'sizes' | 'categories', value: string) {
  const current = new Set(props.filters[key] ?? [])
  if (current.has(value)) current.delete(value)
  else current.add(value)
  emit('update', { [key]: [...current], page: 1 })
}
const isOn = (key: 'colors' | 'sizes' | 'categories', value: string) => (props.filters[key] ?? []).includes(value)

// Price: local inputs committed on blur / enter
const minPrice = ref<string>(props.filters.min_price?.toString() ?? '')
const maxPrice = ref<string>(props.filters.max_price?.toString() ?? '')
watch(() => [props.filters.min_price, props.filters.max_price], ([a, b]) => {
  minPrice.value = a?.toString() ?? ''
  maxPrice.value = b?.toString() ?? ''
})
function commitPrice() {
  const min = minPrice.value === '' ? undefined : Math.max(0, Number(minPrice.value))
  const max = maxPrice.value === '' ? undefined : Math.max(0, Number(maxPrice.value))
  emit('update', { min_price: Number.isFinite(min) ? min : undefined, max_price: Number.isFinite(max) ? max : undefined, page: 1 })
}

const pricePresets = computed(() => {
  const max = props.facets?.price.max ?? 0
  if (max <= 0) return []
  // "Nice" round thresholds relative to the most expensive piece in view.
  const nice = (v: number) => {
    const p = 10 ** Math.floor(Math.log10(v))
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((c) => c >= v) ?? v
  }
  const steps = [...new Set([0.1, 0.25, 0.5].map((f) => nice(max * f)))].filter((s) => s < max)
  return steps.map((s, i) => ({ min: i === 0 ? undefined : steps[i - 1], max: s }))
})

const minId = useId()
const maxId = useId()
</script>

<template>
  <div class="divide-y divide-mist">
    <!-- Category -->
    <section v-if="showCategories && facets?.categories.length" class="py-5">
      <h3>
        <button type="button" class="flex w-full items-center justify-between text-[14px] font-medium cursor-pointer" :aria-expanded="open.category" @click="open.category = !open.category">
          {{ $t('filters.category') }} <VIcon :name="open.category ? 'minus' : 'plus'" :size="16" />
        </button>
      </h3>
      <ul v-show="open.category" class="mt-4 space-y-2">
        <li v-for="c in facets.categories" :key="c.slug">
          <button
            type="button"
            class="flex w-full items-center justify-between py-0.5 text-start text-[15px] cursor-pointer"
            :aria-pressed="isOn('categories', c.slug)"
            @click="toggleIn('categories', c.slug)"
          >
            <span class="flex items-center gap-3">
              <span class="grid size-4 place-items-center border" :class="isOn('categories', c.slug) ? 'border-ink bg-ink text-white' : 'border-stone'">
                <VIcon v-if="isOn('categories', c.slug)" name="check" :size="12" />
              </span>
              {{ c.name }}
            </span>
            <span class="text-[13px] text-graphite tabular-nums">{{ c.count }}</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Colour -->
    <section v-if="facets?.colors.length" class="py-5">
      <h3>
        <button type="button" class="flex w-full items-center justify-between text-[14px] font-medium cursor-pointer" :aria-expanded="open.color" @click="open.color = !open.color">
          {{ $t('filters.colour') }} <VIcon :name="open.color ? 'minus' : 'plus'" :size="16" />
        </button>
      </h3>
      <ul v-show="open.color" class="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <li v-for="c in facets.colors" :key="c.value">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 text-start text-[14px] cursor-pointer"
            :aria-pressed="isOn('colors', c.value.toLowerCase())"
            @click="toggleIn('colors', c.value.toLowerCase())"
          >
            <span
              class="size-4 shrink-0 border"
              :class="isOn('colors', c.value.toLowerCase()) ? 'border-ink outline outline-1 outline-offset-2 outline-ink' : 'border-ink/20'"
              :style="{ backgroundColor: c.hex ?? '#ccc' }"
            />
            <span class="truncate">{{ c.value }}</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Size -->
    <section v-if="facets?.sizes.length" class="py-5">
      <h3>
        <button type="button" class="flex w-full items-center justify-between text-[14px] font-medium cursor-pointer" :aria-expanded="open.size" @click="open.size = !open.size">
          {{ $t('filters.size') }} <VIcon :name="open.size ? 'minus' : 'plus'" :size="16" />
        </button>
      </h3>
      <ul v-show="open.size" class="mt-4 flex flex-wrap gap-1.5">
        <li v-for="s in facets.sizes" :key="s.value">
          <button
            type="button"
            class="h-10 min-w-11 border px-2.5 text-[13px] transition-colors cursor-pointer"
            :class="isOn('sizes', s.value) ? 'border-ink bg-ink text-white' : 'border-mist hover:border-ink'"
            :aria-pressed="isOn('sizes', s.value)"
            @click="toggleIn('sizes', s.value)"
          >
            {{ s.value }}
          </button>
        </li>
      </ul>
    </section>

    <!-- Price -->
    <section v-if="facets" class="py-5">
      <h3>
        <button type="button" class="flex w-full items-center justify-between text-[14px] font-medium cursor-pointer" :aria-expanded="open.price" @click="open.price = !open.price">
          {{ $t('filters.price') }} <VIcon :name="open.price ? 'minus' : 'plus'" :size="16" />
        </button>
      </h3>
      <div v-show="open.price" class="mt-4">
        <form class="flex items-end gap-3" @submit.prevent="commitPrice">
          <div class="flex-1">
            <label :for="minId" class="block text-[12px] text-graphite">{{ $t('filters.min') }}</label>
            <input :id="minId" v-model="minPrice" type="number" inputmode="numeric" min="0" :placeholder="String(facets.price.min)" class="w-full border-b border-mist bg-transparent py-2 text-[15px] outline-none focus:border-ink" @blur="commitPrice">
          </div>
          <span class="pb-2 text-graphite" aria-hidden="true">–</span>
          <div class="flex-1">
            <label :for="maxId" class="block text-[12px] text-graphite">{{ $t('filters.max') }}</label>
            <input :id="maxId" v-model="maxPrice" type="number" inputmode="numeric" min="0" :placeholder="String(facets.price.max)" class="w-full border-b border-mist bg-transparent py-2 text-[15px] outline-none focus:border-ink" @blur="commitPrice">
          </div>
          <button type="submit" class="sr-only">{{ $t('filters.apply') }}</button>
        </form>
        <ul v-if="pricePresets.length" class="mt-4 flex flex-wrap gap-1.5">
          <li v-for="p in pricePresets" :key="p.max">
            <button
              type="button"
              class="h-9 border px-3 text-[13px] cursor-pointer"
              :class="filters.max_price === p.max && filters.min_price === p.min ? 'border-ink' : 'border-mist hover:border-ink'"
              @click="emit('update', { min_price: p.min, max_price: p.max, page: 1 })"
            >
              {{ p.min ? `${money(p.min)}–${money(p.max)}` : $t('filters.under', { price: money(p.max) }) }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <!-- Availability -->
    <section class="space-y-2 py-5">
      <VCheckbox :model-value="!!filters.in_stock" :label="$t('filters.inStock')" @update:model-value="emit('update', { in_stock: $event || undefined, page: 1 })" />
      <VCheckbox :model-value="!!filters.on_sale" :label="$t('filters.onSale')" @update:model-value="emit('update', { on_sale: $event || undefined, page: 1 })" />
    </section>
  </div>
</template>
