<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { t } = useI18n()
usePageSeo({ title: () => t('account.orders'), noindex: true })

const { data: orders, status } = await useAsyncData('account-orders', async () => {
  const { data } = await supabase
    .from('orders')
    .select('order_number, status, total, currency, created_at')
    .eq('user_id', user.value?.sub as string)
    .order('created_at', { ascending: false })
  return data ?? []
})
</script>

<template>
  <AccountShell :title="$t('account.orders')">
    <div v-if="status === 'pending'" class="skeleton h-40" />
    <ul v-else-if="orders?.length" class="divide-y divide-mist border-y border-mist">
      <OrderRow v-for="o in orders" :key="o.order_number" :order="o as any" />
    </ul>
    <VEmpty v-else :title="$t('account.noOrders')" :body="$t('account.noOrdersBody')" :action="{ label: $t('nav.newArrivals'), to: '/new-arrivals' }" />
  </AccountShell>
</template>
