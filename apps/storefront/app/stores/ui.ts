import { defineStore } from 'pinia'

export interface Toast {
  id: number
  message: string
  tone: 'neutral' | 'error'
  action?: { label: string; to: string }
}

export const useUiStore = defineStore('ui', () => {
  const cartOpen = ref(false)
  const menuOpen = ref(false)
  const searchOpen = ref(false)
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function closeAll() {
    cartOpen.value = false
    menuOpen.value = false
    searchOpen.value = false
  }

  function toast(message: string, opts: { tone?: Toast['tone']; action?: Toast['action']; duration?: number } = {}) {
    const id = nextId++
    toasts.value.push({ id, message, tone: opts.tone ?? 'neutral', action: opts.action })
    setTimeout(() => dismiss(id), opts.duration ?? 4500)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { cartOpen, menuOpen, searchOpen, toasts, closeAll, toast, dismiss }
})
