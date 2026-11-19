<script setup lang="ts">
const open = defineModel<boolean>({ required: true })
const props = withDefaults(defineProps<{ title: string; size?: 'md' | 'lg' | 'full' }>(), { size: 'md' })
const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, open, () => (open.value = false))
const titleId = useId()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-400"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[70] grid place-items-end bg-ink/50 sm:place-items-center sm:p-6" @click.self="open = false">
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="flex max-h-[92svh] w-full flex-col bg-white"
          :class="{ md: 'sm:max-w-xl', lg: 'sm:max-w-4xl', full: 'h-full max-h-none sm:max-w-none' }[props.size]"
        >
          <header class="flex items-center justify-between border-b border-mist px-6 py-4">
            <h2 :id="titleId" class="font-display text-2xl">{{ title }}</h2>
            <button type="button" class="-me-2 grid size-11 place-items-center" :aria-label="$t('common.close')" @click="open = false">
              <VIcon name="close" />
            </button>
          </header>
          <div class="overflow-y-auto px-6 py-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
