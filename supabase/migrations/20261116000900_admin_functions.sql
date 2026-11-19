-- =============================================================================
-- VOVIAN · 0900 · Admin RPCs, audit triggers, alerts
-- Every function re-checks the caller's permission server-side.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Audit trigger — records who changed what (only API-originated changes,
-- i.e. when a JWT subject is present).
-- ---------------------------------------------------------------------------
create or replace function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changes jsonb;
begin
  if v_actor is null then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('from', v_old -> n.key, 'to', n.value))
    into v_changes
    from jsonb_each(v_new) n
    where n.key not in ('updated_at', 'search_text') and (v_old -> n.key) is distinct from n.value;
    if v_changes is null then return null; end if;
  elsif tg_op = 'INSERT' then
    v_changes := v_new - 'search_text';
  else
    v_changes := v_old - 'search_text';
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values (v_actor, lower(tg_op), tg_table_name,
          coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'variant_id', v_row ->> 'user_id', v_row ->> 'handle'),
          v_changes);
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'products', 'product_variants', 'product_images', 'categories', 'collections',
    'discount_codes', 'store_settings', 'shipping_zones', 'shipping_methods',
    'homepage_banners', 'homepage_sections', 'pages', 'navigation_menus', 'user_roles', 'reviews'
  ] loop
    execute format('create trigger %1$s_audit after insert or update or delete on public.%1$s
                    for each row execute function private.audit_row()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Low-stock alert: notify inventory staff when available stock crosses the
-- variant's threshold (or hits zero).
-- ---------------------------------------------------------------------------
create or replace function private.inventory_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_avail integer := old.on_hand - old.reserved;
  v_new_avail integer := new.on_hand - new.reserved;
  v_label text;
begin
  if v_new_avail <= new.low_stock_threshold and v_old_avail > new.low_stock_threshold then
    select p.name || ' · ' || v.sku into v_label
    from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = new.variant_id;

    insert into public.notifications (audience, permission, type, title, body, link, data)
    values ('staff', 'inventory.read',
            case when v_new_avail <= 0 then 'inventory.out_of_stock' else 'inventory.low_stock' end,
            case when v_new_avail <= 0 then 'Sold out: ' else 'Low stock: ' end || coalesce(v_label, new.variant_id::text),
            v_new_avail::text || ' left',
            '/inventory?variant=' || new.variant_id,
            jsonb_build_object('variant_id', new.variant_id, 'available', v_new_avail));
  end if;
  return new;
end;
$$;

create trigger inventory_low_stock_alert after update of on_hand, reserved on public.inventory
  for each row execute function private.inventory_alert();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_order_status(
  p_order_id uuid, p_status public.order_status, p_note text default null, p_customer_visible boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('orders.write');
  perform private.apply_order_status(p_order_id, p_status, p_note, (select auth.uid()), p_customer_visible);
end;
$$;

create or replace function public.admin_update_order_tracking(p_order_id uuid, p_tracking_number text, p_tracking_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('orders.write');
  if p_tracking_url is not null and p_tracking_url !~ '^https://' then
    raise exception 'VALIDATION: tracking_url must be https' using errcode = '22023';
  end if;
  update public.orders
  set tracking_number = nullif(trim(p_tracking_number), ''), tracking_url = nullif(trim(p_tracking_url), '')
  where id = p_order_id;
  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values ((select auth.uid()), 'order.tracking', 'orders', p_order_id::text,
          jsonb_build_object('tracking_number', p_tracking_number, 'tracking_url', p_tracking_url));
end;
$$;

-- Record a payment event (manual confirmation, refund, failure).
create or replace function public.admin_record_payment(
  p_order_id uuid, p_status public.payment_record_status, p_amount numeric, p_reference text default null, p_provider text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_paid numeric;
  v_refunded numeric;
begin
  perform private.require_permission('orders.write');
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if p_amount is null or p_amount <= 0 or p_amount > v_order.total then
    raise exception 'VALIDATION: amount must be between 0 and the order total' using errcode = '22023';
  end if;

  -- A pending record for this order is settled rather than duplicated.
  update public.payments set status = p_status, amount = p_amount, reference = coalesce(p_reference, reference),
                             recorded_by = (select auth.uid())
  where id = (select id from public.payments where order_id = p_order_id and status = 'pending' order by created_at limit 1)
    and p_status in ('paid', 'failed');

  if not found then
    insert into public.payments (order_id, provider, status, amount, currency, reference, recorded_by)
    values (p_order_id, coalesce(p_provider, v_order.payment_method), p_status, p_amount, v_order.currency, p_reference, (select auth.uid()));
  end if;

  select coalesce(sum(amount) filter (where status = 'paid'), 0), coalesce(sum(amount) filter (where status = 'refunded'), 0)
  into v_paid, v_refunded from public.payments where order_id = p_order_id;

  update public.orders set payment_status = case
      when v_refunded > 0 and v_refunded >= v_paid then 'refunded'::public.payment_status
      when v_refunded > 0 then 'partially_refunded'::public.payment_status
      when v_paid >= v_order.total then 'paid'::public.payment_status
      when p_status = 'failed' then 'failed'::public.payment_status
      else v_order.payment_status
    end
  where id = p_order_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values ((select auth.uid()), 'payment.' || p_status::text, 'orders', p_order_id::text,
          jsonb_build_object('amount', p_amount, 'reference', p_reference));
end;
$$;

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
create or replace function public.admin_adjust_inventory(
  p_variant_id uuid, p_delta integer, p_reason public.inventory_reason default 'adjustment', p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_after integer;
begin
  perform private.require_permission('inventory.write');
  if p_delta = 0 then raise exception 'VALIDATION: delta cannot be zero' using errcode = '22023'; end if;
  if p_reason in ('order', 'cancellation') then
    raise exception 'VALIDATION: reason reserved for order processing' using errcode = '22023';
  end if;

  update public.inventory set on_hand = on_hand + p_delta
  where variant_id = p_variant_id and on_hand + p_delta >= reserved
  returning on_hand into v_after;

  if not found then
    raise exception 'INSUFFICIENT_STOCK: adjustment would make stock negative' using errcode = '22023';
  end if;

  insert into public.inventory_movements (variant_id, delta, quantity_after, reason, reference_type, note, actor_id)
  values (p_variant_id, p_delta, v_after, p_reason, 'manual', nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()));

  return v_after;
end;
$$;

create or replace function public.admin_set_inventory(p_variant_id uuid, p_quantity integer, p_note text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_current integer;
begin
  perform private.require_permission('inventory.write');
  if p_quantity < 0 then raise exception 'VALIDATION: quantity must be >= 0' using errcode = '22023'; end if;
  select on_hand into v_current from public.inventory where variant_id = p_variant_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_current = p_quantity then return v_current; end if;
  return public.admin_adjust_inventory(p_variant_id, p_quantity - v_current, 'correction', coalesce(p_note, 'Stock count'));
end;
$$;

create or replace function public.admin_set_low_stock_threshold(p_variant_id uuid, p_threshold integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('inventory.write');
  update public.inventory set low_stock_threshold = greatest(p_threshold, 0) where variant_id = p_variant_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create or replace function public.admin_duplicate_product(p_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_src public.products;
  v_new_id uuid := gen_random_uuid();
  v_suffix text := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  v_img record;
  v_new_img uuid;
begin
  perform private.require_permission('products.write');
  select * into v_src from public.products where id = p_product_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;

  insert into public.products (
    id, slug, style_code, name, description, material, care, fit, details, translations, brand,
    department, category_id, price, sale_price, status, is_featured, is_new_arrival, is_best_seller,
    size_guide, tags, seo_title, seo_description, created_by
  ) values (
    v_new_id, v_src.slug || '-copy-' || v_suffix, v_src.style_code || '-C' || upper(v_suffix), v_src.name || ' (copy)',
    v_src.description, v_src.material, v_src.care, v_src.fit, v_src.details, v_src.translations, v_src.brand,
    v_src.department, v_src.category_id, v_src.price, v_src.sale_price, 'draft', false, v_src.is_new_arrival, false,
    v_src.size_guide, v_src.tags, v_src.seo_title, v_src.seo_description, (select auth.uid())
  );

  insert into public.product_options (product_id, kind, value, translations, swatch_hex, position)
  select v_new_id, kind, value, translations, swatch_hex, position from public.product_options where product_id = p_product_id;

  insert into public.product_variants (product_id, sku, color, size, price, sale_price, barcode, weight_grams, position, is_active)
  select v_new_id, sku || '-C' || upper(v_suffix), color, size, price, sale_price, null, weight_grams, position, is_active
  from public.product_variants where product_id = p_product_id and deleted_at is null;

  for v_img in select * from public.product_images where product_id = p_product_id order by position loop
    insert into public.product_images (product_id, url, storage_path, alt, color, width, height, position)
    values (v_new_id, v_img.url, v_img.storage_path, v_img.alt, v_img.color, v_img.width, v_img.height, v_img.position)
    returning id into v_new_img;
  end loop;

  insert into public.product_collections (product_id, collection_id, position)
  select v_new_id, collection_id, position from public.product_collections where product_id = p_product_id;

  return v_new_id;
end;
$$;

-- Soft delete (keeps order history intact)
create or replace function public.admin_archive_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('products.delete');
  update public.products set deleted_at = now(), status = 'archived' where id = p_product_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create or replace function public.admin_customers(
  p_search text default null, p_status public.customer_status default null,
  p_limit integer default 25, p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  perform private.require_permission('customers.read');

  with base as (
    select pr.*,
      coalesce(s.order_count, 0) as order_count,
      coalesce(s.total_spent, 0) as total_spent,
      s.last_order_at
    from public.profiles pr
    left join lateral (
      select count(*) as order_count,
             sum(o.total) filter (where o.status not in ('cancelled', 'returned')) as total_spent,
             max(o.created_at) as last_order_at
      from public.orders o where o.user_id = pr.id
    ) s on true
    where not exists (select 1 from public.user_roles ur where ur.user_id = pr.id)
      and (p_status is null or pr.status = p_status)
      and (p_search is null or p_search = '' or pr.email::text ilike '%' || p_search || '%'
           or pr.full_name ilike '%' || p_search || '%' or pr.phone ilike '%' || p_search || '%')
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'email', b.email, 'full_name', b.full_name, 'phone', b.phone, 'status', b.status,
        'created_at', b.created_at, 'order_count', b.order_count, 'total_spent', b.total_spent,
        'last_order_at', b.last_order_at
      ) order by b.created_at desc)
      from (select * from base order by created_at desc limit least(p_limit, 100) offset greatest(p_offset, 0)) b
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_customer(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  perform private.require_permission('customers.read');
  select jsonb_build_object(
    'profile', to_jsonb(pr),
    'addresses', (select coalesce(jsonb_agg(to_jsonb(a) order by a.is_default desc), '[]'::jsonb) from public.addresses a where a.user_id = pr.id),
    'stats', (
      select jsonb_build_object(
        'order_count', count(*),
        'total_spent', coalesce(sum(o.total) filter (where o.status not in ('cancelled', 'returned')), 0),
        'average_order', coalesce(avg(o.total) filter (where o.status not in ('cancelled', 'returned')), 0),
        'first_order_at', min(o.created_at), 'last_order_at', max(o.created_at))
      from public.orders o where o.user_id = pr.id
    ),
    'orders', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'order_number', o.order_number, 'status', o.status, 'payment_status', o.payment_status,
        'total', o.total, 'currency', o.currency, 'created_at', o.created_at
      ) order by o.created_at desc), '[]'::jsonb)
      from public.orders o where o.user_id = pr.id
    ),
    'wishlist_count', (select count(*) from public.wishlist_items wi join public.wishlists w on w.id = wi.wishlist_id where w.user_id = pr.id)
  ) into v_result
  from public.profiles pr where pr.id = p_user_id;
  return v_result;
end;
$$;

create or replace function public.admin_update_customer(p_user_id uuid, p_status public.customer_status, p_staff_notes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('customers.write');
  update public.profiles set status = p_status, staff_notes = nullif(trim(coalesce(p_staff_notes, '')), '')
  where id = p_user_id;
  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values ((select auth.uid()), 'customer.update', 'profiles', p_user_id::text, jsonb_build_object('status', p_status));
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff & roles
-- ---------------------------------------------------------------------------
create or replace function public.admin_staff()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  perform private.require_permission('staff.manage');
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', s.user_id, 'email', pr.email, 'full_name', pr.full_name, 'roles', s.roles,
    'last_sign_in_at', u.last_sign_in_at, 'created_at', s.created_at
  ) order by s.created_at), '[]'::jsonb) into v_result
  from (
    select user_id, array_agg(role order by role) as roles, min(created_at) as created_at
    from public.user_roles group by user_id
  ) s
  join public.profiles pr on pr.id = s.user_id
  left join auth.users u on u.id = s.user_id;
  return v_result;
end;
$$;

create or replace function public.admin_set_user_roles(p_user_id uuid, p_roles public.app_role[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_remaining integer;
begin
  perform private.require_permission('staff.manage');

  delete from public.user_roles where user_id = p_user_id and role <> all (coalesce(p_roles, '{}'));
  insert into public.user_roles (user_id, role, granted_by)
  select p_user_id, r, (select auth.uid()) from unnest(coalesce(p_roles, '{}')) r
  on conflict do nothing;

  select count(*) into v_remaining from public.user_roles where role = 'super_admin';
  if v_remaining = 0 then
    raise exception 'VALIDATION: at least one super admin must remain' using errcode = '22023';
  end if;
end;
$$;

-- Look up a user id by email (for assigning roles to an existing account).
create or replace function public.admin_find_user(p_email text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_permission('staff.manage');
  return (select id from public.profiles where email = lower(trim(p_email))::extensions.citext);
end;
$$;

-- ---------------------------------------------------------------------------
-- Dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days  integer := least(greatest(coalesce(p_days, 30), 1), 365);
  v_from  timestamptz := date_trunc('day', now()) - make_interval(days => v_days - 1);
  v_prev  timestamptz := v_from - make_interval(days => v_days);
  v_result jsonb;
begin
  perform private.require_permission('dashboard.view');

  with valid as (
    select * from public.orders where status not in ('cancelled', 'returned')
  ),
  cur as (select * from valid where created_at >= v_from),
  prev as (select * from valid where created_at >= v_prev and created_at < v_from)
  select jsonb_build_object(
    'range_days', v_days,
    'currency', coalesce(private.get_setting('currency') ->> 'code', 'USD'),
    'revenue', (select coalesce(sum(total), 0) from cur),
    'revenue_prev', (select coalesce(sum(total), 0) from prev),
    'orders', (select count(*) from cur),
    'orders_prev', (select count(*) from prev),
    'orders_all_time', (select count(*) from public.orders),
    'average_order_value', (select coalesce(round(avg(total), 2), 0) from cur),
    'average_order_value_prev', (select coalesce(round(avg(total), 2), 0) from prev),
    'customers', (select count(*) from public.profiles p where not exists (select 1 from public.user_roles ur where ur.user_id = p.id)),
    'new_customers', (select count(*) from public.profiles p where p.created_at >= v_from and not exists (select 1 from public.user_roles ur where ur.user_id = p.id)),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'processing_orders', (select count(*) from public.orders where status in ('confirmed', 'processing')),
    'completed_orders', (select count(*) from public.orders where status = 'delivered'),
    'status_breakdown', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.orders where created_at >= v_from group by status) s
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object('date', d.day::date, 'revenue', coalesce(x.revenue, 0), 'orders', coalesce(x.orders, 0)) order by d.day), '[]'::jsonb)
      from generate_series(v_from, date_trunc('day', now()), interval '1 day') d(day)
      left join (
        select date_trunc('day', created_at) as day, sum(total) as revenue, count(*) as orders
        from cur group by 1
      ) x on x.day = d.day
    ),
    'best_sellers', (
      select coalesce(jsonb_agg(b order by b.quantity desc), '[]'::jsonb) from (
        select oi.product_id, min(oi.product_name) as name, sum(oi.quantity) as quantity, sum(oi.line_total) as revenue,
               (select url from public.product_images i where i.product_id = oi.product_id order by position limit 1) as image_url
        from public.order_items oi join cur o on o.id = oi.order_id
        group by oi.product_id order by sum(oi.quantity) desc limit 5
      ) b
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'order_number', o.order_number, 'customer_name', o.customer_name, 'status', o.status,
        'payment_status', o.payment_status, 'total', o.total, 'currency', o.currency, 'created_at', o.created_at
      ) order by o.created_at desc), '[]'::jsonb)
      from (select * from public.orders order by created_at desc limit 8) o
    ),
    'inventory', (
      select jsonb_build_object(
        'out_of_stock', count(*) filter (where i.on_hand - i.reserved <= 0),
        'low_stock', count(*) filter (where i.on_hand - i.reserved > 0 and i.on_hand - i.reserved <= i.low_stock_threshold),
        'units', coalesce(sum(i.on_hand), 0)
      )
      from public.inventory i join public.product_variants v on v.id = i.variant_id
      join public.products p on p.id = v.product_id
      where v.deleted_at is null and p.deleted_at is null and p.status = 'active'
    ),
    'inventory_alerts', (
      select coalesce(jsonb_agg(a order by a.available, a.name), '[]'::jsonb) from (
        select v.id as variant_id, p.id as product_id, p.name, v.sku, v.color, v.size,
               i.on_hand - i.reserved as available, i.low_stock_threshold as threshold
        from public.inventory i join public.product_variants v on v.id = i.variant_id
        join public.products p on p.id = v.product_id
        where v.deleted_at is null and p.deleted_at is null and p.status = 'active'
          and i.on_hand - i.reserved <= i.low_stock_threshold
        order by i.on_hand - i.reserved, p.name limit 10
      ) a
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: admin RPCs are callable by signed-in users; each checks permissions.
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
