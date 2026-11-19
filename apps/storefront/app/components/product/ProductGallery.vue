<script setup lang="ts">
import type { ProductImage } from '@vovian/types'

const props = defineProps<{ images: ProductImage[]; name: string }>()

const zoomOpen = ref(false)
const zoomIndex = ref(0)
const activeSlide = ref(0)
const track = ref<HTMLElement | null>(null)

function openZoom(i: number) {
  zoomIndex.value = i
  zoomOpen.value = true
}

function onScroll() {
  const el = track.value
  if (!el) return
  activeSlide.value = Math.round(Math.abs(el.scrollLeft) / el.clientWidth)
}

watch(() => props.images, () => {
  activeSlide.value = 0
  track.value?.scrollTo({ left: 0 })
})
</script>

<template>
  <div>
    <!-- Mobile / tablet: swipe carousel -->
    <div class="relative lg:hidden">
      <ul ref="track" class="flex snap-x snap-mandatory overflow-x-auto no-scrollbar" :aria-label="$t('product.gallery')" @scroll.passive="onScroll">
        <li v-for="(img, i) in images" :key="img.url" class="w-full shrink-0 snap-start">
          <button type="button" class="block w-full cursor-zoom-in" :aria-label="$t('product.zoomImage', { n: i + 1 })" @click="openZoom(i)">
            <VImage :src="img.url" :alt="img.alt || name" ratio="4/5" sizes="xs:100vw md:100vw" :priority="i === 0" />
          </button>
        </li>
      </ul>
      <p v-if="images.length > 1" class="absolute bottom-3 end-3 bg-white px-2 py-1 text-[12px] tabular-nums" aria-hidden="true">
        {{ activeSlide + 1 }} / {{ images.length }}
      </p>
    </div>

    <!-- Desktop: editorial stack, first image full width -->
    <ul class="hidden grid-cols-2 gap-2 lg:grid">
      <li v-for="(img, i) in images" :key="img.url" :class="i === 0 || images.length === 2 ? 'col-span-2' : ''">
        <button type="button" class="group relative block w-full cursor-zoom-in" :aria-label="$t('product.zoomImage', { n: i + 1 })" @click="openZoom(i)">
          <VImage :src="img.url" :alt="img.alt || name" :ratio="i === 0 ? '4/5' : '3/4'" :sizes="i === 0 ? 'lg:58vw xl:58vw 2xl:58vw' : 'lg:29vw'" :priority="i === 0" />
          <span class="absolute bottom-3 end-3 grid size-10 place-items-center bg-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
            <VIcon name="zoom" :size="18" />
          </span>
        </button>
      </li>
    </ul>

    <ZoomViewer v-model="zoomOpen" v-model:index="zoomIndex" :images="images" :name="name" />
  </div>
</template>
