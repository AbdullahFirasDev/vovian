export default defineEventHandler((event) => {
  const site = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /order/',
    'Disallow: /search',
    'Disallow: /ar/cart',
    'Disallow: /ar/checkout',
    'Disallow: /ar/account',
    'Disallow: /ar/order/',
    'Disallow: /ar/search',
    '',
    `Sitemap: ${site}/sitemap.xml`,
  ].join('\n')
})
