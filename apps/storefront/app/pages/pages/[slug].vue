<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))
</script>

<template>
  <ContentPage :key="slug" :slug="slug" />
</template>
