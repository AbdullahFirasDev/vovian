<script setup lang="ts">
const model = defineModel<boolean>({ default: false })
defineProps<{ label: string; name?: string; description?: string }>()
const id = useId()
</script>

<template>
  <label :for="id" class="flex cursor-pointer items-start gap-3 py-1 text-[15px]">
    <span class="relative mt-0.5 grid size-[18px] shrink-0 place-items-center border transition-colors" :class="model ? 'border-ink bg-ink' : 'border-stone bg-white'">
      <input :id="id" v-model="model" type="checkbox" :name="name" class="peer absolute inset-0 cursor-pointer opacity-0">
      <VIcon v-if="model" name="check" :size="14" class="text-white" />
      <span class="pointer-events-none absolute -inset-1 hidden outline-2 outline-ink peer-focus-visible:block" />
    </span>
    <span>
      <span class="block">{{ label }}</span>
      <span v-if="description" class="block text-[13px] text-graphite">{{ description }}</span>
    </span>
  </label>
</template>
