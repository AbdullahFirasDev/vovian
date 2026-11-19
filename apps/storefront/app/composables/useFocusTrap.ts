const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps focus inside `el` while `active`, restores focus to the trigger on
 * close, closes on Escape, and locks page scroll.
 */
export function useFocusTrap(el: Ref<HTMLElement | null>, active: Ref<boolean>, onEscape: () => void) {
  let previouslyFocused: HTMLElement | null = null

  function onKeydown(e: KeyboardEvent) {
    if (!active.value || !el.value) return
    if (e.key === 'Escape') {
      e.stopPropagation()
      onEscape()
      return
    }
    if (e.key !== 'Tab') return
    const nodes = Array.from(el.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(active, async (open) => {
    if (!import.meta.client) return
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.documentElement.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      const target = el.value?.querySelector<HTMLElement>('[data-autofocus]') ?? el.value?.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus({ preventScroll: true })
    } else {
      document.documentElement.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    document.removeEventListener('keydown', onKeydown)
    document.documentElement.style.overflow = ''
  })
}
