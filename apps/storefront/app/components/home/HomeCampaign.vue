<script setup lang="ts">
interface Banner {
  title: string
  subtitle: string | null
  body: string | null
  image_url: string | null
  image_url_secondary: string | null
  cta_label: string | null
  cta_href: string | null
}
const props = defineProps<{ banner: Banner | null; interactive?: boolean }>()

// The WebGL lens only loads on devices that can hover and welcome motion.
const canInteract = ref(false)
onMounted(() => {
  canInteract.value = !!props.interactive && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion()
})
</script>

<template>
  <section v-if="banner" class="relative min-h-[100svh] overflow-hidden bg-night text-white" :aria-label="banner.title">
    <NuxtImg
      v-if="banner.image_url"
      :src="banner.image_url"
      :alt="''"
      sizes="xs:100vw md:100vw lg:100vw xl:100vw 2xl:100vw"
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
    />
    <LazyCampaignCanvas
      v-if="canInteract && banner.image_url_secondary"
      hydrate-on-visible
      :src="banner.image_url_secondary"
      class="absolute inset-0"
    />
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-transparent" aria-hidden="true" />

    <div class="pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-end">
      <div class="shell grid-editorial items-end gap-y-6 pb-12 md:pb-16">
        <div class="col-span-4 md:col-span-8">
          <p class="text-[14px] text-white/80">{{ banner.subtitle }}</p>
          <h2 class="mt-3 font-display italic leading-[0.85]" style="font-size: clamp(5rem, 17vw, 16rem); letter-spacing: -0.03em">{{ banner.title }}</h2>
        </div>
        <div class="pointer-events-auto col-span-4 md:col-span-4 md:col-start-9">
          <p class="max-w-[40ch] text-[15px] leading-relaxed text-white/90">{{ banner.body }}</p>
          <VButton v-if="banner.cta_href" :to="banner.cta_href" variant="inverse" class="mt-6">{{ banner.cta_label }}</VButton>
          <p v-if="canInteract" class="mt-4 text-[12px] text-white/60">{{ $t('home.campaignHint') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
