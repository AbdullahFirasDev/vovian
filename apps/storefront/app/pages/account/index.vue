<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const store = useStoreConfig()
const user = useSupabaseUser()
const localePath = useLocalePath()
const { t } = useI18n()
usePageSeo({ title: () => t('account.title'), noindex: true })

const uid = computed(() => user.value?.sub as string)
const { data } = await useAsyncData('account-overview', async () => {
  const [profile, orders, address] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', uid.value).maybeSingle(),
    supabase.from('orders').select('order_number, status, total, currency, created_at').eq('user_id', uid.value).order('created_at', { ascending: false }).limit(3),
    supabase.from('addresses').select('*').eq('user_id', uid.value).eq('is_default', true).maybeSingle(),
  ])
  return { profile: profile.data, orders: orders.data ?? [], address: address.data }
})
const firstName = computed(() => data.value?.profile?.full_name?.split(' ')[0] ?? '')
</script>

<template>
  <AccountShell :title="firstName ? $t('account.greeting', { name: firstName }) : $t('account.title')">
    <div class="grid gap-12 md:grid-cols-2">
      <section class="md:col-span-2">
        <div class="mb-2 flex items-baseline justify-between">
          <h2 class="font-display text-2xl">{{ $t('account.recentOrders') }}</h2>
          <NuxtLink v-if="data?.orders.length" :to="localePath('/account/orders')" class="text-[14px] link-draw">{{ $t('common.viewAll') }}</NuxtLink>
        </div>
        <ul v-if="data?.orders.length" class="divide-y divide-mist border-y border-mist">
          <OrderRow v-for="o in data.orders" :key="o.order_number" :order="o as any" />
        </ul>
        <p v-else class="py-6 text-graphite">{{ $t('account.noOrdersBody') }}</p>
      </section>
      <section>
        <h2 class="font-display text-2xl">{{ $t('account.addresses') }}</h2>
        <address v-if="data?.address" class="mt-4 text-[15px] not-italic leading-relaxed">
          {{ data.address.full_name }}<br>{{ store.governorateName(data.address.governorate) }} · {{ data.address.area }}<br>{{ data.address.landmark }}
        </address>
        <p v-else class="mt-4 text-graphite">{{ $t('account.noAddresses') }}</p>
        <NuxtLink :to="localePath('/account/addresses')" class="mt-4 inline-block text-[14px] link-static">{{ $t('account.addresses') }}</NuxtLink>
      </section>
      <section>
        <h2 class="font-display text-2xl">{{ $t('account.profile') }}</h2>
        <p class="mt-4 text-[15px]">{{ data?.profile?.full_name }}</p>
        <p class="text-[15px] text-graphite">{{ data?.profile?.email }}</p>
        <NuxtLink :to="localePath('/account/settings')" class="mt-4 inline-block text-[14px] link-static">{{ $t('account.settings') }}</NuxtLink>
      </section>
    </div>
  </AccountShell>
</template>
