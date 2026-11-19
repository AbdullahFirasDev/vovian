<script setup lang="ts">
import type { CartLine } from '~/stores/cart'

const props = defineProps<{ line: CartLine; compact?: boolean }>()
const cart = useCartStore()
const localePath = useLocalePath()
const { money } = useFormat()

const qty = computed({
  get: () => props.line.quantity,
  set: (v: number) => cart.setQuantity(props.line.variant_id, v),
})
const maxQty = computed(() => Math.max(1, Math.min(20, props.line.available ?? 20)))
const lineTotal = computed(() => (props.line.price != null ? props.line.price * props.line.quantity : null))
const issue = computed(() => (props.line.status && props.line.status !== 'ok' ? props.line.status : null))

// Change size/colour: load the product's variants on demand
const editing = ref(false)
const api = useCatalogApi()
const variants = ref<{ id: string; color: string | null; size: string | null; available: number; price: number; compare_at: number | null }[]>([])
async function startEdit() {
  editing.value = true
  if (!variants.value.length && props.line.slug) {
    const p = await api.product(props.line.slug)
    variants.value = p?.variants ?? []
  }
}
const colors = computed(() => [...new Set(variants.value.map((v) => v.color).filter(Boolean))] as string[])
const sizesForColor = computed(() => variants.value.filter((v) => v.color === props.line.color))
function choose(variantId: string) {
  const v = variants.value.find((x) => x.id === variantId)
  if (!v || v.id === props.line.variant_id) return
  cart.replaceVariant(props.line.variant_id, {
    ...props.line, variant_id: v.id, color: v.color, size: v.size, price: v.price, compare_at: v.compare_at, available: v.available, quantity: props.line.quantity,
  })
  editing.value = false
}
function chooseColor(color: string) {
  const match = variants.value.find((v) => v.color === color && v.size === props.line.size && v.available > 0)
    ?? variants.value.find((v) => v.color === color && v.available > 0)
  if (match) choose(match.id)
}
</script>

<template>
  <li class="flex gap-4 py-5">
    <NuxtLink :to="line.slug ? localePath(`/products/${line.slug}`) : undefined" class="w-24 shrink-0" :class="compact ? 'sm:w-24' : 'sm:w-32'">
      <VImage :src="line.image" :alt="line.name ?? ''" sizes="128px" />
    </NuxtLink>
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex justify-between gap-3">
        <div class="min-w-0">
          <NuxtLink :to="line.slug ? localePath(`/products/${line.slug}`) : undefined" class="block text-[15px] leading-snug">
            <span v-if="line.name">{{ line.name }}</span>
            <span v-else class="skeleton inline-block h-4 w-40" />
          </NuxtLink>
          <p class="mt-1 text-[13px] text-graphite">
            <span v-if="line.color">{{ line.color }}</span><span v-if="line.color && line.size"> / </span><span v-if="line.size">{{ line.size }}</span>
          </p>
        </div>
        <div class="text-end">
          <p class="text-[15px] tabular-nums">{{ money(lineTotal) }}</p>
          <s v-if="line.compare_at" class="text-[13px] text-graphite tabular-nums">{{ money(line.compare_at * line.quantity) }}</s>
        </div>
      </div>

      <p v-if="issue" class="mt-2 text-[13px] text-error" role="alert">
        {{ issue === 'insufficient_stock' ? $t('cart.onlyLeft', { n: line.available }) : $t('cart.noLongerAvailable') }}
      </p>

      <div v-if="editing" class="mt-3 space-y-3 border-t border-mist pt-3">
        <div v-if="colors.length > 1" class="flex flex-wrap gap-2">
          <button
            v-for="c in colors"
            :key="c"
            type="button"
            class="h-9 border px-3 text-[13px] cursor-pointer"
            :class="c === line.color ? 'border-ink' : 'border-mist'"
            @click="chooseColor(c)"
          >
            {{ c }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="v in sizesForColor"
            :key="v.id"
            type="button"
            class="h-9 min-w-11 border px-2 text-[13px] cursor-pointer disabled:cursor-not-allowed disabled:text-stone disabled:line-through"
            :class="v.id === line.variant_id ? 'border-ink' : 'border-mist'"
            :disabled="v.available <= 0"
            @click="choose(v.id)"
          >
            {{ v.size }}
          </button>
        </div>
        <button type="button" class="text-[13px] link-static cursor-pointer" @click="editing = false">{{ $t('common.done') }}</button>
      </div>

      <div class="mt-auto flex items-center justify-between gap-3 pt-3">
        <VQuantity v-model="qty" :max="maxQty" size="sm" :label="$t('cart.quantityFor', { name: line.name })" />
        <div class="flex items-center gap-4 text-[13px]">
          <button v-if="line.slug && !editing" type="button" class="link-static cursor-pointer" @click="startEdit">{{ $t('cart.edit') }}</button>
          <button type="button" class="link-static cursor-pointer" @click="cart.remove(line.variant_id)">{{ $t('cart.remove') }}</button>
        </div>
      </div>
    </div>
  </li>
</template>
