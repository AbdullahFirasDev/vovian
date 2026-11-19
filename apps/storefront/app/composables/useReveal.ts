/**
 * Scroll-triggered image reveal for editorial photography only (never product
 * grids). A curtain opens upward once as the image enters the viewport.
 * Elements opt in with `data-reveal`.
 */
export function useReveal(scope: Ref<HTMLElement | null>) {
  useGsap(({ gsap }) => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      const img = el.querySelector('img')
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
      if (img) {
        gsap.fromTo(img, { scale: 1.15 }, {
          scale: 1,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      }
    })
  }, scope)
}
