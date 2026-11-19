<script setup lang="ts">
const route = useRoute()
const store = useStoreConfig()
const overlay = computed(() => route.meta.headerOverlay === true)
const maintenance = computed(() => store.setting<{ enabled: boolean; message: string }>('maintenance'))
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[90] focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
      {{ $t('common.skipToContent') }}
    </a>
    <div v-if="maintenance?.enabled" class="bg-paper py-2 text-center text-[13px]">{{ maintenance.message }}</div>
    <AnnouncementBar v-if="!overlay" />
    <AppHeader :overlay="overlay" />
    <main id="main" class="flex-1" tabindex="-1">
      <slot />
    </main>
    <AppFooter />
    <MobileMenu />
    <SearchOverlay />
    <CartDrawer />
    <ToastStack />
  </div>
</template>
