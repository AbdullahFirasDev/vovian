<script setup lang="ts">
const ui = useUiStore()
const cart = useCartStore()
const localePath = useLocalePath()
const { money } = useFormat()

watch(() => ui.cartOpen, (open) => open && cart.refreshQuote())

const subtotal = computed(() => cart.quote?.subtotal ?? cart.estimatedSubtotal)
</script>

<template>
  <VDrawer v-model="ui.cartOpen" side="end" :label="$t('cart.title')" width="30rem">
    <div class="flex h-[var(--header-h)] items-center justify-between border-b border-mist px-6">
      <h2 class="font-display text-2xl">{{ $t('cart.title') }} <span class="font-sans text-[15px] text-graphite tabular-nums">({{ cart.count }})</span></h2>
      <button type="button" class="-me-2 grid size-11 place-items-center cursor-pointer" :aria-label="$t('common.close')" @click="ui.cartOpen = false">
        <VIcon name="close" />
      </button>
    </div>

    <div v-if="cart.isEmpty" class="flex flex-1 flex-col items-start justify-center px-6">
      <p class="display-md">{{ $t('cart.emptyTitle') }}</p>
      <p class="mt-3 text-graphite">{{ $t('cart.emptyBody') }}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <VButton to="/women" variant="outline">{{ $t('nav.shopWomen') }}</VButton>
        <VButton to="/men" variant="outline">{{ $t('nav.shopMen') }}</VButton>
      </div>
    </div>

    <template v-else>
      <ul class="flex-1 divide-y divide-mist overflow-y-auto px-6">
        <CartLineItem v-for="line in cart.lines" :key="line.variant_id" :line="line" compact />
      </ul>

      <div class="border-t border-mist px-6 py-5">
        <p v-if="cart.hasIssues" class="mb-4 text-[14px] text-error" role="alert">
          {{ $t('cart.issuesNotice') }}
          <button type="button" class="link-static ms-1 cursor-pointer" @click="cart.resolveIssues()">{{ $t('cart.updateBag') }}</button>
        </p>
        <dl class="flex items-baseline justify-between text-[15px]">
          <dt>{{ $t('cart.subtotal') }}</dt>
          <dd class="tabular-nums" :class="cart.quoting && 'opacity-50'">{{ money(subtotal) }}</dd>
        </dl>
        <p class="mt-1 text-[13px] text-graphite">{{ $t('cart.shippingAtCheckout') }}</p>
        <div class="mt-5 grid gap-2">
          <VButton to="/checkout" block size="lg" :disabled="cart.hasIssues">{{ $t('cart.checkout') }}</VButton>
          <NuxtLink :to="localePath('/cart')" class="py-2 text-center text-[14px] link-static">{{ $t('cart.viewBag') }}</NuxtLink>
        </div>
      </div>
    </template>
  </VDrawer>
</template>
