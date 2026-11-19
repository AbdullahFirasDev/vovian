<script setup lang="ts">
import { signInSchema } from '@vovian/validation'

const supabase = useSupabaseClient()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()
usePageSeo({ title: () => t('auth.signInTitle'), noindex: true })

const form = reactive({ email: '', password: '' })
const errors = reactive<Record<string, string | null>>({ email: null, password: null })
const formError = ref<string | null>(null)
const busy = ref(false)

const redirect = computed(() => {
  const r = String(route.query.redirect ?? '')
  return r.startsWith('/') && !r.startsWith('//') ? r : localePath('/account')
})

async function submit() {
  formError.value = null
  errors.email = errors.password = null
  const parsed = signInSchema.safeParse(form)
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors[String(i.path[0])] = t(i.message)
    return
  }
  busy.value = true
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  busy.value = false
  if (error) {
    formError.value = error.message.toLowerCase().includes('invalid') ? t('auth.invalidCredentials') : t('auth.genericError')
    return
  }
  router.replace(redirect.value)
}
</script>

<template>
  <AuthShell :title="$t('auth.signInTitle')" :intro="$t('auth.signInIntro')">
    <form class="grid gap-6" novalidate @submit.prevent="submit">
      <p v-if="formError" class="border border-error p-4 text-[14px] text-error" role="alert">{{ formError }}</p>
      <VField v-model="form.email" name="email" type="email" :label="$t('auth.email')" autocomplete="email" inputmode="email" required :error="errors.email" />
      <VField v-model="form.password" name="password" type="password" :label="$t('auth.password')" autocomplete="current-password" required :error="errors.password" />
      <NuxtLink :to="localePath('/forgot-password')" class="-mt-3 w-fit text-[13px] link-static">{{ $t('auth.forgot') }}</NuxtLink>
      <VButton type="submit" size="lg" block :loading="busy">{{ $t('auth.signIn') }}</VButton>
    </form>
    <p class="mt-10 border-t border-mist pt-6 text-[14px]">
      {{ $t('auth.noAccount') }}
      <NuxtLink :to="localePath({ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} })" class="link-static">{{ $t('auth.register') }}</NuxtLink>
    </p>
  </AuthShell>
</template>
