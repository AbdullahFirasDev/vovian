import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@nuxt/image', '@nuxtjs/supabase'],

  css: ['~/assets/css/main.css'],

  // Components are referenced by file name (VButton, ProductCard…) regardless of folder.
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger', 'markdown-it'] },
  },

  build: { transpile: ['@vovian/shared', '@vovian/validation', '@vovian/types'] },

  runtimeConfig: {
    public: {
      siteUrl,
      functionsUrl: process.env.NUXT_PUBLIC_FUNCTIONS_URL ?? `${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}/functions/v1`,
      // Supabase Storage image transformations (Pro plan / local imgproxy).
      imageTransforms: process.env.NUXT_PUBLIC_IMAGE_TRANSFORMS === 'true',
    },
  },

  // Customer auth only; the anon/publishable key is safe to expose. The service
  // role key is never configured in this app.
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false,
    // Generated from the local database: `npm run db:types`
    types: fileURLToPath(new URL('../../packages/types/src/database.ts', import.meta.url)),
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
  },

  i18n: {
    baseUrl: siteUrl,
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', dir: 'ltr', name: 'English', file: 'en.json' },
      { code: 'ar', language: 'ar', dir: 'rtl', name: 'العربية', file: 'ar.json' },
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'vovian_locale', redirectOn: 'root', alwaysRedirect: false },
  },

  image: {
    provider: 'vovian',
    providers: {
      vovian: {
        provider: '~/providers/vovian.ts',
        options: { imageTransforms: process.env.NUXT_PUBLIC_IMAGE_TRANSFORMS === 'true' },
      },
    },
    quality: 76,
    screens: { xs: 390, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1440, '2xl': 1920 },
    densities: [1, 2],
  },

  app: {
    head: {
      titleTemplate: '%s',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#000000' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..500&family=Hanken+Grotesk:wght@300..600&family=IBM+Plex+Sans+Arabic:wght@200;300;400;500;600&display=swap',
        },
      ],
    },
  },

  // Pages render no user-specific markup on the server (auth-dependent UI is
  // client-only), so catalogue pages can be cached at the edge and revalidated.
  routeRules: {
    '/': { swr: 120 },
    '/ar': { swr: 120 },
    '/products/**': { swr: 120 },
    '/ar/products/**': { swr: 120 },
    '/collections/**': { swr: 300 },
    '/pages/**': { swr: 600 },
    '/account/**': { ssr: false },
    '/ar/account/**': { ssr: false },
    '/checkout': { ssr: false },
    '/ar/checkout': { ssr: false },
    '/cart': { ssr: false },
    '/ar/cart': { ssr: false },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },

  nitro: {
    compressPublicAssets: true,
  },

  typescript: { strict: true },
})
