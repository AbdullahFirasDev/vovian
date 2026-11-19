-- =============================================================================
-- VOVIAN · 0400 · Commerce: addresses, carts, wishlists, shipping, discounts,
--                 orders, order items, status history, payments
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Iraqi governorates — reference data used by addresses, shipping zones and
-- checkout validation. Staff can pause delivery to a governorate (is_active).
-- ---------------------------------------------------------------------------
create table public.governorates (
  code         text primary key check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null,
  translations jsonb not null default '{}'::jsonb,
  region       text not null default 'federal' check (region in ('federal', 'kurdistan')),
  position     integer not null default 0,
  is_active    boolean not null default true
);

insert into public.governorates (code, name, translations, region, position) values
  ('baghdad',      'Baghdad',       '{"ar": {"name": "بغداد"}}',        'federal',    1),
  ('basra',        'Basra',         '{"ar": {"name": "البصرة"}}',       'federal',    2),
  ('nineveh',      'Nineveh',       '{"ar": {"name": "نينوى"}}',        'federal',    3),
  ('erbil',        'Erbil',         '{"ar": {"name": "أربيل"}}',        'kurdistan',  4),
  ('sulaymaniyah', 'Sulaymaniyah',  '{"ar": {"name": "السليمانية"}}',   'kurdistan',  5),
  ('duhok',        'Duhok',         '{"ar": {"name": "دهوك"}}',         'kurdistan',  6),
  ('halabja',      'Halabja',       '{"ar": {"name": "حلبجة"}}',        'kurdistan',  7),
  ('kirkuk',       'Kirkuk',        '{"ar": {"name": "كركوك"}}',        'federal',    8),
  ('najaf',        'Najaf',         '{"ar": {"name": "النجف"}}',        'federal',    9),
  ('karbala',      'Karbala',       '{"ar": {"name": "كربلاء"}}',       'federal',   10),
  ('babil',        'Babil',         '{"ar": {"name": "بابل"}}',         'federal',   11),
  ('anbar',        'Anbar',         '{"ar": {"name": "الأنبار"}}',      'federal',   12),
  ('diyala',       'Diyala',        '{"ar": {"name": "ديالى"}}',        'federal',   13),
  ('wasit',        'Wasit',         '{"ar": {"name": "واسط"}}',         'federal',   14),
  ('salahaddin',   'Salah al-Din',  '{"ar": {"name": "صلاح الدين"}}',   'federal',   15),
  ('dhi-qar',      'Dhi Qar',       '{"ar": {"name": "ذي قار"}}',       'federal',   16),
  ('maysan',       'Maysan',        '{"ar": {"name": "ميسان"}}',        'federal',   17),
  ('muthanna',     'Al-Muthanna',   '{"ar": {"name": "المثنى"}}',       'federal',   18),
  ('qadisiyyah',   'Al-Qadisiyyah', '{"ar": {"name": "القادسية"}}',     'federal',   19);

-- ---------------------------------------------------------------------------
-- Address book — Iraqi delivery format: governorate, area / neighbourhood and
-- the nearest landmark, with a primary and an optional backup phone.
-- ---------------------------------------------------------------------------
create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  label           text,
  full_name       text not null,
  phone           text not null check (phone ~ '^\+9647[0-9]{9}$'),
  phone_secondary text check (phone_secondary is null or phone_secondary ~ '^\+9647[0-9]{9}$'),
  governorate     text not null references public.governorates (code),
  area            text not null check (length(trim(area)) >= 2),
  landmark        text not null check (length(trim(landmark)) >= 3),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (phone_secondary is null or phone_secondary <> phone)
);

create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

create trigger addresses_updated_at before update on public.addresses
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Carts — persisted server-side for signed-in customers (guests persist locally
-- and merge on sign-in).
-- ---------------------------------------------------------------------------
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  discount_code text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger carts_updated_at before update on public.carts
  for each row execute function private.set_updated_at();

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_variant_idx on public.cart_items (variant_id);

create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Wishlists
-- ---------------------------------------------------------------------------
create table public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create index wishlist_items_product_idx on public.wishlist_items (product_id);

-- ---------------------------------------------------------------------------
-- Shipping
-- ---------------------------------------------------------------------------
create table public.shipping_zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  regions     text[] not null default '{}',   -- governorate codes; '*' = every other governorate
  is_active   boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index shipping_zones_regions_idx on public.shipping_zones using gin (regions);

create trigger shipping_zones_updated_at before update on public.shipping_zones
  for each row execute function private.set_updated_at();

create table public.shipping_methods (
  id           uuid primary key default gen_random_uuid(),
  zone_id      uuid not null references public.shipping_zones (id) on delete cascade,
  code         text not null,
  name         text not null,
  description  text,
  translations jsonb not null default '{}'::jsonb,
  rate         numeric(12, 2) not null check (rate >= 0),
  free_over    numeric(12, 2) check (free_over is null or free_over >= 0),
  min_days     integer not null default 2,
  max_days     integer not null default 5,
  is_active    boolean not null default true,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (zone_id, code),
  check (max_days >= min_days)
);

create trigger shipping_methods_updated_at before update on public.shipping_methods
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Discounts
-- ---------------------------------------------------------------------------
create table public.discount_codes (
  id                       uuid primary key default gen_random_uuid(),
  code                     extensions.citext not null unique,
  description              text,
  type                     public.discount_type not null,
  value                    numeric(12, 2) not null default 0 check (value >= 0),
  scope                    public.discount_scope not null default 'all',
  product_ids              uuid[] not null default '{}',
  category_ids             uuid[] not null default '{}',
  min_order_value          numeric(12, 2) check (min_order_value is null or min_order_value >= 0),
  usage_limit              integer check (usage_limit is null or usage_limit > 0),
  usage_limit_per_customer integer check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  times_used               integer not null default 0 check (times_used >= 0),
  starts_at                timestamptz,
  expires_at               timestamptz,
  is_active                boolean not null default true,
  created_by               uuid references auth.users (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (type <> 'percentage' or value <= 100),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create trigger discount_codes_updated_at before update on public.discount_codes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 100241;

create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  order_number          text not null unique default ('VV' || nextval('public.order_number_seq')::text),
  user_id               uuid references auth.users (id) on delete set null,
  email                 extensions.citext not null,
  phone                 text not null,
  phone_secondary       text,
  customer_name         text not null,
  shipping_address      jsonb not null,        -- snapshot: country, governorate (+ names), area, landmark
  delivery_instructions text,
  shipping_method_id    uuid references public.shipping_methods (id) on delete set null,
  shipping_method_name  text not null,
  payment_method        text not null,
  status                public.order_status not null default 'pending',
  payment_status        public.payment_status not null default 'unpaid',
  currency              text not null default 'USD',
  subtotal              numeric(12, 2) not null check (subtotal >= 0),
  discount_total        numeric(12, 2) not null default 0 check (discount_total >= 0),
  shipping_total        numeric(12, 2) not null default 0 check (shipping_total >= 0),
  tax_total             numeric(12, 2) not null default 0 check (tax_total >= 0),
  tax_inclusive         boolean not null default true,
  total                 numeric(12, 2) not null check (total >= 0),
  discount_code         text,
  locale                text not null default 'en',
  idempotency_key       text not null unique,
  access_token          uuid not null default gen_random_uuid(),
  tracking_number       text,
  tracking_url          text,
  placed_ip             text,
  confirmed_at          timestamptz,
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_email_idx on public.orders (email);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create index orders_search_trgm_idx on public.orders using gin ((order_number || ' ' || customer_name || ' ' || email::text) extensions.gin_trgm_ops);

create trigger orders_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  product_name  text not null,
  sku           text not null,
  color         text,
  size          text,
  image_url     text,
  unit_price    numeric(12, 2) not null check (unit_price >= 0),
  compare_at    numeric(12, 2),
  quantity      integer not null check (quantity > 0),
  discount_amount numeric(12, 2) not null default 0,
  line_total    numeric(12, 2) not null check (line_total >= 0),
  created_at    timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  note        text,
  is_customer_visible boolean not null default true,
  actor_id    uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- Internal staff notes on orders (never visible to customers)
create table public.order_notes (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  author_id   uuid references auth.users (id) on delete set null,
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index order_notes_order_idx on public.order_notes (order_id, created_at desc);

create table public.discount_usage (
  id           uuid primary key default gen_random_uuid(),
  discount_id  uuid not null references public.discount_codes (id) on delete cascade,
  order_id     uuid not null unique references public.orders (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  email        extensions.citext not null,
  amount       numeric(12, 2) not null,
  created_at   timestamptz not null default now()
);

create index discount_usage_discount_idx on public.discount_usage (discount_id, email);

-- ---------------------------------------------------------------------------
-- Payments — one order can have several payment records (e.g. a failed
-- attempt followed by a manual confirmation). Provider is pluggable.
-- ---------------------------------------------------------------------------
create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  provider     text not null,
  status       public.payment_record_status not null default 'pending',
  amount       numeric(12, 2) not null check (amount >= 0),
  currency     text not null,
  reference    text,
  provider_payload jsonb not null default '{}'::jsonb,
  recorded_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

create trigger payments_updated_at before update on public.payments
  for each row execute function private.set_updated_at();
