import type { ProductDetail } from '@vovian/types'

/** Per-page SEO: title, description, canonical, Open Graph. */
export function usePageSeo(opts: { title: MaybeRefOrGetter<string | undefined>; description?: MaybeRefOrGetter<string | undefined | null>; image?: MaybeRefOrGetter<string | undefined | null>; noindex?: boolean }) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const canonical = computed(() => `${config.public.siteUrl}${route.path}`)

  useHead({
    title: () => toValue(opts.title),
    link: [{ rel: 'canonical', href: canonical }],
    meta: opts.noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : [],
  })
  useSeoMeta({
    description: () => toValue(opts.description) ?? undefined,
    ogTitle: () => toValue(opts.title),
    ogDescription: () => toValue(opts.description) ?? undefined,
    ogImage: () => {
      const img = toValue(opts.image)
      return img ? (img.includes('images.unsplash.com') ? `${img}${img.includes('?') ? '&' : '?'}w=1200&h=630&fit=crop&auto=format` : img) : undefined
    },
    ogUrl: canonical,
  })
}

/** Organization structured data on every page. */
export function useSchemaOrg() {
  const config = useRuntimeConfig()
  useHead({
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'VOVIAN',
        url: config.public.siteUrl,
        logo: `${config.public.siteUrl}/favicon.svg`,
      }),
    }],
  })
}

/** Product structured data (schema.org/Product with Offers). */
export function useProductSchema(product: Ref<ProductDetail | null>, currency: Ref<string>) {
  const config = useRuntimeConfig()
  const route = useRoute()
  useHead({
    script: computed(() => {
      const p = product.value
      if (!p) return []
      const prices = p.variants.map((v) => v.price)
      return [{
        type: 'application/ld+json',
        key: 'product-ld',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: p.description,
          sku: p.style_code,
          brand: { '@type': 'Brand', name: p.brand },
          image: p.images.slice(0, 4).map((i) => `${i.url}${i.url.includes('?') ? '&' : '?'}w=1200&auto=format`),
          material: p.material,
          ...(p.rating?.count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.average, reviewCount: p.rating.count } } : {}),
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: currency.value,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: p.variants.length,
            availability: p.variants.some((v) => v.available > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${config.public.siteUrl}${route.path}`,
          },
        }),
      }]
    }),
  })
}
