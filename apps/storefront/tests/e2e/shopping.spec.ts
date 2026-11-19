import { expect, test, type Page } from '@playwright/test'
import { visit } from './helpers'

async function addProductToBag(page: Page, slug: string, size?: string) {
  await visit(page, `/products/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Stock changes as tests place real orders, so pick the first size still in stock.
  if (size) await page.locator('#size-picker label:has(input:not([disabled]))').first().click()
  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByRole('dialog', { name: 'Bag' })).toBeVisible()
}

test.describe('Homepage', () => {
  test('renders the editorial hero, both destinations and no horizontal overflow', async ({ page }) => {
    await visit(page, '/')
    await expect(page.locator('section.hero')).toBeVisible()
    await expect(page.getByRole('link', { name: /Women\s+Shop women/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Men\s+Shop men/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'New arrivals' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
  })
})

test.describe('Catalogue', () => {
  test('filters by colour using database facets and reflects them in the URL', async ({ page }) => {
    await visit(page, '/men')
    const count = page.getByText(/\d+ pieces/).first()
    const before = await count.textContent()
    await page.getByRole('button', { name: 'Black', pressed: false }).first().click()
    await expect(page).toHaveURL(/colors=black/)
    await expect(count).not.toHaveText(before ?? '')
    await expect(page.getByRole('button', { name: /Remove filter Black/ })).toBeVisible()
  })

  test('sorts by price ascending', async ({ page }) => {
    await visit(page, '/women?sort=price_asc')
    const prices = await page.locator('article [data-price]').allTextContents()
    const values = prices.slice(0, 6).map((p) => Number(p.replace(/[^0-9.]/g, '')))
    expect(values).toEqual([...values].sort((a, b) => a - b))
  })

  test('search suggestions find products', async ({ page }) => {
    await visit(page, '/')
    await page.getByRole('button', { name: 'Search' }).first().click()
    await page.getByRole('searchbox').fill('coat')
    await expect(page.getByRole('dialog', { name: 'Search' }).getByRole('link', { name: /Belted Wool Coat/ })).toBeVisible()
  })
})

test.describe('Product page', () => {
  test('switching colour swaps the gallery and requires a size before adding', async ({ page }) => {
    await visit(page, '/products/leather-biker-jacket')
    const firstImage = page.locator('ul.lg\\:grid img').first()
    const blackSrc = await firstImage.getAttribute('src')
    await page.getByRole('button', { name: 'Cognac' }).click()
    await expect(page).toHaveURL(/color=Cognac/)
    await expect(firstImage).not.toHaveAttribute('src', blackSrc ?? '')

    await page.getByRole('button', { name: 'Add to bag' }).click()
    await expect(page.getByText('Choose a size to add this piece to your bag.')).toBeVisible()
  })

  test('has Product structured data', async ({ page }) => {
    await visit(page, '/products/belted-wool-coat')
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(ld.some((s) => s.includes('"@type":"Product"'))).toBe(true)
  })
})

test.describe('Checkout', () => {
  test('guest can place a cash-on-delivery order end to end', async ({ page }) => {
    await addProductToBag(page, 'essential-crew-tee', 'any')
    await page.getByRole('link', { name: 'Checkout' }).click()
    await expect(page).toHaveURL(/\/checkout/)

    await page.getByLabel('Email').fill(`e2e+${Date.now()}@example.com`)
    await page.getByLabel('Full name').fill('حيدر الكاظمي')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Iraqi delivery details: governorate, area, nearest landmark, phone + optional backup
    await page.getByRole('combobox', { name: 'Governorate' }).selectOption('baghdad')
    await page.getByRole('textbox', { name: 'Area or neighbourhood' }).fill('الكرادة')
    await page.getByRole('textbox', { name: 'Nearest landmark' }).fill('قرب ساحة كهرمانة')
    await page.getByRole('textbox', { name: 'Phone number', exact: true }).fill('0770 123 4567')
    await page.getByRole('textbox', { name: /Backup phone number/ }).fill('0770 123 4567')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Use a different number from your main phone.')).toBeVisible()
    await page.getByRole('textbox', { name: /Backup phone number/ }).fill('0780 765 4321')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('radio', { name: /Standard delivery/ })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByText('Cash on delivery').click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByTestId('place-order').click()
    await expect(page).toHaveURL(/\/order\/VV\d+\?token=/, { timeout: 30_000 })
    await expect(page.getByTestId('order-number')).toHaveText(/^VV\d+$/)
    await expect(page.getByText('Essential Crew Tee')).toBeVisible()
    await expect(page.getByText('قرب ساحة كهرمانة')).toBeVisible()
    await expect(page.getByText('+9647701234567 · +9647807654321')).toBeVisible()
  })

  test('rejects a non-Iraqi phone number at the delivery step', async ({ page }) => {
    await addProductToBag(page, 'essential-crew-tee', 'any')
    await visit(page, '/checkout')
    await page.getByLabel('Email').fill('e2e-phone@example.com')
    await page.getByLabel('Full name').fill('Test Customer')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('textbox', { name: 'Area or neighbourhood' }).fill('المنصور')
    await page.getByRole('textbox', { name: 'Nearest landmark' }).fill('قرب جامع أم الطبول')
    await page.getByRole('textbox', { name: 'Phone number', exact: true }).fill('+971 50 123 4567')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Enter an Iraqi mobile number, e.g. 0770 123 4567.')).toBeVisible()
  })

  test('applies a valid discount code and rejects an expired one', async ({ page }) => {
    await addProductToBag(page, 'belted-wool-coat', 'any')
    await visit(page, '/cart')
    await page.getByRole('button', { name: 'Discount code' }).click()
    await page.getByTestId('discount-input').fill('SUMMER25')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('This code has expired.')).toBeVisible()

    await page.getByTestId('discount-input').fill('WELCOME10')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('WELCOME10 applied')).toBeVisible()
    await expect(page.getByText('−IQD 76,500')).toBeVisible() // 10% of IQD 765,000, computed server-side
    await expect(page.getByText('Delivery (estimate)')).toBeVisible() // summary always shows the delivery line
  })
})

test.describe('Internationalisation', () => {
  test('Arabic renders right-to-left with translated navigation', async ({ page }) => {
    await visit(page, '/ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByRole('link', { name: 'وصل حديثاً' }).first()).toBeVisible()
  })

  test('product names are translated', async ({ page }) => {
    await visit(page, '/ar/products/leather-biker-jacket')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('جاكيت جلد بايكر')
  })
})

test.describe('Accounts', () => {
  test('a customer can sign in and see their order history', async ({ page }) => {
    await visit(page, '/login')
    await page.getByLabel('Email').fill('zahraa@example.com')
    await page.getByLabel('Password').fill('Customer!2026')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/account/)
    await visit(page, '/account/orders')
    await expect(page.locator('a[href*="/account/orders/VV"]').first()).toBeVisible()
  })

  test('account pages redirect guests to sign in', async ({ page }) => {
    await visit(page, '/account/orders')
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })
})

test.describe('Track order', () => {
  test('rejects unknown order numbers', async ({ page }) => {
    await visit(page, '/track-order')
    await page.getByLabel('Order number').fill('VV999999')
    await page.getByLabel('Email or phone number').fill('0770 000 9999')
    await page.getByRole('button', { name: 'Track order' }).click()
    await expect(page.getByText(/couldn't find an order/)).toBeVisible()
  })
})
