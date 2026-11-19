import type { Governorate, MenuItem, PaymentMethodSetting } from '@vovian/types'

export interface StoreCategory {
  id: string
  slug: string
  department: 'women' | 'men' | 'unisex'
  parent_id: string | null
  name: string
  image_url: string | null
}

export interface StoreCollection {
  slug: string
  name: string
  cover_image_url: string | null
  is_featured: boolean
}

interface StoreConfig {
  settings: Record<string, unknown>
  menus: Record<string, MenuItem[]>
  categories: StoreCategory[]
  collections: StoreCollection[]
  governorates: Governorate[]
}

/** Public store configuration (settings, menus, categories) — fetched once per locale on SSR. */
export function useStoreConfig() {
  const { locale } = useI18n()
  const supabase = useSupabaseClient()
  const config = useState<StoreConfig | null>(`store-config`, () => null)
  const loadedLocale = useState<string | null>('store-config-locale', () => null)

  async function load() {
    if (config.value && loadedLocale.value === locale.value) return
    const { data, error } = await supabase.rpc('get_store_config', { p_locale: locale.value })
    if (error) {
      console.error('[store-config]', error.message)
      config.value = config.value ?? { settings: {}, menus: {}, categories: [], collections: [], governorates: [] }
      return
    }
    config.value = data as unknown as StoreConfig
    loadedLocale.value = locale.value
  }

  watch(locale, () => load())

  const setting = <T = unknown>(key: string) => config.value?.settings?.[key] as T | undefined
  const menu = (handle: string) => config.value?.menus?.[handle] ?? []
  const categories = (department: 'women' | 'men') =>
    (config.value?.categories ?? []).filter((c) => c.department === department && !c.parent_id)

  const currency = computed(() => setting<{ code: string }>('currency')?.code ?? 'IQD')
  const paymentMethods = computed(() => (setting<PaymentMethodSetting[]>('payment_methods') ?? []).filter((m) => m.enabled))
  const checkoutSettings = computed(() => setting<{ default_governorate: string; guest_checkout: boolean }>('checkout'))
  const governorates = computed(() => config.value?.governorates ?? [])
  const governorateName = (code: string | null | undefined) => governorates.value.find((g) => g.code === code)?.name ?? code ?? ''

  return { config, load, setting, menu, categories, currency, paymentMethods, checkoutSettings, governorates, governorateName }
}
