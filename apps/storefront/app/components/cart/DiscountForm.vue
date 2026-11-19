<script setup lang="ts">
const cart = useCartStore()
const ui = useUiStore()
const { t } = useI18n()
const { discountReason } = useFormat()

const code = ref('')
const error = ref<string | null>(null)
const busy = ref(false)
const open = ref(false)
const id = useId()

async function apply() {
  if (!code.value.trim()) return
  busy.value = true
  error.value = null
  const r = await cart.applyDiscount(code.value)
  busy.value = false
  if (!r.ok) {
    error.value = discountReason(r.reason) || t('cart.discountRemoved')
    return
  }
  code.value = ''
  open.value = false
}
</script>

<template>
  <div>
    <div v-if="cart.discountCode && cart.quote?.discount?.valid" class="flex items-center justify-between text-[14px]">
      <span>{{ $t('cart.applied', { code: cart.discountCode }) }}</span>
      <button type="button" class="link-static cursor-pointer" @click="cart.removeDiscount(); ui.toast($t('cart.discountRemoved'))">{{ $t('cart.removeCode') }}</button>
    </div>
    <template v-else>
      <button v-if="!open" type="button" class="text-[14px] link-static cursor-pointer" :aria-expanded="open" @click="open = true">{{ $t('cart.discountLabel') }}</button>
      <form v-else class="flex items-end gap-3" @submit.prevent="apply">
        <div class="flex-1">
          <label :for="id" class="block text-[13px] text-graphite">{{ $t('cart.discountLabel') }}</label>
          <input
            :id="id"
            v-model="code"
            autocomplete="off"
            autocapitalize="characters"
            :aria-invalid="!!error || undefined"
            :aria-describedby="error ? `${id}-e` : undefined"
            class="w-full border-b border-mist bg-transparent py-2.5 text-[15px] uppercase outline-none focus:border-ink"
            data-testid="discount-input"
          >
        </div>
        <VButton type="submit" variant="outline" size="sm" :loading="busy">{{ $t('cart.apply') }}</VButton>
      </form>
      <p v-if="error" :id="`${id}-e`" class="mt-2 text-[13px] text-error" role="alert">{{ error }}</p>
    </template>
  </div>
</template>
