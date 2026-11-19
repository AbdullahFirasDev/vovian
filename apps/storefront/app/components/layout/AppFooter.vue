<script setup lang="ts">
import type { MenuItem } from '@vovian/types'

const store = useStoreConfig()
const localePath = useLocalePath()
const { tr } = useFormat()

const columns = computed(() => [
  { title: 'footer.shop', items: store.menu('footer-shop') as MenuItem[] },
  { title: 'footer.clientCare', items: store.menu('footer-help') as MenuItem[] },
  { title: 'footer.company', items: store.menu('footer-company') as MenuItem[] },
])
const { locale } = useI18n()
type StoreInfo = { email: string; phone: string; address: string; hours: string; legal_name: string; translations?: Record<string, Partial<Record<'address' | 'hours' | 'legal_name', string>>> }
const info = computed(() => {
  const s = store.setting<StoreInfo>('store')
  return s ? { ...s, ...(s.translations?.[locale.value] ?? {}) } : undefined
})
const social = computed(() => Object.entries(store.setting<Record<string, string>>('social') ?? {}))
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-ink text-white">
    <div class="shell grid-editorial gap-y-12 pt-20 pb-12">
      <nav v-for="col in columns" :key="col.title" class="col-span-2 md:col-span-3" :aria-label="$t(col.title)">
        <p class="mb-5 text-[13px] text-white/60">{{ $t(col.title) }}</p>
        <ul class="space-y-2.5 text-[15px]">
          <li v-for="item in col.items" :key="item.href">
            <NuxtLink :to="localePath(item.href)" class="link-draw">{{ tr(item) }}</NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="col-span-4 md:col-span-3">
        <p class="mb-5 text-[13px] text-white/60">{{ $t('footer.visit') }}</p>
        <address class="space-y-2.5 text-[15px] not-italic">
          <p>{{ info?.address }}</p>
          <p class="text-white/60">{{ info?.hours }}</p>
          <p><a :href="`mailto:${info?.email}`" class="link-draw">{{ info?.email }}</a></p>
          <p><a :href="`tel:${info?.phone?.replace(/\s/g, '')}`" class="link-draw" dir="ltr">{{ info?.phone }}</a></p>
        </address>
        <ul v-if="social.length" class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
          <li v-for="[name, url] in social" :key="name">
            <a :href="url" target="_blank" rel="noopener noreferrer" class="capitalize link-draw">{{ name }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="shell flex flex-wrap items-center justify-between gap-4 border-t border-white/15 py-6 text-[13px] text-white/60">
      <p>© {{ year }} {{ info?.legal_name ?? 'VOVIAN' }}</p>
      <div class="flex items-center gap-4">
        <span>{{ $t('footer.payments') }}</span>
        <LocaleSwitch class="flex text-white" />
      </div>
    </div>

    <!-- Closing wordmark echoes the hero -->
    <div class="overflow-hidden" aria-hidden="true">
      <p class="wordmark -mb-[0.2em] select-none text-center leading-[0.8] text-white" style="font-size: 22.5vw; letter-spacing: -0.02em">VOVIAN</p>
    </div>
  </footer>
</template>
