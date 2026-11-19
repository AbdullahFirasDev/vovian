<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const other = computed(() => (locales.value as { code: string; name: string }[]).find((l) => l.code !== locale.value))
</script>

<template>
  <NuxtLink
    v-if="other"
    :to="switchLocalePath(other.code as 'en' | 'ar')"
    class="items-center px-2 text-[14px] h-11"
    :hreflang="other.code"
    :lang="other.code"
    :aria-label="$t('nav.switchLanguage', { language: other.name })"
  >
    <span class="link-draw">{{ other.code === 'ar' ? 'العربية' : 'English' }}</span>
  </NuxtLink>
</template>
