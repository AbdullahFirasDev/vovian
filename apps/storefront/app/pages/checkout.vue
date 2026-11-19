<script setup lang="ts">
import { addressSchema, contactSchema, deliveryPhonesSchema } from '@vovian/validation'
import type { PaymentMethodSetting, PlaceOrderResult } from '@vovian/types'

definePageMeta({ layout: 'checkout' })

const cart = useCartStore()
const store = useStoreConfig()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const edge = useEdge()
const router = useRouter()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const { money, error: errorText } = useFormat()

usePageSeo({ title: () => t('checkout.title'), noindex: true })

type Step = 'contact' | 'delivery' | 'shipping' | 'payment' | 'review'
const STEPS: Step[] = ['contact', 'delivery', 'shipping', 'payment', 'review']
const step = ref<Step>('contact')
const stepIndex = computed(() => STEPS.indexOf(step.value))

// ── Form state (kept for the session so a reload doesn't lose it) ────────
const SESSION_KEY = 'vovian:checkout:v2'
const form = reactive({
  email: '',
  full_name: '',
  // Iraqi delivery details
  governorate: store.checkoutSettings.value?.default_governorate ?? 'baghdad',
  area: '',
  landmark: '',
  phone: '',
  phone_secondary: '',
  delivery_instructions: '',
  shipping_method_id: '' as string,
  payment_method: '' as string,
  marketing_opt_in: false,
  idempotency_key: '',
})
const errors = reactive<Record<string, string | null>>({})
const banner = ref<string | null>(null)
const placing = ref(false)

onMounted(async () => {
  cart.hydrate()
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) Object.assign(form, JSON.parse(saved))
  } catch { /* ignore */ }
  if (!form.idempotency_key) form.idempotency_key = crypto.randomUUID()
  if (cart.isEmpty) return router.replace(localePath('/cart'))
  await prefillFromAccount()
  await cart.refreshQuote({ governorate: form.governorate, shippingMethodId: form.shipping_method_id || null, email: form.email || null })
})
watch(form, () => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(form)) } catch { /* ignore */ }
}, { deep: true })

// ── Signed-in customers: profile + address book ─────────────────────────
interface SavedAddress { id: string; label: string | null; full_name: string; phone: string; phone_secondary: string | null; governorate: string; area: string; landmark: string; is_default: boolean }
const addresses = ref<SavedAddress[]>([])
async function prefillFromAccount() {
  if (!user.value) return
  const uid = user.value.sub as string
  const [{ data: profile }, { data: addr }] = await Promise.all([
    supabase.from('profiles').select('email, full_name, phone').eq('id', uid).maybeSingle(),
    supabase.from('addresses').select('*').eq('user_id', uid).order('is_default', { ascending: false }),
  ])
  form.email ||= profile?.email ?? ''
  form.full_name ||= profile?.full_name ?? ''
  form.phone ||= profile?.phone ?? ''
  addresses.value = (addr ?? []) as SavedAddress[]
  if (!form.area && addresses.value[0]) useAddress(addresses.value[0])
}
function useAddress(a: SavedAddress) {
  Object.assign(form, { governorate: a.governorate, area: a.area, landmark: a.landmark, phone: a.phone, phone_secondary: a.phone_secondary ?? '' })
  form.full_name ||= a.full_name
}

// ── Governorates (from the database; staff can pause delivery to any) ────
const governorateOptions = computed(() => store.governorates.value.map((g) => ({ value: g.code, label: g.name })))
const governorateName = computed(() => store.governorateName(form.governorate))
const shippingDays = (m: { min_days: number; max_days: number }) =>
  m.max_days === 0 ? t('checkout.sameDay') : m.min_days === m.max_days ? t('checkout.daysExact', { n: m.max_days }) : t('checkout.days', { min: m.min_days, max: m.max_days })

const paymentMethods = computed(() => store.paymentMethods.value as PaymentMethodSetting[])
const pmLabel = (m: PaymentMethodSetting, k: 'label' | 'description') => m.translations?.[locale.value as 'en' | 'ar']?.[k] ?? m[k]
const shippingMethods = computed(() => cart.quote?.shipping_methods ?? [])

// ── Step validation ─────────────────────────────────────────────────────
function applyIssues(issues: { path: (string | number | symbol)[]; message: string }[]) {
  for (const i of issues) errors[String(i.path.at(-1))] = t(i.message.startsWith('validation.') ? i.message : 'validation.invalid')
}
function clearErrors() {
  for (const k of Object.keys(errors)) errors[k] = null
}

async function next() {
  clearErrors()
  banner.value = null
  if (step.value === 'contact') {
    const r = contactSchema.safeParse(form)
    if (!r.success) return applyIssues(r.error.issues)
    step.value = 'delivery'
  } else if (step.value === 'delivery') {
    const address = addressSchema.safeParse(form)
    const phones = deliveryPhonesSchema.safeParse(form)
    const issues = [...(address.error?.issues ?? []), ...(phones.error?.issues ?? [])]
    if (issues.length) return applyIssues(issues)
    // Show numbers the way they will be stored (+964 7XX…)
    form.phone = phones.data!.phone
    form.phone_secondary = phones.data!.phone_secondary ?? ''
    await cart.refreshQuote({ governorate: form.governorate, shippingMethodId: null, email: form.email })
    if (!shippingMethods.value.find((m) => m.id === form.shipping_method_id)) form.shipping_method_id = shippingMethods.value[0]?.id ?? ''
    if (form.shipping_method_id) await cart.refreshQuote({ shippingMethodId: form.shipping_method_id })
    step.value = 'shipping'
  } else if (step.value === 'shipping') {
    if (!form.shipping_method_id) return (errors.shipping_method_id = t('validation.shipping'))
    step.value = 'payment'
  } else if (step.value === 'payment') {
    if (!form.payment_method) return (errors.payment_method = t('validation.payment'))
    step.value = 'review'
  }
  await nextTick()
  document.getElementById(`step-${step.value}`)?.focus()
}

function goTo(s: Step) {
  if (STEPS.indexOf(s) < stepIndex.value) step.value = s
}

watch(() => form.shipping_method_id, (id) => id && cart.refreshQuote({ shippingMethodId: id }))
watch(paymentMethods, (m) => {
  if (!form.payment_method && m[0]) form.payment_method = m[0].code
}, { immediate: true })

// ── Place order ─────────────────────────────────────────────────────────
async function placeOrder() {
  if (placing.value) return
  banner.value = null
  placing.value = true
  const { data, error, status } = await edge.call<PlaceOrderResult & { payment: unknown }>('create-order', {
    idempotency_key: form.idempotency_key,
    email: form.email,
    full_name: form.full_name,
    phone: form.phone,
    phone_secondary: form.phone_secondary || null,
    shipping_address: { governorate: form.governorate, area: form.area, landmark: form.landmark },
    delivery_instructions: form.delivery_instructions,
    shipping_method_id: form.shipping_method_id,
    payment_method: form.payment_method,
    discount_code: cart.discountCode,
    marketing_opt_in: form.marketing_opt_in,
    locale: locale.value,
    // Only ids and quantities — the server prices everything.
    items: cart.lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity })),
  })
  placing.value = false

  if (data) {
    sessionStorage.removeItem(SESSION_KEY)
    cart.clear()
    return router.replace(localePath({ path: `/order/${data.order_number}`, query: { token: data.access_token } }))
  }

  const code = error?.code ?? 'UNKNOWN'
  if (code === 'CART_INVALID') {
    await cart.refreshQuote()
    banner.value = t('checkout.cartChanged')
  } else if (code === 'DISCOUNT_INVALID') {
    cart.removeDiscount()
    banner.value = t('checkout.discountInvalid')
  } else if (code === 'SHIPPING_UNAVAILABLE') {
    step.value = 'shipping'
    banner.value = errorText(code)
  } else if (code === 'VALIDATION' && status === 422 && ((error?.fields as { path: string }[] | undefined) ?? []).some((f) => f.path.startsWith('items'))) {
    // An item in the bag is no longer valid: refresh it rather than sending the shopper back to step one.
    await cart.refreshQuote()
    banner.value = t('checkout.cartChanged')
  } else if (code === 'VALIDATION' && status === 422) {
    const fields = (error?.fields as { path: string; message: string }[] | undefined) ?? []
    applyIssues(fields.map((f) => ({ path: f.path.split('.'), message: f.message })))
    const first = fields[0]?.path ?? ''
    step.value = /address|governorate|area|landmark|phone/.test(first) ? 'delivery' : /shipping/.test(first) ? 'shipping' : /payment/.test(first) ? 'payment' : 'contact'
    banner.value = errorText(code)
  } else {
    banner.value = errorText(code)
  }
}

const summaryOpen = ref(false)
const stepLabel = (s: Step) => t(`checkout.steps.${s}`)
</script>

<template>
  <div class="shell grid gap-10 pt-6 pb-24 lg:grid-cols-12 lg:pt-12">
    <!-- Mobile summary toggle -->
    <div class="border-y border-mist lg:hidden">
      <button type="button" class="flex w-full items-center justify-between py-4 text-[15px] cursor-pointer" :aria-expanded="summaryOpen" aria-controls="mobile-summary" @click="summaryOpen = !summaryOpen">
        <span class="flex items-center gap-2">{{ $t('checkout.summary') }} <VIcon :name="summaryOpen ? 'chevron-up' : 'chevron-down'" :size="16" /></span>
        <span class="font-display text-xl tabular-nums">{{ money(cart.quote?.total ?? cart.estimatedSubtotal) }}</span>
      </button>
      <div v-show="summaryOpen" id="mobile-summary" class="pb-6">
        <CheckoutLines />
        <OrderSummary :quote="cart.quote" :loading="cart.quoting" class="mt-6" />
      </div>
    </div>

    <div class="lg:col-span-7">
      <h1 class="display-lg">{{ $t('checkout.title') }}</h1>
      <ol class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px]" :aria-label="$t('checkout.stepOf', { n: stepIndex + 1, total: STEPS.length })">
        <li v-for="(s, i) in STEPS" :key="s" :aria-current="step === s ? 'step' : undefined" :class="i <= stepIndex ? 'text-ink' : 'text-stone'">
          <button v-if="i < stepIndex" type="button" class="link-static cursor-pointer" @click="goTo(s)">{{ stepLabel(s) }}</button>
          <span v-else :class="step === s && 'border-b border-ink pb-0.5'">{{ stepLabel(s) }}</span>
        </li>
      </ol>

      <p v-if="banner" class="mt-8 border border-error p-4 text-[14px] text-error" role="alert">{{ banner }}</p>

      <form class="mt-8 divide-y divide-mist border-y border-mist" novalidate @submit.prevent="step === 'review' ? placeOrder() : next()">
        <!-- 1. Contact -->
        <section class="py-8">
          <div class="flex items-baseline justify-between">
            <h2 id="step-contact" tabindex="-1" class="font-display text-2xl outline-none">{{ $t('checkout.contact') }}</h2>
            <button v-if="stepIndex > 0" type="button" class="text-[14px] link-static cursor-pointer" @click="goTo('contact')">{{ $t('checkout.edit') }}</button>
          </div>
          <div v-if="step === 'contact'" class="mt-6 grid gap-6">
            <p v-if="!user" class="text-[14px] text-graphite">
              {{ $t('checkout.haveAccount') }}
              <NuxtLink :to="localePath({ path: '/login', query: { redirect: '/checkout' } })" class="link-static text-ink">{{ $t('checkout.signIn') }}</NuxtLink>
              · {{ $t('checkout.guestNote') }}
            </p>
            <VField v-model="form.email" name="email" type="email" :label="$t('checkout.email')" autocomplete="email" inputmode="email" required :error="errors.email" />
            <VField v-model="form.full_name" name="full_name" :label="$t('checkout.fullName')" autocomplete="name" required :error="errors.full_name" />
            <VButton type="submit" size="lg" class="sm:w-fit">{{ $t('checkout.continue') }}</VButton>
          </div>
          <p v-else class="mt-3 text-[15px] text-graphite">{{ form.full_name }} · {{ form.email }}</p>
        </section>

        <!-- 2. Address -->
        <section class="py-8">
          <div class="flex items-baseline justify-between">
            <h2 id="step-delivery" tabindex="-1" class="font-display text-2xl outline-none" :class="stepIndex < 1 && 'text-stone'">{{ $t('checkout.delivery') }}</h2>
            <button v-if="stepIndex > 1" type="button" class="text-[14px] link-static cursor-pointer" @click="goTo('delivery')">{{ $t('checkout.edit') }}</button>
          </div>
          <div v-if="step === 'delivery'" class="mt-6 grid gap-6">
            <div v-if="addresses.length" class="flex flex-wrap gap-2">
              <p class="w-full text-[13px] text-graphite">{{ $t('checkout.savedAddresses') }}</p>
              <button
                v-for="a in addresses"
                :key="a.id"
                type="button"
                class="border px-4 py-3 text-start text-[13px] cursor-pointer"
                :class="form.area === a.area && form.landmark === a.landmark ? 'border-ink' : 'border-mist hover:border-ink'"
                @click="useAddress(a)"
              >
                <span class="block font-medium">{{ a.label || a.area }}</span>
                <span class="text-graphite">{{ a.area }} · {{ store.governorateName(a.governorate) }}</span>
              </button>
            </div>
            <VField v-model="form.governorate" as="select" name="governorate" :label="$t('checkout.governorate')" required :options="governorateOptions" :error="errors.governorate" />
            <VField v-model="form.area" name="area" :label="$t('checkout.area')" :hint="$t('checkout.areaHint')" autocomplete="address-level3" required :error="errors.area" />
            <VField v-model="form.landmark" name="landmark" :label="$t('checkout.landmark')" :hint="$t('checkout.landmarkHint')" required :error="errors.landmark" />
            <div class="grid gap-6 sm:grid-cols-2">
              <VField v-model="form.phone" name="phone" type="tel" :label="$t('checkout.phone')" autocomplete="tel" inputmode="tel" dir="ltr" required :hint="$t('checkout.phoneHint')" :error="errors.phone" />
              <VField v-model="form.phone_secondary" name="phone_secondary" type="tel" :label="`${$t('checkout.phoneSecondary')} (${$t('common.optional')})`" inputmode="tel" dir="ltr" :hint="$t('checkout.phoneSecondaryHint')" :error="errors.phone_secondary" />
            </div>
            <VField v-model="form.delivery_instructions" as="textarea" :rows="2" name="delivery_instructions" :label="`${$t('checkout.instructions')} (${$t('common.optional')})`" :hint="$t('checkout.instructionsHint')" :maxlength="500" />
            <VButton type="submit" size="lg" class="sm:w-fit">{{ $t('checkout.continue') }}</VButton>
          </div>
          <div v-else-if="stepIndex > 1" class="mt-3 text-[15px] text-graphite">
            <p>{{ governorateName }} · {{ form.area }} · {{ form.landmark }}</p>
            <p dir="ltr" class="text-start">{{ form.phone }}<span v-if="form.phone_secondary"> · {{ form.phone_secondary }}</span></p>
          </div>
        </section>

        <!-- 3. Shipping -->
        <section class="py-8">
          <div class="flex items-baseline justify-between">
            <h2 id="step-shipping" tabindex="-1" class="font-display text-2xl outline-none" :class="stepIndex < 2 && 'text-stone'">{{ $t('checkout.shippingMethod') }}</h2>
            <button v-if="stepIndex > 2" type="button" class="text-[14px] link-static cursor-pointer" @click="goTo('shipping')">{{ $t('checkout.edit') }}</button>
          </div>
          <div v-if="step === 'shipping'" class="mt-6">
            <fieldset v-if="shippingMethods.length" :aria-describedby="errors.shipping_method_id ? 'ship-err' : undefined">
              <legend class="sr-only">{{ $t('checkout.shippingMethod') }}</legend>
              <div class="divide-y divide-mist border border-mist">
                <label v-for="m in shippingMethods" :key="m.id" class="flex cursor-pointer items-center gap-4 p-5" :class="form.shipping_method_id === m.id && 'bg-paper'">
                  <input v-model="form.shipping_method_id" type="radio" name="shipping" :value="m.id" class="size-4 accent-ink">
                  <span class="flex-1">
                    <span class="block text-[15px]">{{ m.name }}</span>
                    <span class="text-[13px] text-graphite">{{ shippingDays(m) }}<span v-if="m.description"> · {{ m.description }}</span></span>
                  </span>
                  <span class="text-[15px] tabular-nums">{{ m.price === 0 ? $t('checkout.free') : money(m.price) }}</span>
                </label>
              </div>
            </fieldset>
            <p v-else class="text-[15px] text-error" role="alert">{{ $t('checkout.noShipping') }}</p>
            <p v-if="errors.shipping_method_id" id="ship-err" class="mt-2 text-[13px] text-error" role="alert">{{ errors.shipping_method_id }}</p>
            <VButton type="submit" size="lg" class="mt-6 sm:w-fit" :disabled="!shippingMethods.length">{{ $t('checkout.continue') }}</VButton>
          </div>
          <p v-else-if="stepIndex > 2 && cart.quote?.shipping_method" class="mt-3 text-[15px] text-graphite">
            {{ cart.quote.shipping_method.name }} · {{ cart.quote.shipping_total === 0 ? $t('checkout.free') : money(cart.quote.shipping_total) }}
          </p>
        </section>

        <!-- 4. Payment -->
        <section class="py-8">
          <div class="flex items-baseline justify-between">
            <h2 id="step-payment" tabindex="-1" class="font-display text-2xl outline-none" :class="stepIndex < 3 && 'text-stone'">{{ $t('checkout.payment') }}</h2>
            <button v-if="stepIndex > 3" type="button" class="text-[14px] link-static cursor-pointer" @click="goTo('payment')">{{ $t('checkout.edit') }}</button>
          </div>
          <div v-if="step === 'payment'" class="mt-6">
            <fieldset>
              <legend class="sr-only">{{ $t('checkout.payment') }}</legend>
              <div class="divide-y divide-mist border border-mist">
                <label v-for="m in paymentMethods" :key="m.code" class="flex cursor-pointer items-start gap-4 p-5" :class="form.payment_method === m.code && 'bg-paper'">
                  <input v-model="form.payment_method" type="radio" name="payment" :value="m.code" class="mt-1 size-4 accent-ink">
                  <span>
                    <span class="block text-[15px]">{{ pmLabel(m, 'label') }}</span>
                    <span class="text-[13px] text-graphite">{{ pmLabel(m, 'description') }}</span>
                  </span>
                </label>
              </div>
            </fieldset>
            <p v-if="errors.payment_method" class="mt-2 text-[13px] text-error" role="alert">{{ errors.payment_method }}</p>
            <p class="mt-4 text-[13px] text-graphite">{{ $t('checkout.paymentNote') }}</p>
            <VButton type="submit" size="lg" class="mt-6 sm:w-fit">{{ $t('checkout.continue') }}</VButton>
          </div>
          <p v-else-if="stepIndex > 3" class="mt-3 text-[15px] text-graphite">{{ pmLabel(paymentMethods.find((m) => m.code === form.payment_method)!, 'label') }}</p>
        </section>

        <!-- 5. Review -->
        <section class="py-8">
          <h2 id="step-review" tabindex="-1" class="font-display text-2xl outline-none" :class="stepIndex < 4 && 'text-stone'">{{ $t('checkout.review') }}</h2>
          <div v-if="step === 'review'" class="mt-6">
            <CheckoutLines class="lg:hidden" />
            <VCheckbox v-model="form.marketing_opt_in" :label="$t('checkout.marketing')" class="mt-2" />
            <p class="mt-4 text-[13px] text-graphite">
              {{ $t('checkout.terms') }}
              <NuxtLink :to="localePath('/pages/terms')" class="link-static">{{ $t('checkout.termsLink') }}</NuxtLink> ·
              <NuxtLink :to="localePath('/pages/privacy')" class="link-static">{{ $t('checkout.privacyLink') }}</NuxtLink>
            </p>
            <VButton type="submit" block size="lg" class="mt-6" :loading="placing" :disabled="cart.hasIssues || cart.isEmpty" data-testid="place-order">
              {{ $t('checkout.placeOrder') }} · {{ money(cart.quote?.total ?? 0) }}
            </VButton>
          </div>
        </section>
      </form>
    </div>

    <!-- Desktop summary -->
    <aside class="hidden lg:col-span-4 lg:col-start-9 lg:block" :aria-label="$t('checkout.summary')">
      <div class="sticky top-8 bg-paper p-8">
        <h2 class="mb-6 font-display text-2xl">{{ $t('checkout.summary') }}</h2>
        <CheckoutLines />
        <DiscountForm class="mt-6 border-t border-mist pt-6" />
        <OrderSummary :quote="cart.quote" :loading="cart.quoting" class="mt-6 border-t border-mist pt-6" />
      </div>
    </aside>
  </div>
</template>
