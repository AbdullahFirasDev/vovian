# Architecture

## Overview

```
 Browser (customer)                      Browser (staff)
 ┌──────────────────────┐                ┌──────────────────────┐
 │ Nuxt storefront (SSR) │                │ React admin (SPA)     │
 │ publishable key only  │                │ publishable key only  │
 └─────────┬────────────┘                └─────────┬────────────┘
           │ PostgREST RPC / tables (RLS)           │ PostgREST (RLS + has_permission)
           │ Edge Functions (create-order, contact) │ Edge Function (admin-staff)
           ▼                                        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │ Supabase                                                      │
 │  Postgres: schema, RLS, SECURITY DEFINER business functions   │
 │  Auth (customers + staff) · Storage (media bucket)            │
 │  Edge Functions (Deno): validation, rate limiting, payments,  │
 │  email, staff invites — the only holders of the service key   │
 │  Realtime: new orders + notifications → admin                 │
 └──────────────────────────────────────────────────────────────┘
```

React is the administration **interface**. Every business rule runs on the server, inside Postgres functions or Edge Functions.

## Where the business logic lives

| Concern | Implementation |
| --- | --- |
| Prices, discounts, shipping, tax | `private.compute_quote()` is the single source of truth. Exposed read-only as `quote_cart()` for display; reused by `place_order()` with stock rows locked. |
| Order creation | `create-order` edge function: Zod validation, caller identification, IP and email rate limits. It then calls `place_order()`, which handles idempotency (advisory lock + unique key), stock locking, decrement, order and item snapshots, discount usage, history, payment record, notifications and the audit log, all in one transaction. |
| Overselling | `inventory.on_hand >= 0` check, `SELECT … FOR UPDATE` in deterministic order, and a guarded decrement (`… where on_hand - reserved >= qty`). |
| Status changes | `public.order_transition_allowed()` mirrors `packages/shared/src/order-status.ts`. `private.apply_order_status()` restocks on cancel or return, releases discount usage, and marks COD orders as paid on delivery. |
| Permissions | `user_roles` → `role_permissions` → `has_permission()`, used by RLS policies and every admin RPC (`private.require_permission`). |
| Catalogue reads | `search_catalog()` (filters, facets, sort, pagination), `get_product()`, `product_card()`, `get_homepage()`, `get_store_config()`. All localised by `p_locale`. |
| Audit | `private.audit_row()` trigger on catalogue, content, settings, discount and role tables, plus explicit entries for order and payment actions. |
| Alerts | `private.inventory_alert()` notifies inventory staff when stock crosses a variant's threshold. |

## Data model highlights

- **Products → options → variants.** Options hold the ordered colour and size sets (with swatches and translations). Each colour × size variant has its own SKU, an optional price or sale override, an inventory row (created by trigger), and an `active` flag. Removed variants are soft-deleted so order history stays intact.
- **Images** can be scoped to a colour (`product_images.color`) or to explicit variants (`product_variant_images`). The storefront gallery follows the selected colour.
- **Translations** live in `translations jsonb` (`{"ar": {...}}`), so adding a language needs no schema change.
- **Orders** snapshot everything needed later: address, method names, item names, SKUs, unit prices, line discounts.
- **Settings** are keyed JSON (`store_settings`). Public keys are readable by the storefront; private keys need `settings.read`.

## Storefront

- SSR for every catalogue page, with route rules for SWR caching (no user-specific server markup; bag, wishlist and account state are client-only).
- URL-driven filters (`?colors=black&sizes=M&sort=price_asc`) so every view is linkable and crawlable.
- Pinia stores: `cart` (local persistence, account sync and merge on sign-in, authoritative server quote), `wishlist` (local and account), `ui`.
- Motion: a single GSAP entrance on the hero, clip-path reveals on editorial imagery only, and the Three.js campaign lens, lazy and hover-only. All of it is disabled under `prefers-reduced-motion`.
- i18n: `@nuxtjs/i18n` with `prefix_except_default` (`/ar/...`), `dir="rtl"`, IBM Plex Sans Arabic, and isolated Latin-digit prices.

## Admin

- Code-split routes, TanStack Query, and a permission-shaped navigation from `my_access()`. Unauthorised routes render a “no access” state; the database refuses the data regardless.
- Realtime subscription refreshes orders, the dashboard and notifications as orders arrive.
- Uploads go straight to Storage (`media/products|content|brand/...`). Storage policies check the same permissions.

## Payments

`supabase/functions/_shared/payments.ts` defines a provider registry. Cash on delivery and bank transfer ship today. An online provider plugs in by implementing `initiate()` (hosted session or redirect) plus a webhook that verifies the provider's signature before recording a payment. Nothing marks an order as paid without confirmation.
