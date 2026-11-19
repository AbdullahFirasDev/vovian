<script setup lang="ts">
const store = useStoreConfig()
const { locale } = useI18n()
const localePath = useLocalePath()
const a = computed(() => store.setting<{ enabled: boolean; text: string; href?: string; translations?: Record<string, { text?: string }> }>('announcement'))
const text = computed(() => a.value?.translations?.[locale.value]?.text ?? a.value?.text)
</script>

<template>
  <div v-if="a?.enabled && text" class="bg-ink text-white">
    <p class="shell py-2 text-center text-[13px]">
      <NuxtLink v-if="a.href" :to="localePath(a.href)" class="link-draw">{{ text }}</NuxtLink>
      <span v-else>{{ text }}</span>
    </p>
  </div>
</template>
