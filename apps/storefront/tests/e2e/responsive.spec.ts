import { expect, test } from '@playwright/test'
import { visit } from './helpers'

const widths = [320, 390, 768, 1280, 1440, 1920]
const routes = ['/', '/women', '/men/jackets', '/products/pleated-chiffon-maxi-dress', '/collections', '/cart', '/checkout', '/about', '/contact', '/ar', '/ar/women']

test.describe('Responsive layout', () => {
  for (const width of widths) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width, height: 900 })
      const offenders: string[] = []
      for (const route of routes) {
        await visit(page, route)
        await page.waitForTimeout(500)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        if (overflow > 0) offenders.push(`${route} (+${overflow}px)`)
      }
      expect(offenders, `Routes overflowing at ${width}px`).toEqual([])
    })
  }

  test('mobile navigation opens as a drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/women')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Men' }).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })

  test('mobile filters open in a drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/women')
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
  })
})
