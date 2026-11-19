# Security

## Principles

1. **Browsers hold only the publishable key.** The service role key exists only in the Edge Function runtime and in the one-off `admin:create` script run from a trusted shell.
2. **The database is the authority.** Every table has RLS. Staff access is granted per permission (`has_permission()`), not per app. The admin UI hides what a role can't use, but the database refuses it regardless.
3. **Money is computed on the server.** Clients send variant IDs and quantities. Prices, sale prices, discounts, shipping, tax and totals come from `private.compute_quote()`. Tests confirm that injected `price`/`total` fields are ignored.

## Controls

| Area | Control |
| --- | --- |
| Authentication | Supabase Auth (customers and staff share it; staff are identified by `user_roles`). Passwords need 10+ characters with a letter and a number; reset links are single-use. |
| Authorization | RLS on every public table; column-level grants on `profiles` (customers can't change `status` or `staff_notes`); no direct writes to orders, items, payments, inventory, movements, discount usage, roles or the audit log. These change only through SECURITY DEFINER functions with `set search_path = ''` and explicit permission checks. |
| Orders | Called only by the `create-order` function (`place_order` is granted to `service_role` only). Zod validation → rate limits (8/min/IP, 6/10 min/email) → idempotency key + advisory lock → stock row locks → atomic insert. |
| Inventory | `CHECK (on_hand >= 0)` and `CHECK (reserved <= on_hand)`; guarded decrements; adjustments require `inventory.write` and are logged. |
| Discounts | Validated on the server for dates, global and per-customer limits, minimums and scope. The global limit is re-checked with a guarded `UPDATE` to close races. |
| Rate limiting | `private.rate_limits` fixed windows for order creation, contact, newsletter and order tracking. |
| Uploads | Storage policies by folder and permission; MIME allow-list (JPEG, PNG, WebP, AVIF); 10 MB limit; random object names. |
| Content | CMS Markdown is rendered with raw HTML disabled; external links get `rel="noopener noreferrer"`. |
| CSV export | Cells starting with `= + - @` are prefixed to prevent spreadsheet formula injection. |
| Redirects | Login and registration accept only same-site relative paths. |
| Bots | Honeypot field on the contact form; rate limits. |
| Audit | Triggers record staff changes to catalogue, settings, content, discounts and roles; order and payment actions are logged explicitly. |
| Headers | Security headers on both apps (`vercel.json`); the admin is `noindex` and frame-denied. |

## Reporting

Send security issues privately to the store owner. Do not open public issues with exploit details.
