-- =============================================================================
-- VOVIAN · 0500 · Content & platform: homepage, pages, menus, settings,
--                 newsletter, contact, notifications, audit log, rate limits
-- =============================================================================

create table public.homepage_banners (
  id            uuid primary key default gen_random_uuid(),
  placement     text not null default 'hero' check (placement in ('hero', 'campaign', 'promo_strip')),
  title         text not null,
  subtitle      text,
  body          text,
  translations  jsonb not null default '{}'::jsonb,
  image_url     text,
  image_url_secondary text,
  mobile_image_url text,
  cta_label     text,
  cta_href      text,
  cta_secondary_label text,
  cta_secondary_href  text,
  is_active     boolean not null default true,
  position      integer not null default 0,
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index homepage_banners_placement_idx on public.homepage_banners (placement, position) where is_active;

create trigger homepage_banners_updated_at before update on public.homepage_banners
  for each row execute function private.set_updated_at();

-- Ordered, typed homepage sections. `config` shape depends on `type`.
create table public.homepage_sections (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in (
                  'hero', 'editorial_intro', 'categories', 'featured_collections',
                  'new_arrivals', 'campaign', 'best_sellers', 'philosophy', 'newsletter')),
  title         text,
  subtitle      text,
  body          text,
  translations  jsonb not null default '{}'::jsonb,
  config        jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index homepage_sections_position_idx on public.homepage_sections (position) where is_active;

create trigger homepage_sections_updated_at before update on public.homepage_sections
  for each row execute function private.set_updated_at();

-- Static pages (About, policies, FAQ…). Body is sanitised Markdown.
create table public.pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  summary         text,
  body            text not null default '',
  translations    jsonb not null default '{}'::jsonb,
  is_published    boolean not null default true,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger pages_updated_at before update on public.pages
  for each row execute function private.set_updated_at();

-- Navigation menus: `items` is an ordered tree
--   [{ "label": "Women", "href": "/women", "translations": {"ar": {"label": "نساء"}}, "children": [...] }]
create table public.navigation_menus (
  id          uuid primary key default gen_random_uuid(),
  handle      text not null unique,   -- 'main', 'footer-shop', 'footer-help', ...
  name        text not null,
  items       jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger navigation_menus_updated_at before update on public.navigation_menus
  for each row execute function private.set_updated_at();

-- Key/value store settings. Public keys are readable by the storefront.
create table public.store_settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function private.set_updated_at();

create table public.newsletter_subscribers (
  id             uuid primary key default gen_random_uuid(),
  email          extensions.citext not null unique,
  locale         text not null default 'en',
  source         text not null default 'footer',
  is_subscribed  boolean not null default true,
  user_id        uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index newsletter_subscribers_created_idx on public.newsletter_subscribers (created_at desc);

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       extensions.citext not null,
  order_number text,
  topic       text not null default 'general',
  message     text not null check (length(message) between 2 and 5000),
  is_resolved boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Staff + customer notifications (order placed, low stock, status updates…)
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  audience    text not null check (audience in ('staff', 'customer')),
  user_id     uuid references auth.users (id) on delete cascade,  -- null for staff broadcast
  permission  text,                                              -- staff broadcast filter
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_staff_idx on public.notifications (audience, created_at desc);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Append-only audit log
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,          -- INSERT / UPDATE / DELETE / custom verb
  entity      text not null,
  entity_id   text,
  changes     jsonb,
  created_at  timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- Fixed-window rate limiting counters (written only by SECURITY DEFINER code)
create table private.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);
