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

- **Auth › URL configuration:** set the Site URL to `https://vovian.vercel.app` and add the redirect URL `https://vovian.vercel.app/**` (plus `http://localhost:3000/**` and `http://localhost:5173/**` for local development).
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

## 2. Vercel: storefront + admin as one project (Vercel Services)

The root `vercel.json` deploys both apps to one Vercel project:

| Path | Service | Notes |
| --- | --- | --- |
| `/admin/*` | `apps/admin` (Vite SPA) | Built with base `/admin/` into `dist/admin`; deep links fall back to `index.html`; `noindex` + frame-deny headers |
| everything else | `apps/storefront` (Nuxt SSR) | Server-rendered, SWR caching per `routeRules` |

Both services install from the monorepo root (`cd ../.. && npm ci`) because they share `packages/*`. `.vercelignore` keeps local `.env` files out of uploads.

```bash
npx vercel link --project vovian
npx vercel deploy          # preview (protected by Vercel Authentication)
npx vercel deploy --prod   # production
```

Environment variables (Production and Preview):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_KEY` / `VITE_SUPABASE_KEY` | publishable key (public by design; `VITE_` one is type *config*) |
| `NUXT_PUBLIC_SITE_URL` | `https://vovian.vercel.app` (canonical URLs, sitemap, auth redirects) |
| `NUXT_PUBLIC_IMAGE_TRANSFORMS` | `true` only with Supabase image transformations |

The service role key, database password and access token are **not** needed on Vercel.

After the first production deploy, update the edge function secrets so checkout is allowed from the new origin:
`ALLOWED_ORIGINS=https://vovian.vercel.app`, `STOREFRONT_URL=https://vovian.vercel.app`, `ADMIN_URL=https://vovian.vercel.app/admin`.

**Self-hosted alternative:** `docker build -f apps/storefront/Dockerfile --build-arg NUXT_PUBLIC_SITE_URL=https://www.yourbrand.com -t vovian-storefront .` for the storefront; the admin build (`apps/admin/dist`, served under `/admin/`) works on any static host that rewrites `/admin/*` to `/admin/index.html`.

## Checklist before launch

- [ ] Custom SMTP configured; Auth email templates branded
- [ ] `ALLOWED_ORIGINS`, `STOREFRONT_URL`, `ADMIN_URL` secrets set for functions
- [ ] `RESEND_API_KEY` (or swap `_shared/notify.ts` for your provider)
- [ ] Store settings, shipping zones, tax rates and payment instructions reviewed in the admin
- [ ] Demo seed **not** applied; the first super admin created with `admin:create`
- [ ] `NUXT_PUBLIC_SITE_URL` set (affects canonical URLs and the sitemap)
- [ ] Sitemap submitted: `https://www.yourbrand.com/sitemap.xml`
- [ ] Backups / PITR enabled on the Supabase project
