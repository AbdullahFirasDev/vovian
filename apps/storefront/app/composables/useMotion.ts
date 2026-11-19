import type { gsap as GsapType } from 'gsap'

let gsapPromise: Promise<{ gsap: typeof GsapType; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger }> | null = null

/** Lazily loads GSAP + ScrollTrigger on the client only. */
export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, st]) => {
      g.gsap.registerPlugin(st.ScrollTrigger)
      return { gsap: g.gsap, ScrollTrigger: st.ScrollTrigger }
    })
  }
  return gsapPromise
}

export function prefersReducedMotion(): boolean {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs a GSAP timeline inside a scoped context that is reverted on unmount.
 * Skipped entirely when the visitor prefers reduced motion — elements must be
 * styled so their resting (final) state is the default.
 */
export function useGsap(setup: (ctx: { gsap: typeof GsapType; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger }) => void, scope?: Ref<HTMLElement | null>) {
  let context: gsap.Context | null = null
  onMounted(async () => {
    if (prefersReducedMotion()) return
    const libs = await loadGsap()
    context = libs.gsap.context(() => setup(libs), scope?.value ?? undefined)
  })
  onBeforeUnmount(() => context?.revert())
}
