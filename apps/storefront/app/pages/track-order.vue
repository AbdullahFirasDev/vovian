<script setup lang="ts">
import { trackOrderSchema } from '@vovian/validation'
import type { CustomerOrder } from '@vovian/types'

const supabase = useSupabaseClient()
const route = useRoute()
const { t } = useI18n()
const { date, orderStatus, error: errorText } = useFormat()
usePageSeo({ title: () => t('track.title'), description: () => t('track.intro') })

const form = reactive({ order_number: String(route.query.order ?? ''), contact: '' })
const errors = reactive<Record<string, string | null>>({})
const order = ref<CustomerOrder | null>(null)
const notFound = ref(false)
const busy = ref(false)
const formError = ref<string | null>(null)

async function submit() {
  for (const k of Object.keys(errors)) errors[k] = null
  notFound.value = false
  formError.value = null
  const parsed = trackOrderSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= t(i.message)
    return
  }
  busy.value = true
  const { data, error } = await supabase.rpc('track_order', { p_order_number: parsed.data.order_number, p_contact: parsed.data.contact })
  busy.value = false
  if (error) return (formError.value = errorText(error.message))
  order.value = (data as unknown as CustomerOrder) ?? null
  notFound.value = !data
}
</script>

<template>
  <div class="shell grid-editorial gap-y-12 pt-8 pb-24 md:pt-12">
    <div class="col-span-4 md:col-span-12">
      <VBreadcrumbs :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('track.title') }]" />
    </div>
    <div class="col-span-4 md:col-span-5">
      <h1 class="display-xl">{{ $t('track.title') }}</h1>
      <p class="mt-5 text-[15px] text-graphite">{{ $t('track.intro') }}</p>
      <form class="mt-10 grid gap-6" novalidate @submit.prevent="submit">
        <p v-if="formError" class="text-[14px] text-error" role="alert">{{ formError }}</p>
        <VField v-model="form.order_number" name="order_number" :label="$t('track.orderNumber')" :hint="$t('track.orderNumberHint')" dir="ltr" required :error="errors.order_number" />
        <VField v-model="form.contact" name="contact" :label="$t('track.contact')" :hint="$t('track.contactHint')" autocomplete="email" required :error="errors.contact" />
        <VButton type="submit" size="lg" :loading="busy">{{ $t('track.submit') }}</VButton>
        <p v-if="notFound" class="text-[14px] text-error" role="alert">{{ $t('track.notFound') }}</p>
      </form>
    </div>
    <div v-if="order" class="col-span-4 md:col-span-6 md:col-start-7" aria-live="polite">
      <p class="text-[13px] text-graphite">{{ $t('track.placedOn', { date: date(order.created_at, { dateStyle: 'long' }) }) }}</p>
      <p class="mt-2 font-display text-4xl">{{ order.order_number }}</p>
      <p class="mt-1 text-[15px]">{{ $t('track.status') }}: {{ orderStatus(order.status) }}</p>
      <div class="mt-10">
        <OrderDetail :order="order" />
      </div>
    </div>
  </div>
</template>
