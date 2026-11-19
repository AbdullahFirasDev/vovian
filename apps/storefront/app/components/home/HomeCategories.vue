<script setup lang="ts">
interface Item { label: string; href: string; image: string; translations?: Record<string, { label?: string }> }
const props = defineProps<{ section: { title: string | null; config: { items?: Item[] } } }>()
const localePath = useLocalePath()
const { tr } = useFormat()
const items = computed(() => props.section.config.items ?? [])
const active = ref(0)
</script>

<template>
  <section class="border-t border-mist py-20 md:py-32">
    <div class="shell">
      <h2 class="mb-10 text-[14px] text-graphite md:mb-16">{{ section.title }}</h2>

      <!-- Desktop: typographic index with a live preview -->
      <div class="hidden grid-cols-12 gap-[var(--gutter)] md:grid">
        <ul class="col-span-7" @mouseleave="active = active">
          <li v-for="(item, i) in items" :key="item.href" class="border-b border-mist first:border-t">
            <NuxtLink
              :to="localePath(item.href)"
              class="group flex items-baseline justify-between py-5 transition-colors duration-500"
              :class="active === i ? 'text-ink' : 'text-stone hover:text-ink'"
              @mouseenter="active = i"
              @focus="active = i"
            >
              <span class="display-lg transition-transform duration-700 ease-[var(--ease-couture)] group-hover:translate-x-3 rtl:group-hover:-translate-x-3">{{ tr(item) }}</span>
              <VIcon name="arrow-right" :size="28" class="opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </NuxtLink>
          </li>
        </ul>
        <div class="relative col-span-4 col-start-9">
          <div class="sticky top-[calc(var(--header-h)+2rem)] aspect-[4/5] overflow-hidden bg-paper">
            <NuxtImg
              v-for="(item, i) in items"
              :key="item.href"
              :src="item.image"
              :alt="''"
              sizes="md:33vw xl:33vw 2xl:33vw"
              loading="lazy"
              class="absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-couture)]"
              :class="active === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'"
            />
          </div>
        </div>
      </div>

      <!-- Mobile: swipeable tiles -->
      <ul class="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] no-scrollbar md:hidden">
        <li v-for="item in items" :key="item.href" class="w-[62vw] shrink-0 snap-start">
          <NuxtLink :to="localePath(item.href)" class="block">
            <VImage :src="item.image" :alt="tr(item)" ratio="3/4" sizes="xs:62vw" />
            <p class="mt-3 font-display text-2xl">{{ tr(item) }}</p>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
