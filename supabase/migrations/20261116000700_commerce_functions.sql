-- =============================================================================
-- VOVIAN · 0700 · Server-side commerce logic
--
-- The client never supplies prices, discounts, shipping, tax or totals.
-- compute_quote() is the single source of truth for every financial value and
-- is used both for display (quote_cart) and for order creation (place_order),
-- where inventory rows are additionally locked to make overselling impossible.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Settings + request helpers
-- ---------------------------------------------------------------------------
create or replace function private.get_setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select value from public.store_settings where key = p_key;
$$;

create or replace function private.request_ip()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    split_part(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ',', 1),
    'unknown'
  );
$$;

create or replace function private.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits  integer;
begin
  insert into private.rate_limits as rl (key, window_start, hits)
  values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning hits into v_hits;

  if random() < 0.02 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

-- Exposed to service_role only (edge functions).
create or replace function public.check_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.rate_limit_hit(p_key, p_window_seconds, p_max);
$$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Sort key for sizes so XS < S < M … and numeric sizes order numerically.
create or replace function public.size_rank(p_size text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case upper(coalesce(p_size, ''))
    when 'XXS' then 10 when 'XS' then 20 when 'S' then 30 when 'M' then 40
    when 'L' then 50 when 'XL' then 60 when 'XXL' then 70 when '3XL' then 80
    when 'ONE SIZE' then 900
    else case when p_size ~ '^[0-9]+(\.[0-9]+)?$' then 100 + (p_size::numeric * 2)::integer else 950 end
  end;
$$;

-- ---------------------------------------------------------------------------
-- Iraqi mobile numbers → canonical +9647XXXXXXXXX (null when invalid).
-- Accepts 07…, 7…, +9647…, 009647…, spaces/dashes and Arabic-Indic digits.
-- Mirrors normalizeIraqPhone() in packages/validation.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_iq_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when d ~ '^(\+964|00964|0)?7[0-9]{9}$'
              then '+964' || right(d, 10)
         end
  from (
    select regexp_replace(
             translate(coalesce(p_phone, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
             '[\s()\-.]', '', 'g') as d
  ) x;
$$;

-- ---------------------------------------------------------------------------
-- Shipping zone resolution: explicit governorate match first, then '*'.
-- ---------------------------------------------------------------------------
create or replace function private.zone_for_governorate(p_governorate text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.shipping_zones
  where is_active and (lower(coalesce(p_governorate, '')) = any (regions) or '*' = any (regions))
  order by (lower(coalesce(p_governorate, '')) = any (regions)) desc, position
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- compute_quote — authoritative pricing.
--   p_items: [{ "variant_id": uuid, "quantity": int }]
--   returns: { currency, lines[], issues[], subtotal, discount_total, discount{},
--              shipping_total, shipping_method{}, shipping_methods[], tax_total,
--              tax_inclusive, tax_label, total, item_count }
-- ---------------------------------------------------------------------------
create or replace function private.compute_quote(
  p_items              jsonb,
  p_discount_code      text,
  p_shipping_method_id uuid,
  p_governorate        text,
  p_email              text,
  p_user_id            uuid,
  p_locale             text default 'en',
  p_lock               boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_currency      text := coalesce(private.get_setting('currency') ->> 'code', 'USD');
  v_tax           jsonb := coalesce(private.get_setting('tax'), '{"enabled": false}'::jsonb);
  v_region        text := lower(nullif(trim(coalesce(p_governorate, private.get_setting('checkout') ->> 'default_governorate', '')), ''));
  v_lines         jsonb := '[]'::jsonb;
  v_issues        jsonb := '[]'::jsonb;
  v_subtotal      numeric(12, 2) := 0;
  v_item_count    integer := 0;
  v_discount      record;
  v_discount_info jsonb := null;
  v_discount_total numeric(12, 2) := 0;
  v_eligible      numeric(12, 2) := 0;
  v_free_shipping boolean := false;
  v_zone_id       uuid;
  v_method        record;
  v_methods       jsonb := '[]'::jsonb;
  v_shipping      numeric(12, 2) := 0;
  v_method_info   jsonb := null;
  v_taxable       numeric(12, 2);
  v_tax_rate      numeric := 0;
  v_tax_total     numeric(12, 2) := 0;
  v_total         numeric(12, 2);
  v_inclusive     boolean := coalesce((v_tax ->> 'inclusive')::boolean, true);
  v_line          record;
  v_allocated     numeric(12, 2) := 0;
  v_share         numeric(12, 2);
  v_last_eligible integer := -1;
  v_status        text;
  v_used          integer;
  i               integer;
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'VALIDATION: items must be an array' using errcode = '22023';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 then
    raise exception 'VALIDATION: too many cart lines' using errcode = '22023';
  end if;

  -- Lock inventory rows in a deterministic order (prevents deadlocks).
  if p_lock then
    perform 1
    from public.inventory inv
    where inv.variant_id in (
      select distinct (e ->> 'variant_id')::uuid from jsonb_array_elements(p_items) e
    )
    order by inv.variant_id
    for update;
  end if;

  -- ---- Lines ---------------------------------------------------------------
  for v_line in
    with req as (
      select (e ->> 'variant_id')::uuid as variant_id,
             sum(greatest(coalesce((e ->> 'quantity')::integer, 0), 0))::integer as quantity
      from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
      group by 1
    )
    select
      req.variant_id,
      least(req.quantity, 20) as quantity,
      v.id is not null and v.is_active and v.deleted_at is null as variant_ok,
      p.id is not null and p.status = 'active' and p.deleted_at is null as product_ok,
      v.sku, v.color, v.size,
      p.id as product_id, p.slug, p.category_id,
      coalesce(p.translations -> p_locale ->> 'name', p.name) as name,
      pr.unit_price, pr.compare_at,
      greatest(coalesce(inv.on_hand - inv.reserved, 0), 0) as available,
      (
        select img.url from public.product_images img
        where img.product_id = p.id
        order by (img.color is not distinct from v.color) desc, img.position
        limit 1
      ) as image_url
    from req
    left join public.product_variants v on v.id = req.variant_id
    left join public.products p on p.id = v.product_id
    left join public.inventory inv on inv.variant_id = v.id
    left join lateral public.variant_unit_price(p.price, p.sale_price, v.price, v.sale_price) pr on true
    where req.quantity > 0
    order by req.variant_id
  loop
    if not coalesce(v_line.variant_ok and v_line.product_ok, false) then
      v_status := 'unavailable';
    elsif v_line.available <= 0 then
      v_status := 'sold_out';
    elsif v_line.available < v_line.quantity then
      v_status := 'insufficient_stock';
    else
      v_status := 'ok';
    end if;

    if v_status <> 'ok' then
      v_issues := v_issues || jsonb_build_object(
        'variant_id', v_line.variant_id, 'code', v_status, 'available', v_line.available
      );
    end if;

    v_lines := v_lines || jsonb_build_object(
      'variant_id',  v_line.variant_id,
      'product_id',  v_line.product_id,
      'slug',        v_line.slug,
      'category_id', v_line.category_id,
      'name',        v_line.name,
      'sku',         v_line.sku,
      'color',       v_line.color,
      'size',        v_line.size,
      'image_url',   v_line.image_url,
      'quantity',    v_line.quantity,
      'available',   v_line.available,
      'unit_price',  v_line.unit_price,
      'compare_at',  v_line.compare_at,
      'line_total',  case when v_status = 'ok' then round(v_line.unit_price * v_line.quantity, 2) else 0 end,
      'discount_amount', 0,
      'eligible',    false,
      'status',      v_status
    );

    if v_status = 'ok' then
      v_subtotal := v_subtotal + round(v_line.unit_price * v_line.quantity, 2);
      v_item_count := v_item_count + v_line.quantity;
    end if;
  end loop;

  -- ---- Discount -----------------------------------------------------------
  if nullif(trim(coalesce(p_discount_code, '')), '') is not null then
    select * into v_discount from public.discount_codes where code = trim(p_discount_code)::extensions.citext;

    if not found or not v_discount.is_active then
      v_discount_info := jsonb_build_object('code', upper(trim(p_discount_code)), 'valid', false, 'reason', 'not_found');
    elsif v_discount.starts_at is not null and v_discount.starts_at > now() then
      v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'not_started');
    elsif v_discount.expires_at is not null and v_discount.expires_at <= now() then
      v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'expired');
    elsif v_discount.usage_limit is not null and v_discount.times_used >= v_discount.usage_limit then
      v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'usage_limit');
    else
      if v_discount.usage_limit_per_customer is not null and (p_email is not null or p_user_id is not null) then
        select count(*) into v_used from public.discount_usage du
        where du.discount_id = v_discount.id
          and (du.email = p_email::extensions.citext or (p_user_id is not null and du.user_id = p_user_id));
      else
        v_used := 0;
      end if;

      if v_used >= coalesce(v_discount.usage_limit_per_customer, 2147483647) then
        v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'customer_limit');
      elsif v_discount.min_order_value is not null and v_subtotal < v_discount.min_order_value then
        v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'min_order',
                                              'min_order_value', v_discount.min_order_value);
      else
        -- Mark eligible lines
        for i in 0 .. jsonb_array_length(v_lines) - 1 loop
          if (v_lines -> i ->> 'status') = 'ok' and (
               v_discount.scope = 'all'
            or (v_discount.scope = 'products'   and (v_lines -> i ->> 'product_id')::uuid = any (v_discount.product_ids))
            or (v_discount.scope = 'categories' and (v_lines -> i ->> 'category_id')::uuid = any (v_discount.category_ids))
          ) then
            v_lines := jsonb_set(v_lines, array[i::text, 'eligible'], 'true'::jsonb);
            v_eligible := v_eligible + (v_lines -> i ->> 'line_total')::numeric;
            v_last_eligible := i;
          end if;
        end loop;

        if v_eligible <= 0 then
          v_discount_info := jsonb_build_object('code', v_discount.code, 'valid', false, 'reason', 'not_applicable');
        else
          if v_discount.type = 'percentage' then
            v_discount_total := round(v_eligible * v_discount.value / 100, 2);
          elsif v_discount.type = 'fixed' then
            v_discount_total := least(v_discount.value, v_eligible);
          else
            v_free_shipping := true;
          end if;

          -- Allocate the discount across eligible lines (last line absorbs rounding)
          if v_discount_total > 0 then
            for i in 0 .. jsonb_array_length(v_lines) - 1 loop
              if (v_lines -> i ->> 'eligible')::boolean then
                if i = v_last_eligible then
                  v_share := v_discount_total - v_allocated;
                else
                  v_share := round(v_discount_total * (v_lines -> i ->> 'line_total')::numeric / v_eligible, 2);
                end if;
                v_allocated := v_allocated + v_share;
                v_lines := jsonb_set(v_lines, array[i::text, 'discount_amount'], to_jsonb(v_share));
              end if;
            end loop;
          end if;

          v_discount_info := jsonb_build_object(
            'id', v_discount.id, 'code', v_discount.code, 'valid', true, 'type', v_discount.type,
            'value', v_discount.value, 'amount', v_discount_total, 'free_shipping', v_free_shipping
          );
        end if;
      end if;
    end if;
  end if;

  -- ---- Shipping -----------------------------------------------------------
  v_zone_id := private.zone_for_governorate(v_region);

  if v_zone_id is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', sm.id,
      'code', sm.code,
      'name', coalesce(sm.translations -> p_locale ->> 'name', sm.name),
      'description', coalesce(sm.translations -> p_locale ->> 'description', sm.description),
      'min_days', sm.min_days,
      'max_days', sm.max_days,
      'rate', sm.rate,
      'free_over', sm.free_over,
      'price', case
                 when v_free_shipping then 0
                 when sm.free_over is not null and (v_subtotal - v_discount_total) >= sm.free_over then 0
                 else sm.rate
               end
    ) order by sm.position, sm.rate), '[]'::jsonb)
    into v_methods
    from public.shipping_methods sm
    where sm.zone_id = v_zone_id and sm.is_active;
  end if;

  if p_shipping_method_id is not null then
    select m.value into v_method_info
    from jsonb_array_elements(v_methods) m
    where (m.value ->> 'id')::uuid = p_shipping_method_id;
  end if;

  -- No explicit choice yet: estimate with the first (cheapest by position) method.
  if v_method_info is null and p_shipping_method_id is null and jsonb_array_length(v_methods) > 0 then
    v_method_info := v_methods -> 0;
  end if;

  v_shipping := case when v_item_count = 0 then 0 else coalesce((v_method_info ->> 'price')::numeric, 0) end;

  -- ---- Tax ----------------------------------------------------------------
  v_taxable := greatest(v_subtotal - v_discount_total + v_shipping, 0);

  if coalesce((v_tax ->> 'enabled')::boolean, false) then
    v_tax_rate := coalesce((v_tax -> 'rates' ->> v_region)::numeric, (v_tax ->> 'rate')::numeric, 0);
  end if;

  if v_inclusive then
    v_tax_total := round(v_taxable - v_taxable / (1 + v_tax_rate), 2);
    v_total := v_taxable;
  else
    v_tax_total := round(v_taxable * v_tax_rate, 2);
    v_total := v_taxable + v_tax_total;
  end if;

  return jsonb_build_object(
    'currency',          v_currency,
    'governorate',       v_region,
    'lines',             v_lines,
    'issues',            v_issues,
    'item_count',        v_item_count,
    'subtotal',          v_subtotal,
    'discount',          v_discount_info,
    'discount_total',    v_discount_total,
    'shipping_methods',  v_methods,
    'shipping_method',   v_method_info,
    'shipping_total',    v_shipping,
    'tax_rate',          v_tax_rate,
    'tax_label',         coalesce(v_tax ->> 'label', 'Tax'),
    'tax_inclusive',     v_inclusive,
    'tax_total',         v_tax_total,
    'total',             v_total
  );
end;
$$;

-- Public, read-only quote used by the cart, mini-cart and checkout review.
create or replace function public.quote_cart(
  p_items              jsonb,
  p_discount_code      text default null,
  p_shipping_method_id uuid default null,
  p_governorate        text default null,
  p_email              text default null,
  p_locale             text default 'en'
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.compute_quote(
    p_items, p_discount_code, p_shipping_method_id, p_governorate, p_email, (select auth.uid()), p_locale, false
  );
$$;

grant execute on function public.quote_cart(jsonb, text, uuid, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Order status transitions (mirrors packages/shared/src/order-status.ts)
-- ---------------------------------------------------------------------------
create or replace function public.order_transition_allowed(p_from public.order_status, p_to public.order_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending'    then p_to in ('confirmed', 'cancelled')
    when 'confirmed'  then p_to in ('processing', 'cancelled')
    when 'processing' then p_to in ('shipped', 'cancelled')
    when 'shipped'    then p_to in ('delivered', 'returned')
    when 'delivered'  then p_to in ('returned')
    else false
  end;
$$;

-- Restock helper used by cancellation and returns.
create or replace function private.restock_order(p_order_id uuid, p_reason public.inventory_reason, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_after integer;
begin
  for r in
    select oi.variant_id, sum(oi.quantity)::integer as qty
    from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id is not null
    group by oi.variant_id
    order by oi.variant_id
  loop
    update public.inventory set on_hand = on_hand + r.qty
    where variant_id = r.variant_id
    returning on_hand into v_after;

    if found then
      insert into public.inventory_movements (variant_id, delta, quantity_after, reason, reference_type, reference_id, actor_id)
      values (r.variant_id, r.qty, v_after, p_reason, 'order', p_order_id, p_actor);
    end if;

    update public.products p set sales_count = greatest(p.sales_count - r.qty, 0)
    from public.product_variants v where v.id = r.variant_id and p.id = v.product_id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order — called ONLY by the create-order edge function (service_role),
-- which has already verified the caller's JWT and rate limits.
-- Guarantees: idempotency, server-side pricing, stock locking, atomicity.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_payload jsonb, p_user_id uuid default null, p_ip text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key       text := nullif(trim(p_payload ->> 'idempotency_key'), '');
  v_existing  public.orders;
  v_address   jsonb := p_payload -> 'shipping_address';
  v_email     text := lower(trim(p_payload ->> 'email'));
  v_name      text := trim(p_payload ->> 'full_name');
  v_phone     text := public.normalize_iq_phone(p_payload ->> 'phone');
  v_phone2_in text := nullif(trim(coalesce(p_payload ->> 'phone_secondary', '')), '');
  v_phone2    text := public.normalize_iq_phone(p_payload ->> 'phone_secondary');
  v_gov       public.governorates;
  v_payment   text := p_payload ->> 'payment_method';
  v_method_id uuid := nullif(p_payload ->> 'shipping_method_id', '')::uuid;
  v_locale    text := case when p_payload ->> 'locale' = 'ar' then 'ar' else 'en' end;
  v_pm        jsonb;
  v_quote     jsonb;
  v_order     public.orders;
  v_line      jsonb;
  v_after     integer;
  v_updated   integer;
begin
  -- ---- Basic validation (edge function validates too; never trust callers) ----
  if v_key is null or length(v_key) < 16 or length(v_key) > 100 then
    raise exception 'VALIDATION: idempotency_key' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'VALIDATION: email' using errcode = '22023';
  end if;
  if coalesce(length(v_name), 0) < 2 then
    raise exception 'VALIDATION: full_name' using errcode = '22023';
  end if;
  if v_phone is null then
    raise exception 'VALIDATION: phone' using errcode = '22023';
  end if;
  if v_phone2_in is not null and (v_phone2 is null or v_phone2 = v_phone) then
    raise exception 'VALIDATION: phone_secondary' using errcode = '22023';
  end if;
  select * into v_gov from public.governorates where code = lower(trim(coalesce(v_address ->> 'governorate', ''))) and is_active;
  if not found then
    raise exception 'VALIDATION: shipping_address.governorate' using errcode = '22023';
  end if;
  if coalesce(length(trim(v_address ->> 'area')), 0) < 2 then
    raise exception 'VALIDATION: shipping_address.area' using errcode = '22023';
  end if;
  if coalesce(length(trim(v_address ->> 'landmark')), 0) < 3 then
    raise exception 'VALIDATION: shipping_address.landmark' using errcode = '22023';
  end if;
  if v_method_id is null then
    raise exception 'VALIDATION: shipping_method_id' using errcode = '22023';
  end if;

  -- ---- Idempotency: same key → same order (serialise concurrent retries) ----
  perform pg_advisory_xact_lock(hashtextextended('order:' || v_key, 0));
  select * into v_existing from public.orders where idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'order_id', v_existing.id, 'order_number', v_existing.order_number,
      'access_token', v_existing.access_token, 'total', v_existing.total,
      'currency', v_existing.currency, 'duplicate', true
    );
  end if;

  -- ---- Payment method must be enabled in settings ----
  select pm.value into v_pm
  from jsonb_array_elements(coalesce(private.get_setting('payment_methods'), '[]'::jsonb)) pm
  where pm.value ->> 'code' = v_payment and coalesce((pm.value ->> 'enabled')::boolean, false);

  if v_pm is null then
    raise exception 'PAYMENT_METHOD_UNAVAILABLE' using errcode = '22023';
  end if;

  -- ---- Authoritative quote with inventory rows locked ----
  v_quote := private.compute_quote(
    p_payload -> 'items', p_payload ->> 'discount_code', v_method_id,
    v_gov.code, v_email, p_user_id, v_locale, true
  );

  -- Stock/availability problems take precedence over "empty": a cart whose
  -- every line just sold out must tell the shopper which lines changed.
  if jsonb_array_length(v_quote -> 'issues') > 0 then
    raise exception 'CART_INVALID' using errcode = '22023', detail = (v_quote -> 'issues')::text;
  end if;
  if (v_quote ->> 'item_count')::integer = 0 then
    raise exception 'CART_EMPTY' using errcode = '22023';
  end if;
  if v_quote -> 'discount' is not null and jsonb_typeof(v_quote -> 'discount') = 'object'
     and not coalesce((v_quote -> 'discount' ->> 'valid')::boolean, false) then
    raise exception 'DISCOUNT_INVALID' using errcode = '22023', detail = (v_quote -> 'discount' ->> 'reason');
  end if;
  if v_quote -> 'shipping_method' is null or jsonb_typeof(v_quote -> 'shipping_method') <> 'object'
     or (v_quote -> 'shipping_method' ->> 'id')::uuid <> v_method_id then
    raise exception 'SHIPPING_UNAVAILABLE' using errcode = '22023';
  end if;

  -- ---- Create order ----
  insert into public.orders (
    user_id, email, phone, phone_secondary, customer_name, shipping_address, delivery_instructions,
    shipping_method_id, shipping_method_name, payment_method, status, payment_status,
    currency, subtotal, discount_total, shipping_total, tax_total, tax_inclusive, total,
    discount_code, locale, idempotency_key, placed_ip
  ) values (
    p_user_id, v_email, v_phone, v_phone2, v_name,
    jsonb_build_object(
      'country', 'IQ',
      'governorate', v_gov.code,
      'governorate_name', v_gov.name,
      'governorate_name_ar', v_gov.translations -> 'ar' ->> 'name',
      'area', left(trim(v_address ->> 'area'), 120),
      'landmark', left(trim(v_address ->> 'landmark'), 200)
    ),
    nullif(left(trim(coalesce(p_payload ->> 'delivery_instructions', '')), 500), ''),
    v_method_id, v_quote -> 'shipping_method' ->> 'name', v_payment, 'pending',
    case when v_payment = 'manual' then 'pending_confirmation'::public.payment_status else 'unpaid'::public.payment_status end,
    v_quote ->> 'currency',
    (v_quote ->> 'subtotal')::numeric, (v_quote ->> 'discount_total')::numeric,
    (v_quote ->> 'shipping_total')::numeric, (v_quote ->> 'tax_total')::numeric,
    (v_quote ->> 'tax_inclusive')::boolean, (v_quote ->> 'total')::numeric,
    case when (v_quote -> 'discount' ->> 'valid')::boolean then v_quote -> 'discount' ->> 'code' end,
    v_locale, v_key, p_ip
  )
  returning * into v_order;

  -- ---- Items + stock decrement (rows already locked) ----
  for v_line in select value from jsonb_array_elements(v_quote -> 'lines') loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, sku, color, size, image_url,
      unit_price, compare_at, quantity, discount_amount, line_total
    ) values (
      v_order.id, (v_line ->> 'product_id')::uuid, (v_line ->> 'variant_id')::uuid,
      v_line ->> 'name', v_line ->> 'sku', v_line ->> 'color', v_line ->> 'size', v_line ->> 'image_url',
      (v_line ->> 'unit_price')::numeric, (v_line ->> 'compare_at')::numeric,
      (v_line ->> 'quantity')::integer, (v_line ->> 'discount_amount')::numeric,
      (v_line ->> 'line_total')::numeric
    );

    update public.inventory
    set on_hand = on_hand - (v_line ->> 'quantity')::integer
    where variant_id = (v_line ->> 'variant_id')::uuid
      and on_hand - reserved >= (v_line ->> 'quantity')::integer
    returning on_hand into v_after;

    if not found then
      raise exception 'CART_INVALID' using errcode = '22023',
        detail = jsonb_build_array(jsonb_build_object('variant_id', v_line ->> 'variant_id', 'code', 'insufficient_stock'))::text;
    end if;

    insert into public.inventory_movements (variant_id, delta, quantity_after, reason, reference_type, reference_id, actor_id)
    values ((v_line ->> 'variant_id')::uuid, -((v_line ->> 'quantity')::integer), v_after, 'order', 'order', v_order.id, p_user_id);

    update public.products set sales_count = sales_count + (v_line ->> 'quantity')::integer
    where id = (v_line ->> 'product_id')::uuid;
  end loop;

  -- ---- Discount usage (guarded against races on the global limit) ----
  if (v_quote -> 'discount' ->> 'valid')::boolean then
    update public.discount_codes
    set times_used = times_used + 1
    where id = (v_quote -> 'discount' ->> 'id')::uuid
      and (usage_limit is null or times_used < usage_limit);
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'DISCOUNT_INVALID' using errcode = '22023', detail = 'usage_limit';
    end if;

    insert into public.discount_usage (discount_id, order_id, user_id, email, amount)
    values ((v_quote -> 'discount' ->> 'id')::uuid, v_order.id, p_user_id, v_email, (v_quote ->> 'discount_total')::numeric);
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, note, actor_id)
  values (v_order.id, null, 'pending', 'Order placed', p_user_id);

  insert into public.payments (order_id, provider, status, amount, currency)
  values (v_order.id, v_payment, 'pending', v_order.total, v_order.currency);

  insert into public.notifications (audience, permission, type, title, body, link, data)
  values ('staff', 'orders.read', 'order.placed',
          'New order ' || v_order.order_number,
          v_order.customer_name || ' · ' || v_order.currency || ' ' || v_order.total::text,
          '/orders/' || v_order.id, jsonb_build_object('order_id', v_order.id));

  if p_user_id is not null then
    insert into public.notifications (audience, user_id, type, title, link, data)
    values ('customer', p_user_id, 'order.placed', 'Order ' || v_order.order_number || ' received',
            '/account/orders/' || v_order.order_number, jsonb_build_object('order_id', v_order.id));

    -- The cart has been converted into an order.
    delete from public.cart_items ci using public.carts c where ci.cart_id = c.id and c.user_id = p_user_id;
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values (p_user_id, 'order.placed', 'orders', v_order.id::text,
          jsonb_build_object('total', v_order.total, 'items', v_quote -> 'item_count'));

  return jsonb_build_object(
    'order_id', v_order.id, 'order_number', v_order.order_number,
    'access_token', v_order.access_token, 'total', v_order.total,
    'currency', v_order.currency, 'payment_method', v_payment,
    'payment_instructions', v_pm -> 'instructions', 'duplicate', false
  );
end;
$$;

revoke execute on function public.place_order(jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Order read models for customers
-- ---------------------------------------------------------------------------
create or replace function private.order_json(p_order public.orders, p_include_private boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_order.id,
    'order_number', p_order.order_number,
    'status', p_order.status,
    'payment_status', p_order.payment_status,
    'payment_method', p_order.payment_method,
    'currency', p_order.currency,
    'subtotal', p_order.subtotal,
    'discount_total', p_order.discount_total,
    'discount_code', p_order.discount_code,
    'shipping_total', p_order.shipping_total,
    'tax_total', p_order.tax_total,
    'tax_inclusive', p_order.tax_inclusive,
    'total', p_order.total,
    'shipping_method_name', p_order.shipping_method_name,
    'tracking_number', p_order.tracking_number,
    'tracking_url', p_order.tracking_url,
    'created_at', p_order.created_at,
    'customer_name', p_order.customer_name,
    'email', case when p_include_private then p_order.email::text end,
    'phone', case when p_include_private then p_order.phone end,
    'phone_secondary', case when p_include_private then p_order.phone_secondary end,
    'shipping_address', case when p_include_private then p_order.shipping_address
                             else jsonb_build_object(
                               'governorate', p_order.shipping_address ->> 'governorate',
                               'governorate_name', p_order.shipping_address ->> 'governorate_name',
                               'governorate_name_ar', p_order.shipping_address ->> 'governorate_name_ar') end,
    'delivery_instructions', case when p_include_private then p_order.delivery_instructions end,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name, 'sku', oi.sku, 'color', oi.color, 'size', oi.size,
        'image_url', oi.image_url, 'unit_price', oi.unit_price, 'quantity', oi.quantity,
        'line_total', oi.line_total, 'product_slug', p.slug
      ) order by oi.created_at), '[]'::jsonb)
      from public.order_items oi left join public.products p on p.id = oi.product_id
      where oi.order_id = p_order.id
    ),
    'history', (
      select coalesce(jsonb_agg(jsonb_build_object('status', h.to_status, 'at', h.created_at) order by h.created_at), '[]'::jsonb)
      from public.order_status_history h
      where h.order_id = p_order.id and h.is_customer_visible
    ),
    'can_cancel', p_order.status = 'pending'
  );
$$;

-- Confirmation page for guests (and signed-in buyers) right after checkout.
create or replace function public.get_order_by_token(p_order_number text, p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where order_number = upper(trim(p_order_number)) and access_token = p_token;
  if not found then return null; end if;
  return private.order_json(v_order, true);
end;
$$;

grant execute on function public.get_order_by_token(text, uuid) to anon, authenticated;

-- Public order tracking: order number + the email OR phone used at checkout.
-- Rate limited per IP; returns no address details.
create or replace function public.track_order(p_order_number text, p_contact text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_order public.orders;
begin
  if not private.rate_limit_hit('track:' || private.request_ip(), 60, 10) then
    raise exception 'RATE_LIMITED' using errcode = '54000';
  end if;

  select * into v_order from public.orders
  where order_number = upper(trim(p_order_number))
    and (
      email = lower(trim(p_contact))::extensions.citext
      or (public.normalize_iq_phone(p_contact) is not null
          and public.normalize_iq_phone(p_contact) in (phone, phone_secondary))
    );

  if not found then return null; end if;
  return private.order_json(v_order, false);
end;
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;

-- Signed-in customers: full detail of one of their own orders.
create or replace function public.get_my_order(p_order_number text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders
  where order_number = upper(trim(p_order_number)) and user_id = (select auth.uid());
  if not found then return null; end if;
  return private.order_json(v_order, true);
end;
$$;

grant execute on function public.get_my_order(text) to authenticated;

-- Customers may cancel their own order while it is still pending.
create or replace function public.cancel_my_order(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders
  where order_number = upper(trim(p_order_number)) and user_id = (select auth.uid())
  for update;

  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_order.status <> 'pending' then
    raise exception 'ORDER_NOT_CANCELLABLE' using errcode = '22023';
  end if;

  perform private.apply_order_status(v_order.id, 'cancelled', 'Cancelled by customer', (select auth.uid()), true);
  select * into v_order from public.orders where id = v_order.id;
  return private.order_json(v_order, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Status change core (used by admin + customer cancellation)
-- ---------------------------------------------------------------------------
create or replace function private.apply_order_status(
  p_order_id uuid, p_to public.order_status, p_note text, p_actor uuid, p_customer_visible boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_usage public.discount_usage;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;

  if not public.order_transition_allowed(v_order.status, p_to) then
    raise exception 'INVALID_TRANSITION: % -> %', v_order.status, p_to using errcode = '22023';
  end if;

  update public.orders set
    status = p_to,
    confirmed_at = case when p_to = 'confirmed' then now() else confirmed_at end,
    shipped_at   = case when p_to = 'shipped'   then now() else shipped_at end,
    delivered_at = case when p_to = 'delivered' then now() else delivered_at end,
    cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end
  where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note, actor_id, is_customer_visible)
  values (p_order_id, v_order.status, p_to, nullif(trim(coalesce(p_note, '')), ''), p_actor, p_customer_visible);

  if p_to = 'cancelled' then
    perform private.restock_order(p_order_id, 'cancellation', p_actor);
    -- Release the discount code usage
    delete from public.discount_usage where order_id = p_order_id returning * into v_usage;
    if v_usage.id is not null then
      update public.discount_codes set times_used = greatest(times_used - 1, 0) where id = v_usage.discount_id;
    end if;
    update public.payments set status = 'failed' where order_id = p_order_id and status = 'pending';
    if v_order.payment_status in ('unpaid', 'pending_confirmation') then
      update public.orders set payment_status = 'unpaid' where id = p_order_id;
    end if;
  elsif p_to = 'returned' then
    perform private.restock_order(p_order_id, 'return', p_actor);
  elsif p_to = 'delivered' and v_order.payment_method = 'cod' and v_order.payment_status <> 'paid' then
    -- Cash collected on delivery
    update public.payments set status = 'paid', recorded_by = p_actor, reference = coalesce(reference, 'Collected on delivery')
    where order_id = p_order_id and status = 'pending';
    update public.orders set payment_status = 'paid' where id = p_order_id;
  end if;

  if v_order.user_id is not null then
    insert into public.notifications (audience, user_id, type, title, link, data)
    values ('customer', v_order.user_id, 'order.status',
            'Order ' || v_order.order_number || ' is now ' || p_to::text,
            '/account/orders/' || v_order.order_number,
            jsonb_build_object('order_id', p_order_id, 'status', p_to));
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, changes)
  values (p_actor, 'order.status', 'orders', p_order_id::text,
          jsonb_build_object('from', v_order.status, 'to', p_to, 'note', p_note));
end;
$$;

grant execute on function public.cancel_my_order(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Newsletter (anonymous, rate limited)
-- ---------------------------------------------------------------------------
create or replace function public.subscribe_newsletter(p_email text, p_locale text default 'en', p_source text default 'footer')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'VALIDATION: email' using errcode = '22023';
  end if;
  if not private.rate_limit_hit('newsletter:' || private.request_ip(), 3600, 10) then
    raise exception 'RATE_LIMITED' using errcode = '54000';
  end if;

  insert into public.newsletter_subscribers (email, locale, source, user_id)
  values (v_email, case when p_locale = 'ar' then 'ar' else 'en' end, left(coalesce(p_source, 'footer'), 40), (select auth.uid()))
  on conflict (email) do update set is_subscribed = true, unsubscribed_at = null;

  return jsonb_build_object('subscribed', true);
end;
$$;

grant execute on function public.subscribe_newsletter(text, text, text) to anon, authenticated;
