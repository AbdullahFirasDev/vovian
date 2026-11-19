<script setup lang="ts">
defineProps<{ title: string; body?: string; action?: { label: string; to: string } }>()
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col items-center py-20 text-center">
    <p class="display-md">{{ title }}</p>
    <p v-if="body" class="mt-4 text-graphite">{{ body }}</p>
    <slot />
    <VButton v-if="action" :to="action.to" variant="outline" class="mt-8">{{ action.label }}</VButton>
  </div>
</template>
