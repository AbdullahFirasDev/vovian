<script setup lang="ts">
defineProps<{ title: string }>()
const supabase = useSupabaseClient()
const router = useRouter()
const localePath = useLocalePath()

const links = [
  { to: '/account', label: 'account.overview', exact: true },
  { to: '/account/orders', label: 'account.orders' },
  { to: '/account/addresses', label: 'account.addresses' },
  { to: '/wishlist', label: 'account.wishlist' },
  { to: '/account/settings', label: 'account.settings' },
]
const route = useRoute()
const isActive = (l: { to: string; exact?: boolean }) => {
  const p = localePath(l.to)
  return l.exact ? route.path === p : route.path.startsWith(p)
}

async function signOut() {
  await supabase.auth.signOut()
  router.replace(localePath('/'))
}
</script>

<template>
  <div class="shell grid gap-10 pt-8 pb-24 md:pt-12 lg:grid-cols-12">
    <nav class="lg:col-span-3" :aria-label="$t('account.title')">
      <p class="text-[13px] text-graphite">{{ $t('account.title') }}</p>
      <ul class="no-scrollbar -mx-[var(--gutter)] mt-4 flex gap-6 overflow-x-auto px-[var(--gutter)] text-[15px] lg:mx-0 lg:flex-col lg:gap-3 lg:px-0">
        <li v-for="l in links" :key="l.to" class="shrink-0">
          <NuxtLink :to="localePath(l.to)" :class="isActive(l) ? 'border-b border-ink' : 'text-graphite hover:text-ink'" :aria-current="isActive(l) ? 'page' : undefined">
            {{ $t(l.label) }}
          </NuxtLink>
        </li>
        <li class="shrink-0 lg:mt-6">
          <button type="button" class="text-graphite hover:text-ink cursor-pointer" @click="signOut">{{ $t('account.signOut') }}</button>
        </li>
      </ul>
    </nav>
    <section class="lg:col-span-9">
      <h1 class="display-lg">{{ title }}</h1>
      <div class="mt-10">
        <slot />
      </div>
    </section>
  </div>
</template>
