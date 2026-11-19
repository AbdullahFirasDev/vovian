-- Order creation, inventory safety, idempotency, status transitions and permissions.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

create temp table v as select id from public.product_variants where sku = 'VW-OW-0701-CAM-L';
update public.inventory set on_hand = 3, reserved = 0 where variant_id = (select id from v);

create or replace function pg_temp.payload(p_key text, p_qty int, p_code text default null) returns jsonb language sql as $$
  select jsonb_build_object(
    'idempotency_key', p_key, 'email', 'tester@example.com', 'full_name', 'حيدر الكاظمي',
    'phone', '0770 123 9876', 'phone_secondary', '٠٧٨٠١٢٣٩٨٧٦',
    'shipping_address', jsonb_build_object('governorate', 'baghdad', 'area', 'الكرادة', 'landmark', 'قرب ساحة كهرمانة'),
    'shipping_method_id', (select sm.id from public.shipping_methods sm join public.shipping_zones z on z.id = sm.zone_id where z.name = 'Baghdad' and sm.code = 'standard'),
    'payment_method', 'cod', 'discount_code', p_code,
    'items', jsonb_build_array(jsonb_build_object('variant_id', (select id from v), 'quantity', p_qty, 'price', 0.01)),
    'total', 0.01
  );
$$;

-- ── Creation & pricing ──────────────────────────────────────────────────
create temp table o1 as select public.place_order(pg_temp.payload('pgtap-order-key-0001', 2), null, '127.0.0.1') as r;
select is(((select r from o1) ->> 'total')::numeric, 1530000.00, 'order total computed server-side (2 × 765,000 IQD), client total ignored');
select is((select phone from public.orders where id = ((select r from o1) ->> 'order_id')::uuid), '+9647701239876', 'phone stored in canonical +964 form');
select is((select phone_secondary from public.orders where id = ((select r from o1) ->> 'order_id')::uuid), '+9647801239876', 'backup phone accepted with Arabic-Indic digits');
select is(
  (select shipping_address ->> 'governorate_name_ar' || ' / ' || (shipping_address ->> 'landmark') from public.orders where id = ((select r from o1) ->> 'order_id')::uuid),
  'بغداد / قرب ساحة كهرمانة', 'address snapshot keeps governorate name and nearest landmark');
select is((select on_hand from public.inventory where variant_id = (select id from v)), 1, 'stock decremented by the ordered quantity');
select is((select count(*)::int from public.inventory_movements where reference_id = ((select r from o1) ->> 'order_id')::uuid and reason = 'order'), 1, 'inventory movement recorded');
select is((select status::text from public.orders where id = ((select r from o1) ->> 'order_id')::uuid), 'pending', 'new orders start pending');
select is((select count(*)::int from public.order_status_history where order_id = ((select r from o1) ->> 'order_id')::uuid), 1, 'status history started');

-- ── Idempotency ─────────────────────────────────────────────────────────
select is((public.place_order(pg_temp.payload('pgtap-order-key-0001', 2), null, null)) ->> 'duplicate', 'true', 'same idempotency key returns the original order');
select is((select on_hand from public.inventory where variant_id = (select id from v)), 1, 'a retried request does not decrement stock again');

-- ── Overselling ─────────────────────────────────────────────────────────
select throws_ok($$ select public.place_order(pg_temp.payload('pgtap-order-key-0002', 2), null, null) $$, '22023', 'CART_INVALID', 'cannot order more than available');
select is((select on_hand from public.inventory where variant_id = (select id from v)), 1, 'failed order leaves stock untouched');
select throws_ok($$ update public.inventory set on_hand = -1 where variant_id = (select id from v) $$, '23514', null, 'stock can never go negative');

-- ── Discount usage limits ───────────────────────────────────────────────
update public.inventory set on_hand = 10 where variant_id = (select id from v);
create temp table o2 as select public.place_order(pg_temp.payload('pgtap-order-key-0003', 1, 'WELCOME10'), null, null) as r;
select is((select discount_total from public.orders where id = ((select r from o2) ->> 'order_id')::uuid), 76500.00, 'discount applied and stored on the order');
select throws_ok($$ select public.place_order(pg_temp.payload('pgtap-order-key-0004', 1, 'WELCOME10'), null, null) $$, '22023', 'DISCOUNT_INVALID', 'per-customer limit enforced');

-- ── Iraqi delivery details are validated server-side ────────────────────
select throws_ok($$ select public.place_order(pg_temp.payload('pgtap-order-key-0005', 1) || '{"phone_secondary": "0770 123 9876"}', null, null) $$,
  '22023', 'VALIDATION: phone_secondary', 'backup phone must differ from the main phone');
select throws_ok($$ select public.place_order(jsonb_set(pg_temp.payload('pgtap-order-key-0006', 1), '{shipping_address,landmark}', '""'), null, null) $$,
  '22023', 'VALIDATION: shipping_address.landmark', 'nearest landmark is required');
update public.governorates set is_active = false where code = 'baghdad';
select throws_ok($$ select public.place_order(pg_temp.payload('pgtap-order-key-0007', 1), null, null) $$,
  '22023', 'VALIDATION: shipping_address.governorate', 'orders to a paused governorate are refused');
update public.governorates set is_active = true where code = 'baghdad';

-- ── Status transitions (mirrors packages/shared ORDER_TRANSITIONS) ──────
select ok(public.order_transition_allowed('pending', 'confirmed') and public.order_transition_allowed('shipped', 'delivered') and public.order_transition_allowed('delivered', 'returned'), 'forward path allowed');
select ok(not public.order_transition_allowed('pending', 'shipped') and not public.order_transition_allowed('cancelled', 'pending') and not public.order_transition_allowed('shipped', 'cancelled'), 'skips and revivals rejected');

-- Staff actions require permissions (temp fixtures must be readable after the role switch)
grant select on v, o1, o2 to authenticated;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', json_build_object('sub', md5('user:content@vovian.local')::uuid, 'role', 'authenticated')::text, true);
select throws_ok(format($$ select public.admin_update_order_status(%L, 'confirmed') $$, (select r from o1) ->> 'order_id'), '42501', null, 'content manager cannot change order status');
select throws_ok(format($$ select public.admin_adjust_inventory(%L, 5) $$, (select id from v)), '42501', null, 'content manager cannot adjust stock');

select set_config('request.jwt.claims', json_build_object('sub', md5('user:orders@vovian.local')::uuid, 'role', 'authenticated')::text, true);
select throws_ok(format($$ select public.admin_update_order_status(%L, 'delivered') $$, (select r from o1) ->> 'order_id'), '22023', null, 'invalid transition rejected even for order managers');
select lives_ok(format($$ select public.admin_update_order_status(%L, 'cancelled', 'pgTAP') $$, (select r from o2) ->> 'order_id'), 'order manager can cancel');

select set_config('role', 'postgres', true);
select is(
  (select times_used from public.discount_codes where code = 'WELCOME10'),
  (select count(*)::int from public.discount_usage du join public.discount_codes d on d.id = du.discount_id where d.code = 'WELCOME10'),
  'cancellation released the discount usage');

select * from finish();
rollback;
