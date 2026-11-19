<script setup lang="ts">
import { signUpSchema } from '@vovian/validation'

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const localePath = useLocalePath()
const { locale, t } = useI18n()
usePageSeo({ title: () => t('auth.registerTitle'), noindex: true })

const form = reactive({ full_name: '', email: String(route.query.email ?? ''), password: '', marketing_opt_in: false })
const errors = reactive<Record<string, string | null>>({})
const formError = ref<string | null>(null)
const notice = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  formError.value = null
  for (const k of Object.keys(errors)) errors[k] = null
  const parsed = signUpSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= t(i.message)
    return
  }
  busy.value = true
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, locale: locale.value },
      emailRedirectTo: `${config.public.siteUrl}${localePath('/account')}`,
    },
  })
  busy.value = false
  if (error) {
    formError.value = /registered|exists/i.test(error.message) ? t('auth.emailTaken') : t('auth.genericError')
    return
  }
  if (parsed.data.marketing_opt_in) {
    await supabase.rpc('subscribe_newsletter', { p_email: parsed.data.email, p_locale: locale.value, p_source: 'register' })
  }
  const redirect = String(route.query.redirect ?? '')
  if (data.session) router.replace(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : localePath('/account'))
  else notice.value = t('auth.checkEmail')
}
</script>

<template>
  <AuthShell :title="$t('auth.registerTitle')" :intro="$t('auth.registerIntro')">
    <p v-if="notice" class="font-display text-2xl" role="status">{{ notice }}</p>
    <form v-else class="grid gap-6" novalidate @submit.prevent="submit">
      <p v-if="formError" class="border border-error p-4 text-[14px] text-error" role="alert">{{ formError }}</p>
      <VField v-model="form.full_name" name="full_name" :label="$t('auth.fullName')" autocomplete="name" required :error="errors.full_name" />
      <VField v-model="form.email" name="email" type="email" :label="$t('auth.email')" autocomplete="email" inputmode="email" required :error="errors.email" />
      <VField v-model="form.password" name="password" type="password" :label="$t('auth.password')" autocomplete="new-password" required :hint="$t('auth.passwordHint')" :error="errors.password" />
      <VCheckbox v-model="form.marketing_opt_in" :label="$t('auth.marketing')" />
      <VButton type="submit" size="lg" block :loading="busy">{{ $t('auth.createAccount') }}</VButton>
    </form>
    <p class="mt-10 border-t border-mist pt-6 text-[14px]">
      {{ $t('auth.haveAccount') }}
      <NuxtLink :to="localePath('/login')" class="link-static">{{ $t('auth.signIn') }}</NuxtLink>
    </p>
  </AuthShell>
</template>
