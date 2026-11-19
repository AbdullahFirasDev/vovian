<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'solid' | 'outline' | 'ghost' | 'inverse'
    size?: 'md' | 'lg' | 'sm'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'solid', size: 'md', type: 'button' },
)

const localePath = useLocalePath()

const classes = computed(() => [
  'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap font-medium tracking-[0.01em]',
  'transition-[background-color,color,border-color,opacity] duration-300 ease-[var(--ease-couture)]',
  'disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer',
  {
    sm: 'h-10 px-4 text-[13px]',
    md: 'h-12 px-6 text-[14px]',
    lg: 'h-14 px-8 text-[15px]',
  }[props.size],
  {
    solid: 'bg-ink text-white hover:bg-night/85 border border-ink',
    outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-white',
    ghost: 'bg-transparent text-ink border border-transparent hover:border-mist px-3',
    inverse: 'bg-white text-ink border border-white hover:bg-transparent hover:text-white',
  }[props.variant],
  props.block && 'w-full',
])

const target = computed(() => (props.to ? localePath(props.to as string) : undefined))
</script>

<template>
  <NuxtLink v-if="target" :to="target" :class="classes"><slot /></NuxtLink>
  <a v-else-if="href" :href="href" :class="classes"><slot /></a>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <span :class="loading && 'invisible'" class="inline-flex items-center gap-2"><slot /></span>
    <span v-if="loading" class="absolute inset-0 grid place-items-center">
      <span class="size-4 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />
    </span>
  </button>
</template>
