<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const localePath = useLocalePath()
const notFound = computed(() => props.error.statusCode === 404)
useHead({ title: () => (notFound.value ? '404' : 'Error') })
</script>

<template>
  <NuxtLayout>
    <section class="shell grid-editorial min-h-[70svh] content-center gap-y-8 py-24">
      <p class="col-span-4 font-display text-[clamp(6rem,22vw,18rem)] leading-[0.8] text-mist md:col-span-6" aria-hidden="true">{{ error.statusCode }}</p>
      <div class="col-span-4 self-end md:col-span-5 md:col-start-8">
        <h1 class="display-md">{{ notFound ? $t('errors.notFoundTitle') : $t('errors.serverTitle') }}</h1>
        <p class="mt-4 text-graphite">{{ notFound ? $t('errors.notFoundBody') : $t('errors.serverBody') }}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <VButton :to="localePath('/')" @click="clearError({ redirect: localePath('/') })">{{ $t('errors.backHome') }}</VButton>
          <VButton variant="outline" :to="localePath('/new-arrivals')">{{ $t('nav.newArrivals') }}</VButton>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
