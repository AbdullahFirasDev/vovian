-- Server-side pricing in Iraqi dinars: quotes, discounts, delivery by governorate, tax.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Fixed basket: 1 × Belted Wool Coat (Camel, M) = 765,000 + 2 × Essential Crew Tee (Black, L) = 2 × 85,000
update public.inventory set on_hand = 50
where variant_id in (select id from public.product_variants where sku in ('VW-OW-0701-CAM-M', 'VM-TS-1001-BLA-L', 'VW-KN-0301-TAN-M'));

create temp table basket as
select jsonb_build_array(
  jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VW-OW-0701-CAM-M'), 'quantity', 1),
  jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L'), 'quantity', 2)
) as items;
create temp table tee as
select jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L'), 'quantity', 1)) as items;

create temp table q as select public.quote_cart((select items from basket), null, null, 'baghdad') as r;
select is(((select r from q) ->> 'subtotal')::numeric, 935000.00, 'subtotal = 765,000 + 2 × 85,000');
select is((select r from q) ->> 'currency', 'IQD', 'quotes are in Iraqi dinars');
select is(((select r from q) ->> 'shipping_total')::numeric, 0.00, 'Baghdad delivery is free over 150,000');
select is(((select r from q) ->> 'tax_total')::numeric, 0.00, 'no VAT is charged in Iraq');
select is(((select r from q) ->> 'total')::numeric, 935000.00, 'total = subtotal');

-- Client-supplied prices are ignored and duplicate lines merge
select is(
  ((public.quote_cart(jsonb_build_array(
    jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L'), 'quantity', 1, 'price', 1),
    jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L'), 'quantity', 1)
  ), null, null, 'baghdad')) ->> 'subtotal')::numeric,
  170000.00, 'duplicate lines merge and injected prices are ignored');

-- Delivery by governorate
select is(((public.quote_cart((select items from tee), null, null, 'baghdad')) ->> 'shipping_total')::numeric, 5000.00, 'Baghdad standard delivery: 5,000');
select is(((public.quote_cart((select items from tee), null, null, 'erbil')) ->> 'shipping_total')::numeric, 8000.00, 'Kurdistan Region delivery: 8,000');
select is(((public.quote_cart((select items from tee), null, null, 'basra')) ->> 'shipping_total')::numeric, 7000.00, 'other governorates fall back to 7,000');

-- Discounts
select is(((public.quote_cart((select items from basket), 'WELCOME10', null, 'baghdad')) ->> 'discount_total')::numeric, 93500.00, 'WELCOME10 takes 10%');
select is(((public.quote_cart((select items from basket), 'VOVIAN50', null, 'baghdad')) ->> 'discount_total')::numeric, 50000.00, 'VOVIAN50 takes 50,000 over 400,000');
select is((public.quote_cart((select items from tee), 'VOVIAN50', null, 'baghdad')) -> 'discount' ->> 'reason', 'min_order', 'VOVIAN50 rejected under the minimum');
select is((public.quote_cart((select items from basket), 'SUMMER25', null, 'baghdad')) -> 'discount' ->> 'reason', 'expired', 'expired code is rejected');
select is(
  ((public.quote_cart(jsonb_build_array(
    jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VW-KN-0301-TAN-M'), 'quantity', 1),
    jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L'), 'quantity', 1)
  ), 'KNIT20', null, 'baghdad')) ->> 'discount_total')::numeric,
  43000.00, 'KNIT20 discounts only the 215,000 sweater (20%)');
select is(
  ((public.quote_cart(jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VW-KN-0301-TAN-M'), 'quantity', 1)), 'FREESHIP', null, 'basra')) ->> 'shipping_total')::numeric,
  0.00, 'FREESHIP removes the Basra delivery fee');

-- Sale price
select is(
  ((public.quote_cart(jsonb_build_array(jsonb_build_object('variant_id', (select id from public.product_variants where sku = 'VW-DR-0102-SCA-M'), 'quantity', 1)), null, null, 'baghdad')) -> 'lines' -> 0 ->> 'unit_price')::numeric,
  375000.00, 'sale price is used for the unit price');

-- Stock issues are reported: two tees requested, one left
update public.inventory set on_hand = 1 where variant_id = (select id from public.product_variants where sku = 'VM-TS-1001-BLA-L');
select is(
  (public.quote_cart((select items from basket), null, null, 'baghdad')) -> 'issues' -> 0 ->> 'code',
  'insufficient_stock', 'quote flags lines above available stock');

select * from finish();
rollback;
