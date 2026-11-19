<script setup lang="ts">
import type { ProductCard as Card } from '@vovian/types'

defineProps<{ title: string; products: Card[]; subtitle?: string | null; href?: string; linkLabel?: string }>()
const localePath = useLocalePath()
const track = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(false)

function update() {
  const el = track.value
  if (!el) return
  const x = Math.abs(el.scrollLeft)
  atStart.value = x < 8
  atEnd.value = x + el.clientWidth >= el.scrollWidth - 8
}
function scroll(dir: 1 | -1) {
  const el = track.value
  if (!el) return
  const rtl = getComputedStyle(el).direction === 'rtl'
  el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' })
}
onMounted(update)
</script>

<template>
  <section class="py-16 md:py-24">
    <div class="shell mb-8 flex items-end justify-between gap-6 md:mb-12">
      <div>
        <h2 class="display-lg">{{ title }}</h2>
        <p v-if="subtitle" class="mt-3 text-[15px] text-graphite">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-4">
        <NuxtLink v-if="href" :to="localePath(href)" class="hidden text-[14px] link-draw sm:inline">{{ linkLabel ?? $t('common.viewAll') }}</NuxtLink>
        <div class="hidden gap-1 md:flex">
          <button type="button" class="grid size-11 place-items-center border border-mist disabled:opacity-30 cursor-pointer" :disabled="atStart" :aria-label="$t('common.previous')" @click="scroll(-1)">
            <VIcon name="chevron-left" :size="18" />
          </button>
          <button type="button" class="grid size-11 place-items-center border border-mist disabled:opacity-30 cursor-pointer" :disabled="atEnd" :aria-label="$t('common.next')" @click="scroll(1)">
            <VIcon name="chevron-right" :size="18" />
          </button>
        </div>
      </div>
    </div>
    <ul
      ref="track"
      class="flex snap-x snap-mandatory gap-[var(--gutter)] overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] no-scrollbar"
      @scroll.passive="update"
    >
      <li v-for="p in products" :key="p.id" class="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[22vw] 2xl:w-[18vw]">
        <ProductCard :product="p" sizes="xs:70vw sm:42vw md:30vw lg:22vw" />
      </li>
    </ul>
    <div v-if="href" class="shell mt-8 sm:hidden">
      <NuxtLink :to="localePath(href)" class="text-[14px] link-static">{{ linkLabel ?? $t('common.viewAll') }}</NuxtLink>
    </div>
  </section>
</template>
