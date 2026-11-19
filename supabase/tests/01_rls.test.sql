-- Row Level Security: customers see only their own data; anonymous visitors
-- see only the public catalogue; staff see what their role permits.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

create or replace function pg_temp.act_as(p_email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', md5('user:' || p_email)::uuid, 'role', 'authenticated')::text, true);
end $$;
create or replace function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;
create or replace function pg_temp.reset_role() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- A draft product that must stay hidden
insert into public.products (slug, style_code, name, department, price, status)
values ('rls-hidden-draft', 'RLS-DRAFT-1', 'Hidden Draft', 'women', 100, 'draft');

-- ── Anonymous ────────────────────────────────────────────────────────────
select pg_temp.act_as_anon();
select ok((select count(*) from public.products) > 40, 'anon sees active products');
select is((select count(*)::int from public.products where slug = 'rls-hidden-draft'), 0, 'anon cannot see draft products');
select throws_ok($$ select count(*) from public.orders $$, '42501', null, 'anon cannot read orders at all');
select is((select count(*)::int from public.discount_codes), 0, 'anon cannot list discount codes');
select is((select count(*)::int from public.store_settings where key = 'notifications'), 0, 'anon cannot read private settings');
select ok((select count(*) from public.store_settings where key = 'currency') = 1, 'anon can read public settings');
select throws_ok($$ insert into public.reviews (product_id, author_name, rating) select id, 'x', 5 from public.products limit 1 $$, '42501', null, 'anon cannot write reviews');

-- ── Customer ─────────────────────────────────────────────────────────────
select pg_temp.act_as('zahraa@example.com');
select ok((select count(*) from public.orders) > 0, 'customer sees their own orders');
select is(
  (select count(*)::int from public.orders where user_id <> md5('user:zahraa@example.com')::uuid or user_id is null), 0,
  'customer sees no one else''s orders'
);
select is((select count(*)::int from public.profiles), 1, 'customer sees only their own profile');
select is((select count(*)::int from public.addresses where user_id <> md5('user:zahraa@example.com')::uuid), 0, 'customer sees only their own addresses');
select throws_ok($$ update public.profiles set status = 'vip' where id = md5('user:zahraa@example.com')::uuid $$, '42501', null, 'customer cannot change staff-managed profile columns');
select lives_ok($$ update public.profiles set full_name = 'Layla M.' where id = md5('user:zahraa@example.com')::uuid $$, 'customer can edit their own name');
select throws_ok($$ insert into public.orders (email, phone, customer_name, shipping_address, shipping_method_name, payment_method, subtotal, total, idempotency_key) values ('a@b.co','+9647700000000','x','{}','x','cod',1,1,'rls-direct-insert-xxxx') $$, '42501', null, 'customer cannot insert orders directly');
select throws_ok($$ update public.inventory set on_hand = 999 $$, '42501', null, 'customer cannot touch inventory');
select throws_ok($$ select public.place_order('{}'::jsonb, null, null) $$, '42501', null, 'customer cannot call place_order (edge function only)');
select is((select count(*)::int from public.products where slug = 'rls-hidden-draft'), 0, 'customer cannot see draft products');

-- ── Staff by role ────────────────────────────────────────────────────────
select pg_temp.act_as('content@vovian.local');
select is((select count(*)::int from public.orders), 0, 'content manager cannot read orders');
select pg_temp.act_as('orders@vovian.local');
select ok((select count(*) from public.orders) > 40, 'order manager reads all orders');
select pg_temp.act_as('products@vovian.local');
select is((select count(*)::int from public.products where slug = 'rls-hidden-draft'), 1, 'product manager sees drafts');

select pg_temp.reset_role();
select * from finish();
rollback;
