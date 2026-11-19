<script setup lang="ts">
import { passwordSchema, profileSchema } from '@vovian/validation'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const ui = useUiStore()
const { t } = useI18n()
usePageSeo({ title: () => t('account.settings'), noindex: true })

const uid = computed(() => user.value?.sub as string)
const form = reactive({ full_name: '', phone: '', locale: 'en' as 'en' | 'ar', marketing_opt_in: false })
const errors = reactive<Record<string, string | null>>({})
const saving = ref(false)

onMounted(async () => {
  const { data } = await supabase.from('profiles').select('full_name, phone, locale, marketing_opt_in').eq('id', uid.value).single()
  if (data) Object.assign(form, { ...data, full_name: data.full_name ?? '', phone: data.phone ?? '' })
})

async function saveProfile() {
  for (const k of Object.keys(errors)) errors[k] = null
  const parsed = profileSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= t(i.message.startsWith('validation.') ? i.message : 'validation.invalid')
    return
  }
  saving.value = true
  // Column-level grants only allow these fields; status/notes stay staff-only.
  const { error } = await supabase.from('profiles').update({ ...parsed.data, phone: parsed.data.phone || null }).eq('id', uid.value)
  saving.value = false
  ui.toast(error ? t('auth.genericError') : t('account.profileSaved'), error ? { tone: 'error' } : {})
}

const password = ref('')
const passwordError = ref<string | null>(null)
const changing = ref(false)
async function changePassword() {
  passwordError.value = null
  const parsed = passwordSchema.safeParse(password.value)
  if (!parsed.success) return (passwordError.value = t(parsed.error.issues[0]!.message))
  changing.value = true
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  changing.value = false
  if (error) return (passwordError.value = t('auth.genericError'))
  password.value = ''
  ui.toast(t('account.passwordUpdated'))
}
</script>

<template>
  <AccountShell :title="$t('account.settings')">
    <div class="grid max-w-xl gap-16">
      <form class="grid gap-6" novalidate @submit.prevent="saveProfile">
        <h2 class="font-display text-2xl">{{ $t('account.profile') }}</h2>
        <VField v-model="form.full_name" name="full_name" :label="$t('checkout.fullName')" autocomplete="name" required :error="errors.full_name" />
        <VField v-model="form.phone" name="phone" type="tel" :label="$t('checkout.phone')" autocomplete="tel" dir="ltr" :error="errors.phone" />
        <VField v-model="form.locale" as="select" name="locale" :label="$t('account.language')" :options="[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]" />
        <VCheckbox v-model="form.marketing_opt_in" :label="$t('account.marketingOptIn')" />
        <VButton type="submit" class="sm:w-fit" :loading="saving">{{ $t('common.save') }}</VButton>
      </form>

      <form class="grid gap-6" novalidate @submit.prevent="changePassword">
        <h2 class="font-display text-2xl">{{ $t('account.changePassword') }}</h2>
        <VField v-model="password" name="new-password" type="password" :label="$t('account.newPassword')" autocomplete="new-password" :hint="$t('auth.passwordHint')" :error="passwordError" />
        <VButton type="submit" variant="outline" class="sm:w-fit" :loading="changing">{{ $t('auth.updatePassword') }}</VButton>
      </form>
    </div>
  </AccountShell>
</template>
