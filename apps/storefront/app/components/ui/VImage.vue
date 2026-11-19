<script setup lang="ts">
/**
 * Image with a reserved aspect box (zero CLS), paper-coloured placeholder and
 * responsive srcset via Nuxt Image.
 */
const props = withDefaults(
  defineProps<{
    src: string | null | undefined
    alt: string
    ratio?: string
    sizes?: string
    priority?: boolean
    fit?: 'cover' | 'contain'
    imgClass?: string
  }>(),
  { ratio: '3/4', sizes: 'xs:100vw md:100vw lg:100vw xl:100vw 2xl:100vw', fit: 'cover' },
)
const loaded = ref(false)
</script>

<template>
  <div class="relative overflow-hidden bg-paper" :style="{ aspectRatio: ratio }">
    <NuxtImg
      v-if="src"
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      :preload="priority || undefined"
      decoding="async"
      class="absolute inset-0 size-full transition-opacity duration-700"
      :class="[fit === 'cover' ? 'object-cover' : 'object-contain', loaded || priority ? 'opacity-100' : 'opacity-0', imgClass]"
      @load="loaded = true"
    />
    <slot />
  </div>
</template>
