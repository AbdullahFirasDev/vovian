# Testing

| Suite | Command | Count | Covers |
| --- | --- | --- | --- |
| Unit (Vitest) | `npm test` | 40 | Pricing mirror of `variant_unit_price`, rounding, inclusive tax, discount allocation, order-status machine, permissions by role, money and size formatting, error-code mapping, checkout and admin Zod schemas, CSV escaping, non-RFC-4122 ids accepted, Iraqi phone normalisation (07…, +964, Arabic-Indic digits), required area and landmark, backup phone must differ, IQD formatting, and the edge-function schema copy staying identical to the canonical one |
| Database (pgTAP) | `npm run test:db` | 62 | **RLS** for anonymous visitors, customers and four staff roles. **Pricing (IQD)**: subtotal, delivery by governorate (Baghdad, Kurdistan Region, other governorates) and free-delivery thresholds, no VAT, injected prices ignored, every discount type, minimums, expiry, category scope, sale prices, stock issues. **Orders**: server totals, phone normalisation and backup phone, address snapshot with nearest landmark, paused governorates refused, stock decrement and movement log, idempotency, oversell rejection, non-negative stock, per-customer discount limit, transition rules, permission-checked admin RPCs, discount release on cancel |
| End-to-end (Playwright) | `npm run test:e2e` | 22 | Homepage; catalogue colour filter, URL state and price sort; search suggestions; product colour switching and size requirement; structured data; **guest cash-on-delivery checkout with governorate, area, nearest landmark and backup phone**; non-Iraqi phone rejected; discount apply and reject; Arabic RTL and translated products; customer sign-in and order history; guarded account routes; order tracking. **Responsive**: no horizontal overflow on 11 routes at 320, 390, 768, 1280, 1440 and 1920 px; mobile menu and filter drawers |

## Running end-to-end tests locally

```bash
npm run db:start && npx supabase functions serve   # backend
npm run dev:store                                  # or a production build on :3000
cd apps/storefront && npx playwright install chromium
npm run test:e2e -- --project=desktop
```

Each checkout run creates a real order in the local database. Run `npm run db:reset` to start clean.
