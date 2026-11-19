<script setup lang="ts">
interface Banner {
  title: string
  subtitle: string | null
  image_url: string | null
  image_url_secondary: string | null
  cta_label: string | null
  cta_href: string | null
  cta_secondary_label: string | null
  cta_secondary_href: string | null
}
const props = defineProps<{ banner: Banner | null }>()
const localePath = useLocalePath()
const root = ref<HTMLElement | null>(null)

const halves = computed(() => [
  { key: 'women', image: props.banner?.image_url, label: props.banner?.cta_label, href: props.banner?.cta_href ?? '/women' },
  { key: 'men', image: props.banner?.image_url_secondary, label: props.banner?.cta_secondary_label, href: props.banner?.cta_secondary_href ?? '/men' },
])
const letters = 'VOVIAN'.split('')

// One orchestrated entrance: photographs open like curtains, the wordmark
// rises letter by letter, then the copy settles. Nothing else on the page
// animates without being asked to.
useGsap(({ gsap, ScrollTrigger }) => {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.fromTo('[data-hero-half]', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, stagger: 0.14 })
    .fromTo('[data-hero-img]', { scale: 1.18 }, { scale: 1, duration: 2.2, stagger: 0.14 }, 0)
    .fromTo('[data-hero-letter]', { yPercent: 105 }, { yPercent: 0, duration: 1.3, stagger: 0.07 }, 0.45)
    .fromTo('[data-hero-copy]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 1.05)
  document.documentElement.classList.add('hero-played')

  // Gentle depth as the visitor scrolls away
  gsap.to('[data-hero-img]', {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true },
  })
  ScrollTrigger.refresh()
}, root)
</script>

<template>
  <section ref="root" class="hero relative h-[100svh] min-h-[560px] overflow-hidden bg-ink text-white" :aria-label="banner?.title ?? 'VOVIAN'">
    <div class="absolute inset-0 grid grid-cols-2">
      <NuxtLink
        v-for="(half, i) in halves"
        :key="half.key"
        :to="localePath(half.href)"
        data-hero-half
        class="group relative block overflow-hidden"
        :class="i === 0 ? 'border-e border-white/10' : ''"
      >
        <NuxtImg
          v-if="half.image"
          data-hero-img
          :src="half.image"
          :alt="''"
          sizes="xs:50vw md:50vw lg:50vw xl:50vw 2xl:50vw"
          preload
          loading="eager"
          fetchpriority="high"
          class="absolute inset-0 size-full object-cover transition-[filter] duration-700 group-hover:brightness-90"
        />
        <span class="absolute inset-0 bg-gradient-to-b from-ink/35 via-transparent to-ink/45" aria-hidden="true" />
        <!-- Destination -->
        <span data-hero-copy class="absolute bottom-[calc(18vw+1.5rem)] start-[var(--gutter)] z-10 flex flex-col gap-2 md:bottom-[calc(16vw+2rem)]">
          <span class="font-display text-[clamp(1.75rem,3.2vw,3rem)] leading-none">{{ $t(`departments.${half.key}`) }}</span>
          <span class="link-draw w-fit text-[14px] md:text-[15px]">{{ half.label ?? $t(`nav.shop${half.key === 'women' ? 'Women' : 'Men'}`) }}</span>
        </span>
      </NuxtLink>
    </div>

    <!-- Season -->
    <div data-hero-copy class="pointer-events-none absolute start-[var(--gutter)] top-[calc(var(--header-h)+2rem)] z-10 max-w-[22ch] md:top-[calc(var(--header-h)+3rem)]">
      <h1 class="text-[13px] tracking-[0.02em] md:text-[14px]">{{ banner?.title }}</h1>
      <p v-if="banner?.subtitle" class="mt-2 font-display text-[clamp(1.25rem,2.2vw,2rem)] italic leading-tight">{{ banner.subtitle }}</p>
    </div>

    <!-- Scroll indicator -->
    <div data-hero-copy class="absolute end-[var(--gutter)] top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex" aria-hidden="true">
      <span class="relative block h-20 w-px overflow-hidden bg-white/30">
        <span class="scroll-tick absolute inset-x-0 top-0 h-6 bg-white" />
      </span>
    </div>

    <!-- Wordmark -->
    <p class="pointer-events-none absolute inset-x-0 bottom-0 z-20 overflow-hidden text-center mix-blend-difference" aria-hidden="true">
      <span class="wordmark inline-flex translate-y-[0.12em] leading-[0.8] text-white" style="font-size: 22.5vw; letter-spacing: -0.02em">
        <span v-for="(l, i) in letters" :key="i" class="inline-block overflow-hidden"><span data-hero-letter class="inline-block">{{ l }}</span></span>
      </span>
    </p>
  </section>
</template>

<style scoped>
@keyframes tick {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(340%); }
}
.scroll-tick { animation: tick 2.4s cubic-bezier(0.77, 0, 0.175, 1) infinite; }

/* Pre-hydration state for the entrance (only when motion is welcome). If the
   timeline never runs, a CSS fallback reveals everything after 2.5s. */
:global(html.motion-ok:not(.hero-played)) .hero [data-hero-half] { clip-path: inset(100% 0 0 0); animation: hero-fallback 0s 2.5s forwards; }
:global(html.motion-ok:not(.hero-played)) .hero [data-hero-letter] { transform: translateY(105%); animation: hero-fallback-y 0s 2.5s forwards; }
:global(html.motion-ok:not(.hero-played)) .hero [data-hero-copy] { opacity: 0; animation: hero-fallback-o 0s 2.5s forwards; }
@keyframes hero-fallback { to { clip-path: inset(0); } }
@keyframes hero-fallback-y { to { transform: none; } }
@keyframes hero-fallback-o { to { opacity: 1; } }
</style>
