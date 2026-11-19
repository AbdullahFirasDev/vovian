<script setup lang="ts">
import type { MenuItem } from '@vovian/types'

const props = defineProps<{ open: string | null; menu: MenuItem[] }>()
defineEmits<{ close: [] }>()

const store = useStoreConfig()
const localePath = useLocalePath()

const item = computed(() => props.menu.find((m) => m.mega === props.open))
const categories = computed(() => (props.open === 'women' || props.open === 'men' ? store.categories(props.open) : []))
const collections = computed(() => store.config.value?.collections ?? [])
</script>

<template>
  <Transition
    enter-active-class="transition-[clip-path,opacity] duration-[550ms] ease-[var(--ease-couture)]"
    leave-active-class="transition-[clip-path,opacity] duration-300 ease-[var(--ease-curtain)]"
    enter-from-class="[clip-path:inset(0_0_100%_0)] opacity-0"
    leave-to-class="[clip-path:inset(0_0_100%_0)] opacity-0"
  >
    <div v-if="item" :id="`mega-${open}`" class="absolute inset-x-0 top-full border-b border-mist bg-white text-ink">
      <!-- Department mega menu -->
      <div v-if="open === 'women' || open === 'men'" class="shell grid-editorial py-10">
        <div class="col-span-3">
          <p class="mb-5 text-[13px] text-graphite">{{ $t('nav.categories') }}</p>
          <ul class="columns-2 gap-8 space-y-3 text-[15px]">
            <li v-for="c in categories" :key="c.id" class="break-inside-avoid">
              <NuxtLink :to="localePath(`/${open}/${c.slug}`)" class="link-draw">{{ c.name }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div class="col-span-3 col-start-5">
          <p class="mb-5 text-[13px] text-graphite">{{ $t('nav.edit') }}</p>
          <ul class="space-y-3">
            <li><NuxtLink :to="localePath(`/${open}`)" class="font-display text-2xl link-draw">{{ $t('nav.shopAll', { dept: $t(`departments.${open}`) }) }}</NuxtLink></li>
            <li><NuxtLink :to="localePath({ path: '/new-arrivals', query: { dept: open } })" class="font-display text-2xl link-draw">{{ $t('nav.newArrivals') }}</NuxtLink></li>
            <li><NuxtLink :to="localePath({ path: '/best-sellers', query: { dept: open } })" class="font-display text-2xl link-draw">{{ $t('nav.bestSellers') }}</NuxtLink></li>
            <li><NuxtLink :to="localePath({ path: '/sale', query: { dept: open } })" class="font-display text-2xl link-draw">{{ $t('nav.sale') }}</NuxtLink></li>
          </ul>
        </div>
        <NuxtLink v-if="item.image" :to="localePath(item.image_href ?? item.href)" class="group col-span-4 col-start-9 grid grid-cols-[1fr_auto] items-end gap-6">
          <VImage :src="item.image" :alt="item.image_caption ?? ''" ratio="4/5" sizes="lg:25vw" img-class="transition-transform duration-[1.2s] ease-[var(--ease-couture)] group-hover:scale-[1.03]" />
          <span class="max-w-32 pb-1 text-[13px] text-graphite [writing-mode:vertical-rl] rotate-180">{{ item.image_caption }}</span>
        </NuxtLink>
      </div>

      <!-- Collections mega menu -->
      <div v-else-if="open === 'collections'" class="shell grid grid-cols-4 gap-[var(--gutter)] py-10">
        <NuxtLink
          v-for="c in collections.slice(0, 4)"
          :key="c.slug"
          :to="localePath(`/collections/${c.slug}`)"
          class="group block"
        >
          <VImage :src="c.cover_image_url" :alt="c.name" ratio="4/5" sizes="lg:22vw" img-class="transition-transform duration-[1.2s] ease-[var(--ease-couture)] group-hover:scale-[1.03]" />
          <p class="mt-3 font-display text-xl">{{ c.name }}</p>
        </NuxtLink>
      </div>
    </div>
  </Transition>
</template>
