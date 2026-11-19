import { createClient } from '@supabase/supabase-js'

interface Entry { slug: string; updated_at: string; department?: string }

/** XML sitemap with English + Arabic alternates for every public URL. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const site = String(config.public.siteUrl).replace(/\/$/, '')
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!, { auth: { persistSession: false } })
  const { data } = await supabase.rpc('sitemap_entries')
  const d = (data ?? {}) as { products?: Entry[]; categories?: Entry[]; collections?: Entry[]; pages?: Entry[] }

  const urls: { path: string; lastmod?: string; priority: string }[] = [
    { path: '/', priority: '1.0' },
    { path: '/women', priority: '0.9' },
    { path: '/men', priority: '0.9' },
    { path: '/new-arrivals', priority: '0.8' },
    { path: '/best-sellers', priority: '0.8' },
    { path: '/sale', priority: '0.7' },
    { path: '/accessories', priority: '0.7' },
    { path: '/collections', priority: '0.7' },
    { path: '/about', priority: '0.4' },
    { path: '/contact', priority: '0.4' },
    { path: '/size-guide', priority: '0.4' },
    { path: '/track-order', priority: '0.3' },
    ...(d.categories ?? []).filter((c) => c.department !== 'unisex').map((c) => ({ path: `/${c.department}/${c.slug}`, lastmod: c.updated_at, priority: '0.8' })),
    ...(d.collections ?? []).map((c) => ({ path: `/collections/${c.slug}`, lastmod: c.updated_at, priority: '0.7' })),
    ...(d.products ?? []).map((p) => ({ path: `/products/${p.slug}`, lastmod: p.updated_at, priority: '0.9' })),
    ...(d.pages ?? []).filter((p) => p.slug !== 'about').map((p) => ({ path: `/pages/${p.slug}`, lastmod: p.updated_at, priority: '0.3' })),
  ]

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const body = urls
    .map((u) => {
      const en = `${site}${u.path === '/' ? '' : u.path}` || site
      const ar = `${site}/ar${u.path === '/' ? '' : u.path}`
      return `  <url>
    <loc>${esc(en || '/')}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}
    <priority>${u.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${esc(ar)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/>
  </url>`
    })
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`
})
