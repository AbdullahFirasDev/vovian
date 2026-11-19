<script setup lang="ts">
defineProps<{ section: { title: string | null; body: string | null } }>()
</script>

<template>
  <section class="bg-paper">
    <div class="shell grid-editorial items-end gap-y-10 py-20 md:py-28">
      <div class="col-span-4 md:col-span-6">
        <h2 class="display-lg">{{ section.title }}</h2>
        <p class="mt-4 max-w-[42ch] text-[15px] text-graphite">{{ section.body }}</p>
      </div>
      <div class="col-span-4 md:col-span-5 md:col-start-8">
        <NewsletterForm source="homepage" />
      </div>
    </div>
  </section>
</template>
