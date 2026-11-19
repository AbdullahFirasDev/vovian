<script setup lang="ts">
import type { ProductCard } from '@vovian/types'

interface Collection {
  slug: string
  name: string
  subtitle: string | null
  description: string | null
  cover_image_url: string | null
  hero_image_url: string | null
  products: ProductCard[]
}
defineProps<{ section: { title: string | null; collections: Collection[] | null } }>()
const localePath = useLocalePath()
const root = ref<HTMLElement | null>(null)
useReveal(root)
</script>

<template>
  <section ref="root" class="py-20 md:py-32">
    <div class="shell mb-12 md:mb-20">
      <h2 class="text-[14px] text-graphite">{{ section.title }}</h2>
    </div>

    <article
      v-for="(c, i) in section.collections ?? []"
      :key="c.slug"
      class="shell grid-editorial mb-24 items-end gap-y-8 last:mb-0 md:mb-40"
    >
      <NuxtLink
        :to="localePath(`/collections/${c.slug}`)"
        class="col-span-4 block md:col-span-7"
        :class="i % 2 === 1 ? 'md:order-2 md:col-start-6' : ''"
        :aria-label="c.name"
        tabindex="-1"
      >
        <div data-reveal class="overflow-hidden">
          <VImage :src="c.cover_image_url" :alt="c.name" ratio="4/5" sizes="xs:100vw md:58vw xl:58vw 2xl:58vw" />
        </div>
      </NuxtLink>

      <div class="col-span-4" :class="i % 2 === 1 ? 'md:order-1 md:col-start-1' : 'md:col-start-9'">
        <p class="text-[14px] text-graphite">{{ c.subtitle }}</p>
        <h3 class="mt-3 display-lg">{{ c.name }}</h3>
        <p class="mt-5 max-w-[40ch] text-[15px] leading-relaxed">{{ c.description }}</p>

        <ul v-if="c.products.length" class="mt-8 grid grid-cols-3 gap-2" :aria-label="$t('collections.preview', { name: c.name })">
          <li v-for="p in c.products" :key="p.id">
            <NuxtLink :to="localePath(`/products/${p.slug}`)" class="group block">
              <VImage :src="p.images[0]?.url" :alt="p.name" ratio="3/4" sizes="xs:33vw md:10vw" img-class="transition-transform duration-700 group-hover:scale-105" />
              <p class="mt-2 line-clamp-2 text-[12px] leading-snug">{{ p.name }}</p>
            </NuxtLink>
          </li>
        </ul>

        <NuxtLink :to="localePath(`/collections/${c.slug}`)" class="mt-8 inline-block text-[15px] link-static">
          {{ $t('collections.discover') }}
        </NuxtLink>
      </div>
    </article>
  </section>
</template>
