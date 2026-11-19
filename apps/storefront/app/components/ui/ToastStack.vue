<script setup lang="ts">
const ui = useUiStore()
const localePath = useLocalePath()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite" role="status">
    <TransitionGroup
      enter-active-class="transition duration-500 ease-[var(--ease-couture)]"
      leave-active-class="transition duration-200"
      enter-from-class="translate-y-3 opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 px-5 py-4 text-[14px] text-white"
        :class="t.tone === 'error' ? 'bg-error' : 'bg-ink'"
      >
        <span>{{ t.message }}</span>
        <span class="flex shrink-0 items-center gap-3">
          <NuxtLink v-if="t.action" :to="localePath(t.action.to)" class="link-static" @click="ui.dismiss(t.id)">{{ t.action.label }}</NuxtLink>
          <button type="button" class="grid size-8 place-items-center cursor-pointer" :aria-label="$t('common.dismiss')" @click="ui.dismiss(t.id)">
            <VIcon name="close" :size="16" />
          </button>
        </span>
      </div>
    </TransitionGroup>
  </div>
</template>
