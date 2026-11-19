<script setup lang="ts">
interface Section {
  title: string | null
  body: string | null
  config: { images?: { url: string; alt: string }[]; link?: { label: string; href: string; translations?: Record<string, { label?: string }> } }
}
const props = defineProps<{ section: Section }>()
const localePath = useLocalePath()
const { tr } = useFormat()
const root = ref<HTMLElement | null>(null)
useReveal(root)
const [a, b] = [props.section.config.images?.[0], props.section.config.images?.[1]]
</script>

<template>
  <section ref="root" class="shell grid-editorial gap-y-12 py-24 md:py-40">
    <h2 class="col-span-4 display-xl md:col-span-7 md:row-start-1">{{ section.title }}</h2>

    <figure v-if="a" class="col-span-3 col-start-2 md:col-span-4 md:col-start-9 md:row-span-2 md:row-start-1 md:mt-24">
      <div data-reveal class="overflow-hidden">
        <VImage :src="a.url" :alt="a.alt" ratio="3/4" sizes="xs:75vw md:33vw xl:33vw 2xl:33vw" />
      </div>
    </figure>

    <div class="col-span-4 md:col-span-4 md:col-start-2 md:row-start-2 md:mt-12">
      <p class="font-display text-[1.375rem] leading-[1.45] md:text-[1.5rem]">{{ section.body }}</p>
      <NuxtLink v-if="section.config.link" :to="localePath(section.config.link.href)" class="mt-8 inline-block text-[15px] link-static">
        {{ tr(section.config.link) }}
      </NuxtLink>
    </div>

    <figure v-if="b" class="col-span-2 md:col-span-2 md:col-start-6 md:row-start-2 md:mt-56">
      <div data-reveal class="overflow-hidden">
        <VImage :src="b.url" :alt="b.alt" ratio="4/5" sizes="xs:50vw md:17vw" />
      </div>
    </figure>
  </section>
</template>
