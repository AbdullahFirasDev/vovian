<script setup lang="ts">
import type { MenuItem } from '@vovian/types'

const props = defineProps<{ overlay?: boolean }>()

const ui = useUiStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const store = useStoreConfig()
const user = useSupabaseUser()
const localePath = useLocalePath()
const { tr } = useFormat()

const mainMenu = computed(() => store.menu('main') as MenuItem[])
const openMega = ref<string | null>(null)
const scrolled = ref(false)
const mounted = ref(false)

let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

function hoverOpen(key?: string) {
  clearTimeout(closeTimer)
  clearTimeout(openTimer)
  if (!key) {
    closeTimer = setTimeout(() => (openMega.value = null), 120)
    return
  }
  openTimer = setTimeout(() => (openMega.value = key), openMega.value ? 0 : 90)
}
function scheduleClose() {
  clearTimeout(openTimer)
  closeTimer = setTimeout(() => (openMega.value = null), 160)
}
function toggleMega(key: string) {
  openMega.value = openMega.value === key ? null : key
}

const solid = computed(() => !props.overlay || scrolled.value || !!openMega.value || ui.searchOpen)

function onScroll() {
  scrolled.value = window.scrollY > 40
}
onMounted(() => {
  mounted.value = true
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const route = useRoute()
watch(() => route.fullPath, () => (openMega.value = null))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') openMega.value = null
}
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-colors duration-500 ease-[var(--ease-couture)]"
    :class="[solid ? 'bg-white text-ink' : 'bg-transparent text-white', solid && 'border-b border-mist', overlay && '-mb-[var(--header-h)]']"
    @mouseleave="scheduleClose"
    @keydown="onKeydown"
  >
    <div class="shell grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center">
      <!-- Start: navigation -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="-ms-2 grid size-11 place-items-center lg:hidden cursor-pointer"
          :aria-label="$t('nav.openMenu')"
          :aria-expanded="ui.menuOpen"
          @click="ui.menuOpen = true"
        >
          <VIcon name="menu" />
        </button>
        <button
          type="button"
          class="grid size-11 place-items-center lg:hidden cursor-pointer"
          :aria-label="$t('search.open')"
          @click="ui.searchOpen = true"
        >
          <VIcon name="search" />
        </button>
        <nav class="hidden lg:block" :aria-label="$t('nav.primary')">
          <ul class="flex items-center gap-7 text-[15px]">
            <li v-for="item in mainMenu" :key="item.href" @mouseenter="hoverOpen(item.mega)">
              <div class="flex items-center">
                <NuxtLink
                  :to="localePath(item.href)"
                  class="link-draw py-2"
                  :class="openMega === item.mega && 'bg-[length:100%_1px]'"
                >
                  {{ tr(item) }}
                </NuxtLink>
                <button
                  v-if="item.mega"
                  type="button"
                  class="ms-0.5 grid size-6 place-items-center opacity-60 focus-visible:opacity-100 cursor-pointer"
                  :aria-expanded="openMega === item.mega"
                  :aria-controls="`mega-${item.mega}`"
                  :aria-label="$t('nav.showSubmenu', { name: tr(item) })"
                  @click="toggleMega(item.mega)"
                >
                  <VIcon name="chevron-down" :size="14" />
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>

      <!-- Centre: wordmark -->
      <NuxtLink :to="localePath('/')" class="wordmark text-[22px] leading-none md:text-[26px]" :aria-label="$t('nav.home')">
        VOVIAN
      </NuxtLink>

      <!-- End: utilities -->
      <div class="flex items-center justify-end gap-0.5">
        <button
          type="button"
          class="hidden size-11 place-items-center lg:grid cursor-pointer"
          :aria-label="$t('search.open')"
          @click="ui.searchOpen = true"
        >
          <VIcon name="search" />
        </button>
        <LocaleSwitch class="hidden md:flex" />
        <NuxtLink
          :to="localePath(mounted && user ? '/account' : '/login')"
          class="hidden size-11 place-items-center sm:grid"
          :aria-label="mounted && user ? $t('nav.account') : $t('nav.signIn')"
        >
          <VIcon name="user" />
        </NuxtLink>
        <NuxtLink :to="localePath('/wishlist')" class="relative grid size-11 place-items-center" :aria-label="$t('nav.wishlistCount', { n: mounted ? wishlist.count : 0 })">
          <VIcon name="heart" />
          <ClientOnly>
            <span v-if="wishlist.count" class="absolute end-1.5 top-2 size-1.5 rounded-full bg-current" aria-hidden="true" />
          </ClientOnly>
        </NuxtLink>
        <button
          type="button"
          class="relative -me-2 grid size-11 place-items-center cursor-pointer"
          :aria-label="$t('nav.bagCount', { n: mounted ? cart.count : 0 })"
          @click="ui.cartOpen = true"
        >
          <VIcon name="bag" />
          <ClientOnly>
            <span v-if="cart.count" class="absolute bottom-1.5 end-1 min-w-4 text-center text-[10px] font-semibold leading-4 tabular-nums">{{ cart.count }}</span>
          </ClientOnly>
        </button>
      </div>
    </div>

    <MegaMenu :open="openMega" :menu="mainMenu" @mouseenter="hoverOpen(openMega ?? undefined)" @close="openMega = null" />
  </header>
</template>
