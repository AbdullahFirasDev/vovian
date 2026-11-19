<script setup lang="ts">
import { newsletterSchema } from '@vovian/validation'

const supabase = useSupabaseClient()
const config = useRuntimeConfig()
const localePath = useLocalePath()
const { t } = useI18n()
usePageSeo({ title: () => t('auth.forgotTitle'), noindex: true })

const email = ref('')
const error = ref<string | null>(null)
const sent = ref(false)
const busy = ref(false)

async function submit() {
  error.value = null
  const parsed = newsletterSchema.safeParse({ email: email.value })
  if (!parsed.success) return (error.value = t('validation.email'))
  busy.value = true
  // Always report success so the form can't be used to discover accounts.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${config.public.siteUrl}${localePath('/reset-password')}` })
  busy.value = false
  sent.value = true
}
</script>

<template>
  <AuthShell :title="$t('auth.forgotTitle')" :intro="$t('auth.forgotIntro')">
    <p v-if="sent" class="font-display text-2xl" role="status">{{ $t('auth.linkSent', { email }) }}</p>
    <form v-else class="grid gap-6" novalidate @submit.prevent="submit">
      <VField v-model="email" name="email" type="email" :label="$t('auth.email')" autocomplete="email" required :error="error" />
      <VButton type="submit" size="lg" block :loading="busy">{{ $t('auth.sendLink') }}</VButton>
    </form>
    <p class="mt-10 border-t border-mist pt-6 text-[14px]"><NuxtLink :to="localePath('/login')" class="link-static">{{ $t('auth.signIn') }}</NuxtLink></p>
  </AuthShell>
</template>
