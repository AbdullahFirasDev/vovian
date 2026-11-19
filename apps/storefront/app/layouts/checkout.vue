<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <header class="border-b border-mist">
      <div class="shell flex h-[var(--header-h)] items-center justify-between">
        <NuxtLink :to="localePath('/cart')" class="flex items-center gap-2 text-[14px]">
          <VIcon name="arrow-left" :size="18" />
          <span class="hidden sm:inline">{{ $t('checkout.backToBag') }}</span>
        </NuxtLink>
        <NuxtLink :to="localePath('/')" class="wordmark text-[22px] md:text-[26px]">VOVIAN</NuxtLink>
        <p class="flex items-center gap-2 text-[13px] text-graphite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          <span class="hidden sm:inline">{{ $t('checkout.secure') }}</span>
        </p>
      </div>
    </header>
    <main id="main" class="flex-1">
      <slot />
    </main>
    <ToastStack />
  </div>
</template>
