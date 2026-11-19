<script setup lang="ts">
import { newsletterSchema } from '@vovian/validation'

const props = withDefaults(defineProps<{ source?: string; tone?: 'light' | 'dark' }>(), { source: 'homepage', tone: 'light' })
const supabase = useSupabaseClient()
const { locale, t } = useI18n()
const { error: errorText } = useFormat()

const email = ref('')
const state = ref<'idle' | 'sending' | 'done'>('idle')
const error = ref<string | null>(null)
const id = useId()

async function submit() {
  error.value = null
  const parsed = newsletterSchema.safeParse({ email: email.value })
  if (!parsed.success) {
    error.value = t('validation.email')
    return
  }
  state.value = 'sending'
  const { error: e } = await supabase.rpc('subscribe_newsletter', { p_email: parsed.data.email, p_locale: locale.value, p_source: props.source })
  if (e) {
    state.value = 'idle'
    error.value = errorText(e.message)
    return
  }
  state.value = 'done'
}
</script>

<template>
  <div>
    <p v-if="state === 'done'" class="font-display text-2xl" role="status">{{ $t('newsletter.thanks') }}</p>
    <form v-else novalidate @submit.prevent="submit">
      <label :for="id" class="block text-[13px]" :class="tone === 'dark' ? 'text-white/70' : 'text-graphite'">{{ $t('newsletter.label') }}</label>
      <div class="mt-2 flex items-end gap-3 border-b" :class="[tone === 'dark' ? 'border-white/40 focus-within:border-white' : 'border-ink/30 focus-within:border-ink', error && '!border-error']">
        <input
          :id="id"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
          :aria-invalid="!!error || undefined"
          :aria-describedby="error ? `${id}-err` : undefined"
          class="min-w-0 flex-1 bg-transparent py-3 text-[17px] outline-none"
        >
        <button type="submit" class="shrink-0 py-3 text-[15px] link-draw cursor-pointer" :disabled="state === 'sending'">
          {{ state === 'sending' ? $t('newsletter.sending') : $t('newsletter.subscribe') }}
        </button>
      </div>
      <p v-if="error" :id="`${id}-err`" class="mt-2 text-[13px] text-error" role="alert">{{ error }}</p>
      <p class="mt-3 text-[12px]" :class="tone === 'dark' ? 'text-white/60' : 'text-graphite'">{{ $t('newsletter.privacy') }}</p>
    </form>
  </div>
</template>
