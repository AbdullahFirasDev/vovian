# Deployment

Three deployables: **Supabase** (database, auth, storage, functions), the **storefront** (Node/Nitro server), and the **admin** (static SPA). Nothing in this repo deploys automatically.

## 1. Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push                        # applies supabase/migrations (seeds are NOT applied)
npm run sync:functions                      # copy the canonical checkout schema
npx supabase functions deploy create-order
npx supabase functions deploy contact
npx supabase functions deploy admin-staff
npx supabase secrets set --env-file supabase/functions/.env   # see supabase/functions/.env.example
```

Dashboard settings:

- **Auth › URL configuration:** set the Site URL to the storefront and add redirect URLs for `https://www.yourbrand.com/**` and `https://admin.yourbrand.com/**`.
- **Auth › Email:** configure a custom SMTP provider. The built-in sender is rate-limited.
- **Database › Replication:** the migrations add `orders` and `notifications` to `supabase_realtime`. Confirm Realtime is enabled.
- **Storage:** the `media` bucket is created by migration (public read; uploads restricted by permission, MIME type and 10 MB).
- **Image transformations** (Pro plan): set `NUXT_PUBLIC_IMAGE_TRANSFORMS=true` on the storefront to serve resized uploads.

Production data: create categories, products and content in the admin. Run the demo seed (`supabase/seed/04_demo_accounts_orders.sql`) **only** against local or staging databases.

### First administrator

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
ADMIN_URL=https://admin.yourbrand.com \
npm run admin:create -- owner@yourbrand.com "Owner Name"
```

The owner receives an invitation to set a password. Further staff are invited from **Admin › Staff & roles**.

## 2. Storefront (Nuxt)

**Vercel:** create a project with root directory `apps/storefront` (`vercel.json` installs from the monorepo root). Environment variables:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_KEY` | publishable (anon) key |
| `NUXT_PUBLIC_SITE_URL` | `https://www.yourbrand.com` (canonical URLs, sitemap, auth redirects) |
| `NUXT_PUBLIC_FUNCTIONS_URL` | optional; defaults to `$SUPABASE_URL/functions/v1` |
| `NUXT_PUBLIC_IMAGE_TRANSFORMS` | `true` only with Supabase image transformations |

**Self-hosted:** `docker build -f apps/storefront/Dockerfile --build-arg NUXT_PUBLIC_SITE_URL=https://www.yourbrand.com -t vovian-storefront .` then run it with the variables above (port 3000).

## 3. Admin (React)

A static build (`apps/admin/dist`) works on any static host. Unknown paths must rewrite to `index.html`; `apps/admin/vercel.json` does this and adds `noindex`, frame-deny and security headers.

| Variable (build time) | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_KEY` | publishable (anon) key |
| `VITE_STOREFRONT_URL` | `https://www.yourbrand.com` |

Put the admin on its own subdomain and, ideally, behind SSO or IP allow-listing at the edge. Data access is enforced by the database either way.

## Checklist before launch

- [ ] Custom SMTP configured; Auth email templates branded
- [ ] `ALLOWED_ORIGINS`, `STOREFRONT_URL`, `ADMIN_URL` secrets set for functions
- [ ] `RESEND_API_KEY` (or swap `_shared/notify.ts` for your provider)
- [ ] Store settings, shipping zones, tax rates and payment instructions reviewed in the admin
- [ ] Demo seed **not** applied; the first super admin created with `admin:create`
- [ ] `NUXT_PUBLIC_SITE_URL` set (affects canonical URLs and the sitemap)
- [ ] Sitemap submitted: `https://www.yourbrand.com/sitemap.xml`
- [ ] Backups / PITR enabled on the Supabase project
