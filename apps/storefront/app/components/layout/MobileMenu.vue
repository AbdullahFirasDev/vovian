<script setup lang="ts">
import type { MenuItem } from '@vovian/types'

const ui = useUiStore()
const store = useStoreConfig()
const user = useSupabaseUser()
const localePath = useLocalePath()
const { tr } = useFormat()

const mainMenu = computed(() => store.menu('main') as MenuItem[])
const expanded = ref<string | null>(null)
</script>

<template>
  <VDrawer v-model="ui.menuOpen" side="start" :label="$t('nav.menu')" width="26rem">
    <div class="flex h-[var(--header-h)] items-center justify-between border-b border-mist px-[var(--gutter)]">
      <span class="wordmark text-[22px]">VOVIAN</span>
      <button type="button" class="-me-2 grid size-11 place-items-center cursor-pointer" :aria-label="$t('common.close')" @click="ui.menuOpen = false">
        <VIcon name="close" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-[var(--gutter)] py-6" :aria-label="$t('nav.primary')">
      <ul>
        <li v-for="item in mainMenu" :key="item.href" class="border-b border-mist">
          <div class="flex items-center justify-between">
            <NuxtLink :to="localePath(item.href)" class="block py-4 font-display text-[32px] leading-none">{{ tr(item) }}</NuxtLink>
            <button
              v-if="item.mega === 'women' || item.mega === 'men'"
              type="button"
              class="grid size-11 place-items-center cursor-pointer"
              :aria-expanded="expanded === item.mega"
              :aria-label="$t('nav.showSubmenu', { name: tr(item) })"
              @click="expanded = expanded === item.mega ? null : item.mega ?? null"
            >
              <VIcon :name="expanded === item.mega ? 'minus' : 'plus'" />
            </button>
          </div>
          <ul v-if="expanded === item.mega && (item.mega === 'women' || item.mega === 'men')" class="grid grid-cols-2 gap-x-4 gap-y-3 pb-6 text-[16px]">
            <li v-for="c in store.categories(item.mega)" :key="c.id">
              <NuxtLink :to="localePath(`/${item.mega}/${c.slug}`)" class="block py-1">{{ c.name }}</NuxtLink>
            </li>
          </ul>
        </li>
      </ul>

      <ul class="mt-8 space-y-1 text-[16px]">
        <li><NuxtLink :to="localePath('/best-sellers')" class="block py-2">{{ $t('nav.bestSellers') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/sale')" class="block py-2">{{ $t('nav.sale') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath(user ? '/account' : '/login')" class="block py-2">{{ user ? $t('nav.account') : $t('nav.signIn') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/wishlist')" class="block py-2">{{ $t('nav.wishlist') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/track-order')" class="block py-2">{{ $t('nav.trackOrder') }}</NuxtLink></li>
        <li><NuxtLink :to="localePath('/contact')" class="block py-2">{{ $t('nav.contact') }}</NuxtLink></li>
      </ul>
    </nav>

    <div class="border-t border-mist px-[var(--gutter)] py-4">
      <LocaleSwitch class="flex -ms-2" />
    </div>
  </VDrawer>
</template>
