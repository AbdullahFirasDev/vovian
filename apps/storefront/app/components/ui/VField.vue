<script setup lang="ts">
/**
 * Labelled text input / textarea / select with inline error + hint.
 * Labels are always visible (never placeholder-only).
 */
const model = defineModel<string | number | null | undefined>()
const props = withDefaults(
  defineProps<{
    label: string
    name: string
    type?: string
    as?: 'input' | 'textarea' | 'select'
    error?: string | null
    hint?: string
    autocomplete?: string
    required?: boolean
    inputmode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search'
    rows?: number
    options?: { value: string; label: string }[]
    dir?: 'ltr' | 'rtl' | 'auto'
    maxlength?: number
  }>(),
  { type: 'text', as: 'input', rows: 4 },
)

const id = useId()
const describedBy = computed(() => [props.error && `${id}-error`, props.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined)
const base =
  'w-full bg-transparent border-0 border-b px-0 py-3 text-[16px] text-ink outline-none transition-colors duration-200 placeholder:text-stone focus:border-ink rounded-none'
</script>

<template>
  <div class="group">
    <label :for="id" class="block text-[13px] text-graphite">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <textarea
      v-if="as === 'textarea'"
      :id="id"
      v-model="model as string"
      :name="name"
      :rows="rows"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="!!error || undefined"
      :aria-describedby="describedBy"
      :class="[base, 'resize-y', error ? 'border-error' : 'border-mist hover:border-stone']"
    />
    <div v-else-if="as === 'select'" class="relative">
      <select
        :id="id"
        v-model="model"
        :name="name"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="!!error || undefined"
        :aria-describedby="describedBy"
        :class="[base, 'appearance-none pe-8 cursor-pointer', error ? 'border-error' : 'border-mist hover:border-stone']"
      >
        <slot />
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <VIcon name="chevron-down" :size="18" class="pointer-events-none absolute end-0 top-1/2 -translate-y-1/2 text-graphite" />
    </div>
    <input
      v-else
      :id="id"
      v-model="model"
      :name="name"
      :type="type"
      :required="required"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :dir="dir"
      :aria-invalid="!!error || undefined"
      :aria-describedby="describedBy"
      :class="[base, error ? 'border-error' : 'border-mist hover:border-stone']"
    >
    <p v-if="hint && !error" :id="`${id}-hint`" class="mt-1.5 text-[13px] text-graphite">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-[13px] text-error" role="alert">{{ error }}</p>
  </div>
</template>
