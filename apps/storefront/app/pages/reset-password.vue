<script setup lang="ts">
import { passwordSchema } from '@vovian/validation'

const supabase = useSupabaseClient()
const router = useRouter()
const ui = useUiStore()
const localePath = useLocalePath()
const { t } = useI18n()
usePageSeo({ title: () => t('auth.resetTitle'), noindex: true })

const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  error.value = null
  const parsed = passwordSchema.safeParse(password.value)
  if (!parsed.success) return (error.value = t(parsed.error.issues[0]!.message))
  busy.value = true
  const { error: e } = await supabase.auth.updateUser({ password: parsed.data })
  busy.value = false
  if (e) return (error.value = t('auth.genericError'))
  ui.toast(t('auth.resetDone'))
  router.replace(localePath('/account'))
}
</script>

<template>
  <AuthShell :title="$t('auth.resetTitle')" :intro="$t('auth.resetIntro')">
    <form class="grid gap-6" novalidate @submit.prevent="submit">
      <VField v-model="password" name="password" type="password" :label="$t('auth.newPassword')" autocomplete="new-password" required :error="error" />
      <VButton type="submit" size="lg" block :loading="busy">{{ $t('auth.updatePassword') }}</VButton>
    </form>
  </AuthShell>
</template>
