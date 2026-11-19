-- =============================================================================
-- VOVIAN · 0200 · Identity, profiles, roles & permissions (RBAC)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           extensions.citext not null,
  full_name       text,
  phone           text,
  avatar_url      text,
  locale          text not null default 'en' check (locale in ('en', 'ar')),
  marketing_opt_in boolean not null default false,
  -- Staff-managed fields (writable only through admin RPCs, see column grants below)
  status          public.customer_status not null default 'active',
  staff_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);
create index profiles_created_at_idx on public.profiles (created_at desc);
create index profiles_name_trgm_idx on public.profiles using gin (full_name extensions.gin_trgm_ops);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile automatically on sign-up.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, locale)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'locale' = 'ar' then 'ar' else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Keep profile email in sync when the auth email changes.
create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Permissions catalogue
-- ---------------------------------------------------------------------------
create table public.permissions (
  code        text primary key,
  description text not null,
  module      text not null
);

create table public.role_permissions (
  role       public.app_role not null,
  permission text not null references public.permissions (code) on delete cascade,
  primary key (role, permission)
);

create table public.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role);

insert into public.permissions (code, module, description) values
  ('dashboard.view',   'dashboard', 'View the dashboard overview and reports'),
  ('products.read',    'catalog',   'View products, categories and collections'),
  ('products.write',   'catalog',   'Create and edit products, variants, categories and collections'),
  ('products.delete',  'catalog',   'Delete or archive products'),
  ('inventory.read',   'inventory', 'View stock levels and movement history'),
  ('inventory.write',  'inventory', 'Adjust stock levels'),
  ('orders.read',      'orders',    'View orders'),
  ('orders.write',     'orders',    'Update order status, payments and notes'),
  ('customers.read',   'customers', 'View customer profiles and purchase history'),
  ('customers.write',  'customers', 'Edit customer status and notes'),
  ('discounts.read',   'promotions','View discount codes'),
  ('discounts.write',  'promotions','Create and edit discount codes'),
  ('content.read',     'content',   'View homepage content, pages and menus'),
  ('content.write',    'content',   'Edit homepage content, pages, menus and subscribers'),
  ('settings.read',    'settings',  'View store settings'),
  ('settings.write',   'settings',  'Edit store settings, shipping and payment methods'),
  ('staff.manage',     'staff',     'Invite staff and assign roles'),
  ('audit.read',       'staff',     'View the audit log');

-- Super admin: everything.
insert into public.role_permissions (role, permission)
select 'super_admin', code from public.permissions;

-- Store manager: everything except staff management.
insert into public.role_permissions (role, permission)
select 'store_manager', code from public.permissions where code <> 'staff.manage';

insert into public.role_permissions (role, permission) values
  ('product_manager', 'dashboard.view'),
  ('product_manager', 'products.read'),
  ('product_manager', 'products.write'),
  ('product_manager', 'products.delete'),
  ('product_manager', 'inventory.read'),
  ('product_manager', 'discounts.read'),
  ('product_manager', 'content.read'),

  ('order_manager', 'dashboard.view'),
  ('order_manager', 'orders.read'),
  ('order_manager', 'orders.write'),
  ('order_manager', 'customers.read'),
  ('order_manager', 'customers.write'),
  ('order_manager', 'products.read'),
  ('order_manager', 'inventory.read'),
  ('order_manager', 'discounts.read'),

  ('inventory_manager', 'dashboard.view'),
  ('inventory_manager', 'inventory.read'),
  ('inventory_manager', 'inventory.write'),
  ('inventory_manager', 'products.read'),
  ('inventory_manager', 'orders.read'),

  ('content_manager', 'dashboard.view'),
  ('content_manager', 'content.read'),
  ('content_manager', 'content.write'),
  ('content_manager', 'products.read'),
  ('content_manager', 'discounts.read');

-- ---------------------------------------------------------------------------
-- Authorization helpers — SECURITY DEFINER so RLS policies can call them
-- without recursive policy evaluation on user_roles.
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = (select auth.uid())
      and rp.permission = p_permission
  );
$$;

create or replace function public.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = p_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()));
$$;

-- Returns the caller's roles + effective permissions (used by the admin app to shape its UI;
-- the database still enforces every permission independently).
create or replace function public.my_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', (select auth.uid()),
    'roles', coalesce((select jsonb_agg(distinct ur.role) from public.user_roles ur where ur.user_id = (select auth.uid())), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(distinct rp.permission)
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      where ur.user_id = (select auth.uid())
    ), '[]'::jsonb)
  );
$$;

-- Throws if the caller lacks a permission. Used inside admin RPCs.
create or replace function private.require_permission(p_permission text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission(p_permission) then
    raise exception 'FORBIDDEN: missing permission %', p_permission using errcode = '42501';
  end if;
end;
$$;

-- Private helpers are only ever invoked from SECURITY DEFINER functions or triggers,
-- so API roles need no direct access to them.
revoke all on all functions in schema private from public;
