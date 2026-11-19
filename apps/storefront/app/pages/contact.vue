<script setup lang="ts">
import { contactMessageSchema } from '@vovian/validation'

const edge = useEdge()
const store = useStoreConfig()
const { t } = useI18n()
const { error: errorText } = useFormat()
usePageSeo({ title: () => t('contact.title'), description: () => t('contact.intro') })

const topics = ['general', 'order', 'sizing', 'returns', 'repairs', 'press'] as const
const form = reactive({ name: '', email: '', order_number: '', topic: 'general' as (typeof topics)[number], message: '', website: '' })
const errors = reactive<Record<string, string | null>>({})
const busy = ref(false)
const sent = ref(false)
const formError = ref<string | null>(null)
const { locale } = useI18n()
const info = computed(() => {
  const s = store.setting<{ email: string; phone: string; address: string; hours: string; translations?: Record<string, Partial<Record<'address' | 'hours', string>>> }>('store')
  return s ? { ...s, ...(s.translations?.[locale.value] ?? {}) } : undefined
})

async function submit() {
  for (const k of Object.keys(errors)) errors[k] = null
  formError.value = null
  const parsed = contactMessageSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= t(i.message.startsWith('validation.') ? i.message : 'validation.invalid')
    return
  }
  busy.value = true
  const { error } = await edge.call('contact', { ...parsed.data, website: form.website })
  busy.value = false
  if (error) return (formError.value = errorText(error.code))
  sent.value = true
}
</script>

<template>
  <div class="shell grid-editorial gap-y-14 pt-8 pb-24 md:pt-12">
    <div class="col-span-4 md:col-span-12">
      <VBreadcrumbs :items="[{ label: $t('nav.home'), to: '/' }, { label: $t('contact.title') }]" />
    </div>
    <div class="col-span-4 md:col-span-6">
      <h1 class="display-xl">{{ $t('contact.title') }}</h1>
      <p class="mt-5 max-w-[46ch] text-[15px] text-graphite">{{ $t('contact.intro') }}</p>

      <div v-if="sent" class="mt-12" role="status">
        <p class="font-display text-3xl">{{ $t('contact.sent') }}</p>
        <p class="mt-3 text-graphite">{{ $t('contact.sentBody', { email: form.email }) }}</p>
      </div>
      <form v-else class="mt-12 grid gap-6" novalidate @submit.prevent="submit">
        <p v-if="formError" class="text-[14px] text-error" role="alert">{{ formError }}</p>
        <div class="grid gap-6 sm:grid-cols-2">
          <VField v-model="form.name" name="name" :label="$t('contact.name')" autocomplete="name" required :error="errors.name" />
          <VField v-model="form.email" name="email" type="email" :label="$t('contact.email')" autocomplete="email" required :error="errors.email" />
        </div>
        <div class="grid gap-6 sm:grid-cols-2">
          <VField v-model="form.topic" as="select" name="topic" :label="$t('contact.topic')" :options="topics.map((v) => ({ value: v, label: $t(`contact.topics.${v}`) }))" />
          <VField v-model="form.order_number" name="order_number" :label="`${$t('contact.orderNumber')} (${$t('common.optional')})`" dir="ltr" />
        </div>
        <VField v-model="form.message" as="textarea" :rows="6" name="message" :label="$t('contact.message')" required :maxlength="5000" :error="errors.message" />
        <!-- Honeypot for bots; hidden from people and assistive tech -->
        <div class="absolute -start-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>Website <input v-model="form.website" tabindex="-1" autocomplete="off"></label>
        </div>
        <VButton type="submit" size="lg" class="sm:w-fit" :loading="busy">{{ $t('contact.send') }}</VButton>
      </form>
    </div>

    <aside class="col-span-4 md:col-span-4 md:col-start-9">
      <h2 class="text-[13px] text-graphite">{{ $t('contact.details') }}</h2>
      <p class="mt-3 text-[16px]"><a :href="`mailto:${info?.email}`" class="link-static">{{ info?.email }}</a></p>
      <p class="mt-1 text-[16px]" dir="ltr"><a :href="`tel:${info?.phone?.replace(/\s/g, '')}`" class="link-static">{{ info?.phone }}</a></p>
      <p class="mt-1 text-[14px] text-graphite">{{ info?.hours }}</p>
      <h2 class="mt-10 text-[13px] text-graphite">{{ $t('contact.studio') }}</h2>
      <address class="mt-3 text-[16px] not-italic">{{ info?.address }}</address>
      <VImage src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?sat=-100" alt="" ratio="4/5" sizes="xs:100vw md:33vw" class="mt-8" />
    </aside>
  </div>
</template>
