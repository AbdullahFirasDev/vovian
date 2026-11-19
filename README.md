# VOVIAN

Premium fashion e-commerce for women and men: an editorial **Nuxt** storefront, a separate **React** administration app, and a **Supabase** backend (Postgres + RLS, Auth, Storage, Edge Functions).

```
vovian/
├─ apps/
│  ├─ storefront/      Nuxt 4 · Vue 3 · Tailwind 4 · Pinia · GSAP · Three.js · Nuxt Image · i18n (EN/AR)
│  └─ admin/           React 19 · Vite 8 · React Router 8 · TanStack Query · Tailwind 4 · Recharts
├─ packages/
│  ├─ shared/          Pricing, order-status machine, permissions, formatting, error messages
│  ├─ types/           Generated database types + domain read models
│  └─ validation/      Zod schemas (checkout, accounts, admin forms)
├─ supabase/
│  ├─ migrations/      Schema, RLS, business logic (11 migrations)
│  ├─ functions/       create-order · contact · admin-staff (+ _shared)
│  ├─ seed/            Settings, 51-product catalogue, content, demo accounts & orders
│  └─ tests/           pgTAP: RLS, pricing, orders
├─ scripts/            Seed generator, schema sync, admin bootstrap
└─ docs/               Architecture, deployment, design system, security, testing
```

## Quick start (local)

Requirements: Node 22+ (24 recommended), Docker Desktop running.

```bash
npm install                      # all workspaces
npm run db:start                 # Supabase: applies migrations + seed (first run pulls images)
npx supabase functions serve     # edge functions (separate terminal)

cp apps/storefront/.env.example apps/storefront/.env   # paste the publishable key from `npx supabase status`
cp apps/admin/.env.example apps/admin/.env

npm run dev:store                # http://localhost:3000
npm run dev:admin                # http://localhost:5173
```

### Demo accounts (local seed only)

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@vovian.local` | `Vovian!Admin2026` |
| Store manager | `manager@vovian.local` | `Vovian!Admin2026` |
| Product manager | `products@vovian.local` | `Vovian!Admin2026` |
| Order manager | `orders@vovian.local` | `Vovian!Admin2026` |
| Inventory manager | `inventory@vovian.local` | `Vovian!Admin2026` |
| Content manager | `content@vovian.local` | `Vovian!Admin2026` |
| Customer | `zahraa@example.com` (and 11 others across Iraqi governorates) | `Customer!2026` |

Discount codes: `WELCOME10` (10%, once per customer), `VOVIAN50` (IQD 50,000 off over IQD 400,000), `FREESHIP` (free delivery over IQD 100,000), `KNIT20` (knitwear only), `SUMMER25` (expired).

**Iraq setup:** prices in Iraqi dinars (IQD), no VAT, delivery to all 19 governorates (Baghdad IQD 5,000 or same-day IQD 10,000; Kurdistan Region IQD 8,000; other governorates IQD 7,000), cash on delivery or ZainCash / bank transfer. Checkout asks for governorate, area or neighbourhood, nearest landmark, an Iraqi mobile number and an optional backup number; numbers are stored as `+9647XXXXXXXXX` whatever format the customer types (including Arabic-Indic digits).

Supabase Studio runs at http://localhost:54323, and Auth emails are captured in Mailpit at http://localhost:54324.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (pricing, transitions, permissions, validation, CSV) |
| `npm run test:db` | pgTAP database tests (RLS, pricing, inventory, orders) |
| `npm run test:e2e` | Playwright: checkout, discounts, filters, variants, i18n, accounts, responsive |
| `npm run db:reset` | Rebuild the local database from migrations + seed |
| `npm run db:types` | Regenerate `packages/types/src/database.ts` |
| `npm run seed:generate` | Rebuild `supabase/seed/02_catalog.sql` from `catalog.data.mjs` |
| `npm run sync:functions` | Copy the canonical checkout schema into the edge functions |
| `npm run build` | Production builds of both apps |
| `npm run admin:create -- <email> "Name"` | Create or promote a super admin (any environment) |

## Documentation

- [Architecture](docs/ARCHITECTURE.md): how the pieces fit together and where business logic lives
- [Deployment](docs/DEPLOYMENT.md): Supabase, storefront and admin in production
- [Design system](docs/DESIGN.md): tokens, typography, components and motion
- [Security](docs/SECURITY.md): authentication, RLS, server-side pricing, rate limits
- [Testing](docs/TESTING.md): what each suite covers and how to run it
