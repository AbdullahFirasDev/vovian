<script setup lang="ts">
defineProps<{ title: string; intro?: string }>()
</script>

<template>
  <div class="grid min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2">
    <div class="relative hidden overflow-hidden bg-ink lg:block">
      <NuxtImg
        src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?sat=-100"
        alt=""
        sizes="lg:50vw xl:50vw 2xl:50vw"
        class="absolute inset-0 size-full object-cover opacity-90"
      />
      <p class="wordmark absolute bottom-8 start-8 text-[64px] leading-none text-white" aria-hidden="true">VOVIAN</p>
    </div>
    <div class="flex items-center justify-center px-[var(--gutter)] py-16">
      <div class="w-full max-w-md">
        <h1 class="display-lg">{{ title }}</h1>
        <p v-if="intro" class="mt-4 text-[15px] text-graphite">{{ intro }}</p>
        <div class="mt-10">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
