-- =============================================================================
-- VOVIAN · 0100 · Foundation: extensions, enums, shared trigger helpers
-- =============================================================================

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Private schema for internal helpers that must never be exposed through the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'super_admin',
  'store_manager',
  'product_manager',
  'order_manager',
  'inventory_manager',
  'content_manager'
);

create type public.department as enum ('women', 'men', 'unisex');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.option_kind as enum ('color', 'size', 'other');

create type public.order_status as enum (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
);

create type public.payment_status as enum (
  'unpaid', 'pending_confirmation', 'paid', 'partially_refunded', 'refunded', 'failed'
);

create type public.payment_record_status as enum ('pending', 'paid', 'failed', 'refunded');

create type public.discount_type as enum ('percentage', 'fixed', 'free_shipping');
create type public.discount_scope as enum ('all', 'products', 'categories');

create type public.inventory_reason as enum (
  'initial', 'order', 'cancellation', 'return', 'adjustment', 'restock', 'damage', 'correction'
);

create type public.customer_status as enum ('active', 'vip', 'blocked');

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Slug helper (used by admin + seed)
-- ---------------------------------------------------------------------------
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'));
$$;
