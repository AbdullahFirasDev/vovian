<script setup lang="ts">
const model = defineModel<number>({ required: true })
const props = withDefaults(defineProps<{ min?: number; max?: number; label: string; size?: 'sm' | 'md' }>(), { min: 1, max: 20, size: 'md' })
const h = computed(() => (props.size === 'sm' ? 'h-9' : 'h-12'))
</script>

<template>
  <div class="inline-flex items-stretch border border-mist" :class="h" role="group" :aria-label="label">
    <button
      type="button"
      class="grid w-10 place-items-center disabled:opacity-30 cursor-pointer"
      :disabled="model <= props.min"
      :aria-label="$t('cart.decrease')"
      @click="model = Math.max(props.min, model - 1)"
    >
      <VIcon name="minus" :size="16" />
    </button>
    <output class="grid min-w-8 place-items-center text-[15px] tabular-nums" aria-live="polite">{{ model }}</output>
    <button
      type="button"
      class="grid w-10 place-items-center disabled:opacity-30 cursor-pointer"
      :disabled="model >= props.max"
      :aria-label="$t('cart.increase')"
      @click="model = Math.min(props.max, model + 1)"
    >
      <VIcon name="plus" :size="16" />
    </button>
  </div>
</template>
