-- =============================================================================
-- VOVIAN · 0300 · Catalog: categories, collections, products, variants, images,
--                 inventory & movements, reviews
--
-- Translations: base columns hold English; `translations` holds other locales:
--   { "ar": { "name": "...", "description": "...", ... } }
-- New languages need no schema change.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categories (hierarchical, per department)
-- ---------------------------------------------------------------------------
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.categories (id) on delete set null,
  department    public.department not null,
  slug          text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null,
  description   text,
  translations  jsonb not null default '{}'::jsonb,
  image_url     text,
  position      integer not null default 0,
  is_active     boolean not null default true,
  seo_title     text,
  seo_description text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (department, slug)
);

create index categories_department_idx on public.categories (department, position) where deleted_at is null;
create index categories_parent_idx on public.categories (parent_id);

create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Collections (editorial groupings)
-- ---------------------------------------------------------------------------
create table public.collections (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  subtitle        text,
  description     text,
  translations    jsonb not null default '{}'::jsonb,
  cover_image_url text,
  hero_image_url  text,
  gallery         jsonb not null default '[]'::jsonb, -- [{ "url": "...", "alt": "..." }]
  is_featured     boolean not null default false,
  is_active       boolean not null default true,
  position        integer not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  seo_title       text,
  seo_description text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index collections_featured_idx on public.collections (is_featured, position) where deleted_at is null;

create trigger collections_updated_at before update on public.collections
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  style_code      text not null unique,             -- base SKU / style number
  name            text not null,
  description     text,
  material        text,
  care            text,
  fit             text,
  details         jsonb not null default '[]'::jsonb, -- ["Relaxed fit", "Horn buttons"]
  translations    jsonb not null default '{}'::jsonb,
  brand           text not null default 'VOVIAN',
  department      public.department not null,
  category_id     uuid references public.categories (id) on delete set null,
  price           numeric(12, 2) not null check (price >= 0),
  sale_price      numeric(12, 2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  status          public.product_status not null default 'draft',
  is_featured     boolean not null default false,
  is_new_arrival  boolean not null default false,
  is_best_seller  boolean not null default false,
  sales_count     integer not null default 0 check (sales_count >= 0),
  size_guide      text not null default 'apparel' check (size_guide in ('apparel', 'denim', 'shoes', 'none')),
  tags            text[] not null default '{}',
  search_text     text not null default '',
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  created_by      uuid references auth.users (id) on delete set null,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_listing_idx on public.products (status, department, category_id) where deleted_at is null;
create index products_published_idx on public.products (published_at desc) where deleted_at is null;
create index products_sales_idx on public.products (sales_count desc) where deleted_at is null;
create index products_flags_idx on public.products (is_new_arrival, is_best_seller, is_featured) where deleted_at is null;
create index products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);
create index products_tags_idx on public.products using gin (tags);

create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();

create or replace function private.products_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_trans text := '';
  v_locale text;
begin
  for v_locale in select jsonb_object_keys(coalesce(new.translations, '{}'::jsonb)) loop
    v_trans := v_trans || ' ' || coalesce(new.translations -> v_locale ->> 'name', '');
  end loop;
  new.search_text := lower(extensions.unaccent(
    coalesce(new.name, '') || ' ' || coalesce(new.style_code, '') || ' ' ||
    coalesce(new.material, '') || ' ' || array_to_string(coalesce(new.tags, '{}'), ' ') || v_trans
  ));
  if new.status = 'active' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger products_search_text before insert or update on public.products
  for each row execute function private.products_search_text();

create table public.product_collections (
  product_id    uuid not null references public.products (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  position      integer not null default 0,
  primary key (product_id, collection_id)
);

create index product_collections_collection_idx on public.product_collections (collection_id, position);

-- ---------------------------------------------------------------------------
-- Product options — the ordered set of colors / sizes a product offers.
-- ---------------------------------------------------------------------------
create table public.product_options (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  kind         public.option_kind not null,
  value        text not null,
  translations jsonb not null default '{}'::jsonb,  -- { "ar": { "label": "أسود" } }
  swatch_hex   text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position     integer not null default 0,
  unique (product_id, kind, value)
);

create index product_options_product_idx on public.product_options (product_id, kind, position);

-- ---------------------------------------------------------------------------
-- Variants — each color × size has its own SKU, optional price, inventory.
-- ---------------------------------------------------------------------------
create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  sku         text not null unique,
  color       text,
  size        text,
  price       numeric(12, 2) check (price is null or price >= 0),
  sale_price  numeric(12, 2) check (sale_price is null or sale_price >= 0),
  barcode     text,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  position    integer not null default 0,
  is_active   boolean not null default true,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique nulls not distinct (product_id, color, size)
);

create index product_variants_product_idx on public.product_variants (product_id, position) where deleted_at is null;
create index product_variants_color_idx on public.product_variants (lower(color));
create index product_variants_size_idx on public.product_variants (size);

create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Images. `color` scopes an image to every variant of that colour; the
-- product_variant_images join allows explicit per-variant imagery.
-- ---------------------------------------------------------------------------
create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text,
  color        text,
  width        integer,
  height       integer,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

create table public.product_variant_images (
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  image_id   uuid not null references public.product_images (id) on delete cascade,
  position   integer not null default 0,
  primary key (variant_id, image_id)
);

create index product_variant_images_image_idx on public.product_variant_images (image_id);

-- ---------------------------------------------------------------------------
-- Inventory — one row per variant. Quantities can never go negative, which
-- (combined with row locks in place_order) makes overselling impossible.
-- ---------------------------------------------------------------------------
create table public.inventory (
  variant_id          uuid primary key references public.product_variants (id) on delete cascade,
  on_hand             integer not null default 0 check (on_hand >= 0),
  reserved            integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_at          timestamptz not null default now(),
  check (reserved <= on_hand)
);

create index inventory_low_stock_idx on public.inventory ((on_hand - reserved));

create trigger inventory_updated_at before update on public.inventory
  for each row execute function private.set_updated_at();

create or replace function private.create_inventory_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inventory (variant_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger product_variants_inventory after insert on public.product_variants
  for each row execute function private.create_inventory_row();

create table public.inventory_movements (
  id             bigint generated always as identity primary key,
  variant_id     uuid not null references public.product_variants (id) on delete cascade,
  delta          integer not null,
  quantity_after integer not null,
  reason         public.inventory_reason not null,
  reference_type text,
  reference_id   uuid,
  note           text,
  actor_id       uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_created_idx on public.inventory_movements (created_at desc);

-- ---------------------------------------------------------------------------
-- Reviews (moderated)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  author_name  text not null,
  rating       smallint not null check (rating between 1 and 5),
  title        text,
  body         text,
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_idx on public.reviews (product_id, created_at desc) where is_approved;

-- ---------------------------------------------------------------------------
-- Pricing helper: the single definition of a variant's effective unit price.
--   variant price overrides product price; a sale price applies only when it
--   is lower than the base price it belongs to.
-- ---------------------------------------------------------------------------
create or replace function public.variant_unit_price(
  p_product_price numeric, p_product_sale numeric,
  p_variant_price numeric, p_variant_sale numeric
)
returns table (unit_price numeric, compare_at numeric)
language sql
immutable
set search_path = ''
as $$
  with base as (
    select
      coalesce(p_variant_price, p_product_price) as base_price,
      case
        when p_variant_sale is not null then p_variant_sale
        when p_variant_price is null then p_product_sale
        else null
      end as sale
  )
  select
    case when sale is not null and sale < base_price then sale else base_price end,
    case when sale is not null and sale < base_price then base_price else null end
  from base;
$$;
