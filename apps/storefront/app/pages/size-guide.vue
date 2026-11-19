<script setup lang="ts">
const { t } = useI18n()
usePageSeo({ title: () => t('sizeGuide.title'), description: () => t('sizeGuide.intro') })
const dept = ref<'women' | 'men'>('women')
const sections = ['apparel', 'denim', 'shoes'] as const
</script>

<template>
  <div class="shell pt-8 pb-24 md:pt-12">
    <VBreadcrumbs :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('sizeGuide.title') }]" />
    <div class="mt-8 grid-editorial items-end gap-y-4">
      <h1 class="col-span-4 display-xl md:col-span-7">{{ $t('sizeGuide.title') }}</h1>
      <p class="col-span-4 max-w-[46ch] text-[15px] text-graphite md:col-start-9">{{ $t('sizeGuide.intro') }}</p>
    </div>

    <div class="mt-12 flex gap-6 border-b border-mist" role="tablist" :aria-label="$t('sizeGuide.title')">
      <button
        v-for="d in ['women', 'men'] as const"
        :key="d"
        type="button"
        role="tab"
        :aria-selected="dept === d"
        class="-mb-px pb-3 text-[15px] cursor-pointer"
        :class="dept === d ? 'border-b border-ink' : 'text-graphite'"
        @click="dept = d"
      >
        {{ $t(`sizeGuide.${d}`) }}
      </button>
    </div>

    <div class="mt-10 grid gap-16 lg:grid-cols-2">
      <section v-for="s in sections" :key="s" :class="s === 'apparel' && 'lg:col-span-2'">
        <h2 class="mb-6 font-display text-3xl">{{ $t(`sizeGuide.${s}`) }}</h2>
        <SizeGuide :guide="s" :department="dept" />
      </section>
    </div>
  </div>
</template>
