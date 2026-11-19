<script setup lang="ts">
import type { CustomerOrder } from '@vovian/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const ui = useUiStore()
const { t } = useI18n()
const { date, error: errorText } = useFormat()
const number = computed(() => String(route.params.number))
usePageSeo({ title: () => t('account.order', { number: number.value }), noindex: true })

const { data: order, refresh } = await useAsyncData(`my-order:${number.value}`, async () => {
  const { data } = await supabase.rpc('get_my_order', { p_order_number: number.value })
  return (data as unknown as CustomerOrder) ?? null
})

const cancelling = ref(false)
async function cancel() {
  if (!order.value || !confirm(t('account.cancelConfirm', { number: order.value.order_number }))) return
  cancelling.value = true
  const { error } = await supabase.rpc('cancel_my_order', { p_order_number: order.value.order_number })
  cancelling.value = false
  if (error) return ui.toast(errorText(error.message), { tone: 'error' })
  ui.toast(t('account.cancelled'))
  await refresh()
}
</script>

<template>
  <AccountShell :title="$t('account.order', { number })">
    <template v-if="order">
      <div class="-mt-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <p class="text-[14px] text-graphite">{{ $t('account.placed', { date: date(order.created_at, { dateStyle: 'long' }) }) }}</p>
        <VButton v-if="order.can_cancel" variant="outline" size="sm" :loading="cancelling" @click="cancel">{{ $t('account.cancelOrder') }}</VButton>
      </div>
      <OrderDetail :order="order" />
    </template>
    <VEmpty v-else :title="$t('checkout.orderNotFound')" :action="{ label: $t('account.orders'), to: '/account/orders' }" />
  </AccountShell>
</template>
