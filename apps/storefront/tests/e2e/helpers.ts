import type { Page } from '@playwright/test'

/** Navigate and wait until the Vue app has mounted, so clicks hit live handlers. */
export async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt') as (HTMLElement & { __vue_app__?: unknown }) | null
    return !!root?.__vue_app__
  }, undefined, { timeout: 60_000 })
  // Let client-only plugins (bag/wishlist hydration) settle.
  await page.waitForTimeout(300)
}
