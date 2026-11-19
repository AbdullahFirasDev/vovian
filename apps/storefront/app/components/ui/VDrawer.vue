<script setup lang="ts">
/** Side drawer (start/end) with focus trap, scrim and curtain motion. Mirrors in RTL. */
const open = defineModel<boolean>({ required: true })
const props = withDefaults(defineProps<{ side?: 'start' | 'end'; label: string; width?: string }>(), { side: 'end', width: '28rem' })

const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, open, () => (open.value = false))

const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-500 ease-[var(--ease-couture)]"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[60] bg-ink/40" aria-hidden="true" @click="open = false" />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-[600ms] ease-[var(--ease-couture)]"
      leave-active-class="transition-transform duration-[350ms] ease-[var(--ease-curtain)]"
      :enter-from-class="props.side === 'end' ? 'translate-x-full rtl:-translate-x-full' : '-translate-x-full rtl:translate-x-full'"
      :leave-to-class="props.side === 'end' ? 'translate-x-full rtl:-translate-x-full' : '-translate-x-full rtl:translate-x-full'"
    >
      <aside
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        class="fixed inset-y-0 z-[61] flex w-full flex-col bg-white"
        :class="props.side === 'end' ? 'end-0' : 'start-0'"
        :style="{ maxWidth: props.width }"
      >
        <slot :close="() => (open = false)" />
      </aside>
    </Transition>
  </Teleport>
</template>
