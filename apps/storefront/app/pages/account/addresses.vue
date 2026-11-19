<script setup lang="ts">
import { savedAddressSchema } from '@vovian/validation'

definePageMeta({ middleware: 'auth' })

interface Address { id: string; label: string | null; full_name: string; phone: string; phone_secondary: string | null; governorate: string; area: string; landmark: string; is_default: boolean }

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const ui = useUiStore()
const store = useStoreConfig()
const { t } = useI18n()
usePageSeo({ title: () => t('account.addresses'), noindex: true })

const uid = computed(() => user.value?.sub as string)
const { data: addresses, refresh } = await useAsyncData('my-addresses', async () => {
  const { data } = await supabase.from('addresses').select('*').eq('user_id', uid.value).order('is_default', { ascending: false }).order('created_at')
  return (data ?? []) as Address[]
})

const governorateOptions = computed(() => store.governorates.value.map((g) => ({ value: g.code, label: g.name })))

const open = ref(false)
const editingId = ref<string | null>(null)
const blank = () => ({
  label: '', full_name: '', phone: '', phone_secondary: '',
  governorate: store.checkoutSettings.value?.default_governorate ?? 'baghdad', area: '', landmark: '', is_default: false,
})
const form = reactive(blank())
const errors = reactive<Record<string, string | null>>({})
const saving = ref(false)

function edit(a?: Address) {
  editingId.value = a?.id ?? null
  Object.assign(form, blank(), a ? { ...a, label: a.label ?? '', phone_secondary: a.phone_secondary ?? '' } : { is_default: !addresses.value?.length })
  for (const k of Object.keys(errors)) errors[k] = null
  open.value = true
}

async function save() {
  for (const k of Object.keys(errors)) errors[k] = null
  const parsed = savedAddressSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= t(i.message.startsWith('validation.') ? i.message : 'validation.invalid')
    return
  }
  saving.value = true
  // Only one default per customer (enforced by a unique index).
  if (parsed.data.is_default) await supabase.from('addresses').update({ is_default: false }).eq('user_id', uid.value).eq('is_default', true)
  const row = { ...parsed.data, user_id: uid.value, label: parsed.data.label || null, phone_secondary: parsed.data.phone_secondary ?? null }
  const { error } = editingId.value
    ? await supabase.from('addresses').update(row).eq('id', editingId.value)
    : await supabase.from('addresses').insert(row)
  saving.value = false
  if (error) return ui.toast(t('auth.genericError'), { tone: 'error' })
  open.value = false
  ui.toast(t('account.addressSaved'))
  await refresh()
}

async function remove(a: Address) {
  if (!confirm(t('account.deleteConfirm'))) return
  await supabase.from('addresses').delete().eq('id', a.id)
  ui.toast(t('account.addressDeleted'))
  await refresh()
}

async function makeDefault(a: Address) {
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', uid.value).eq('is_default', true)
  await supabase.from('addresses').update({ is_default: true }).eq('id', a.id)
  await refresh()
}
</script>

<template>
  <AccountShell :title="$t('account.addresses')">
    <ul v-if="addresses?.length" class="grid gap-[var(--gutter)] sm:grid-cols-2">
      <li v-for="a in addresses" :key="a.id" class="flex flex-col border border-mist p-6">
        <p class="flex items-center justify-between text-[13px] text-graphite">
          <span>{{ a.label }}</span>
          <span v-if="a.is_default" class="text-ink">{{ $t('account.defaultAddress') }}</span>
        </p>
        <address class="mt-3 flex-1 text-[15px] not-italic leading-relaxed">
          {{ a.full_name }}<br>
          {{ store.governorateName(a.governorate) }} · {{ a.area }}<br>
          {{ a.landmark }}<br>
          <span dir="ltr">{{ a.phone }}<template v-if="a.phone_secondary"> · {{ a.phone_secondary }}</template></span>
        </address>
        <div class="mt-5 flex flex-wrap gap-4 text-[13px]">
          <button type="button" class="link-static cursor-pointer" @click="edit(a)">{{ $t('common.edit') }}</button>
          <button v-if="!a.is_default" type="button" class="link-static cursor-pointer" @click="makeDefault(a)">{{ $t('account.makeDefault') }}</button>
          <button type="button" class="link-static cursor-pointer" @click="remove(a)">{{ $t('account.deleteAddress') }}</button>
        </div>
      </li>
    </ul>
    <p v-else class="text-graphite">{{ $t('account.noAddresses') }}</p>
    <VButton variant="outline" class="mt-8" @click="edit()">{{ $t('account.addAddress') }}</VButton>

    <VModal v-model="open" :title="editingId ? $t('account.editAddress') : $t('account.addAddress')">
      <form class="grid gap-6" novalidate @submit.prevent="save">
        <VField v-model="form.label" name="label" :label="`${$t('account.label')} (${$t('common.optional')})`" :hint="$t('account.labelHint')" />
        <VField v-model="form.full_name" name="full_name" :label="$t('checkout.fullName')" autocomplete="name" required :error="errors.full_name" />
        <VField v-model="form.governorate" as="select" name="governorate" :label="$t('checkout.governorate')" :options="governorateOptions" required :error="errors.governorate" />
        <VField v-model="form.area" name="area" :label="$t('checkout.area')" :hint="$t('checkout.areaHint')" required :error="errors.area" />
        <VField v-model="form.landmark" name="landmark" :label="$t('checkout.landmark')" :hint="$t('checkout.landmarkHint')" required :error="errors.landmark" />
        <div class="grid gap-6 sm:grid-cols-2">
          <VField v-model="form.phone" name="phone" type="tel" :label="$t('checkout.phone')" autocomplete="tel" inputmode="tel" dir="ltr" required :error="errors.phone" />
          <VField v-model="form.phone_secondary" name="phone_secondary" type="tel" :label="`${$t('checkout.phoneSecondary')} (${$t('common.optional')})`" inputmode="tel" dir="ltr" :error="errors.phone_secondary" />
        </div>
        <VCheckbox v-model="form.is_default" :label="$t('account.makeDefault')" />
        <VButton type="submit" size="lg" :loading="saving">{{ $t('common.save') }}</VButton>
      </form>
    </VModal>
  </AccountShell>
</template>
