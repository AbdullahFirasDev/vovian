<script setup lang="ts">
interface Point { title: string; body: string; translations?: Record<string, { title?: string; body?: string }> }
defineProps<{ section: { title: string | null; body: string | null; config: { image?: { url: string; alt: string }; points?: Point[] } } }>()
const { locale } = useI18n()
const root = ref<HTMLElement | null>(null)
useReveal(root)
const pt = (p: Point, k: 'title' | 'body') => p.translations?.[locale.value]?.[k] ?? p[k]
</script>

<template>
  <section ref="root" class="shell grid-editorial items-center gap-y-12 py-24 md:py-40">
    <figure v-if="section.config.image" class="col-span-4 md:col-span-6">
      <div data-reveal class="overflow-hidden">
        <VImage :src="section.config.image.url" :alt="section.config.image.alt" ratio="4/5" sizes="xs:100vw md:50vw xl:50vw 2xl:50vw" />
      </div>
    </figure>
    <div class="col-span-4 md:col-span-5 md:col-start-8">
      <h2 class="display-lg">{{ section.title }}</h2>
      <p class="mt-6 max-w-[44ch] text-[17px] leading-relaxed">{{ section.body }}</p>
      <dl class="mt-12 divide-y divide-mist border-y border-mist">
        <div v-for="p in section.config.points ?? []" :key="p.title" class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 py-5">
          <dt class="font-display text-xl">{{ pt(p, 'title') }}</dt>
          <dd class="text-[15px] text-graphite">{{ pt(p, 'body') }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
