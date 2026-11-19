<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 })
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-[var(--gutter)] gap-y-10 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
    <li v-for="i in count" :key="i">
      <div class="skeleton aspect-[3/4]" />
      <div class="skeleton mt-3 h-4 w-3/4" />
      <div class="skeleton mt-2 h-4 w-1/4" />
    </li>
  </ul>
</template>
