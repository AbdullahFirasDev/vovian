-- VOVIAN seed · LOCAL DEMO ONLY: staff accounts (one per role), customers and
-- historical orders created through the real place_order() pipeline.
-- Never run against production (supabase db push does not apply seeds).
begin;

create or replace function pg_temp.create_user(p_email text, p_password text, p_name text, p_phone text, p_created timestamptz)
returns uuid language plpgsql as $$
declare v_id uuid := md5('user:' || p_email)::uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), p_created,
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_name, 'phone', p_phone),
    p_created, p_created, '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
          'email', p_created, p_created, p_created);
  update public.profiles set created_at = p_created where id = v_id;
  return v_id;
end $$;

-- ── Staff: one account per role (password: Vovian!Admin2026) ──────────────
select pg_temp.create_user('admin@vovian.local',     'Vovian!Admin2026', 'دعاء الحسني',     '+9647700000001', now() - interval '400 days');
select pg_temp.create_user('manager@vovian.local',   'Vovian!Admin2026', 'أحمد الجنابي',    '+9647700000002', now() - interval '380 days');
select pg_temp.create_user('products@vovian.local',  'Vovian!Admin2026', 'سارة النعيمي',    '+9647700000003', now() - interval '300 days');
select pg_temp.create_user('orders@vovian.local',    'Vovian!Admin2026', 'علي الخفاجي',     '+9647700000004', now() - interval '250 days');
select pg_temp.create_user('inventory@vovian.local', 'Vovian!Admin2026', 'يوسف الشمري',     '+9647700000005', now() - interval '200 days');
select pg_temp.create_user('content@vovian.local',   'Vovian!Admin2026', 'هبة البياتي',     '+9647700000006', now() - interval '150 days');

insert into public.user_roles (user_id, role) values
  (md5('user:admin@vovian.local')::uuid,     'super_admin'),
  (md5('user:manager@vovian.local')::uuid,   'store_manager'),
  (md5('user:products@vovian.local')::uuid,  'product_manager'),
  (md5('user:orders@vovian.local')::uuid,    'order_manager'),
  (md5('user:inventory@vovian.local')::uuid, 'inventory_manager'),
  (md5('user:content@vovian.local')::uuid,   'content_manager');

-- ── Customers (password: Customer!2026) ───────────────────────────────────
-- Phones are typed the way customers type them (07…); place_order() stores +9647….
create temp table demo_customers (email text, name text, phone text, phone2 text, governorate text, area text, landmark text, days integer) on commit drop;
insert into demo_customers values
  ('zahraa@example.com',  'زهراء الهاشمي',  '07701234567', '07801234567', 'baghdad',      'المنصور',               'قرب جامع أم الطبول',           120),
  ('mustafa@example.com', 'مصطفى العبيدي',  '07809876543', null,          'baghdad',      'الكرادة داخل',          'قرب مستشفى الراهبات',          110),
  ('noor@example.com',    'نور الدليمي',    '07711122233', null,          'anbar',        'الرمادي - حي التأميم',   'قرب مستشفى الرمادي التعليمي',    95),
  ('ali@example.com',     'علي الموسوي',    '07801112223', '07701112223', 'basra',        'العشار',                'قرب كورنيش شط العرب',           90),
  ('shilan@example.com',  'شيلان كريم',     '07501234567', null,          'erbil',        'شارع 100',              'قرب فاميلي مول',                85),
  ('hussein@example.com', 'حسين الكعبي',    '07812223344', null,          'najaf',        'حي الأمير',             'قرب ساحة ثورة العشرين',         70),
  ('mariam@example.com',  'مريم الجبوري',   '07723334455', '07823334455', 'nineveh',      'المجموعة الثقافية',      'قرب جامعة الموصل',              64),
  ('karrar@example.com',  'كرار الربيعي',   '07834445566', null,          'karbala',      'حي الحسين',             'قرب مستشفى الحسين التعليمي',     58),
  ('rusul@example.com',   'رسل الساعدي',    '07745556677', null,          'baghdad',      'زيونة',                 'قرب مول زيونة',                 40),
  ('dilan@example.com',   'ديلان أحمد',     '07506667788', '07706667788', 'sulaymaniyah', 'شارع سالم',             'قرب جامعة السليمانية',          33),
  ('sajad@example.com',   'سجاد التميمي',   '07817778899', null,          'dhi-qar',      'الناصرية - حي الحبوبي',  'قرب ساحة الحبوبي',              21),
  ('tabarak@example.com', 'تبارك العزاوي',  '07728889900', null,          'diyala',       'بعقوبة - حي المعلمين',   'قرب مستشفى بعقوبة التعليمي',     12);

select pg_temp.create_user(email, 'Customer!2026', name, public.normalize_iq_phone(phone), now() - make_interval(days => days)) from demo_customers;

insert into public.addresses (user_id, label, full_name, phone, phone_secondary, governorate, area, landmark, is_default)
select md5('user:' || email)::uuid, 'البيت', name, public.normalize_iq_phone(phone), public.normalize_iq_phone(phone2), governorate, area, landmark, true
from demo_customers;

update public.profiles set status = 'vip', staff_notes = 'Prefers same-day delivery. Fitting booked twice in the Al-Mansour studio.'
where email = 'zahraa@example.com';

-- ── Historical orders through place_order() ───────────────────────────────
do $$
declare
  v_customer record;
  v_items jsonb;
  v_method uuid;
  v_result jsonb;
  v_order_id uuid;
  v_age interval;
  v_final text;
  v_steps text[];
  v_step text;
  v_i integer;
  v_n integer;
  v_guest boolean;
  v_email text;
  v_code text;
begin
  perform setseed(0.4242);

  for v_i in 1..46 loop
    select * into v_customer from demo_customers order by random() limit 1;
    v_guest := random() < 0.2;
    v_email := case when v_guest then 'guest' || v_i || '@example.com' else v_customer.email end;

    -- 1–3 in-stock variants, quantity 1–2
    select jsonb_agg(jsonb_build_object('variant_id', x.id, 'quantity', x.qty))
    into v_items
    from (
      select v.id, 1 + (random() < 0.2)::integer as qty
      from public.product_variants v join public.inventory i on i.variant_id = v.id
      where i.on_hand > 6
      order by random()
      limit 1 + floor(random() * 3)::integer
    ) x;

    select sm.id into v_method from public.shipping_methods sm
    where sm.zone_id = (select id from public.shipping_zones z
                        where v_customer.governorate = any (z.regions) or '*' = any (z.regions)
                        order by (v_customer.governorate = any (z.regions)) desc limit 1)
    order by random() limit 1;

    v_code := case when random() < 0.12 then 'VOVIAN50' when random() < 0.1 then 'FREESHIP' else null end;

    begin
      v_result := public.place_order(
        jsonb_build_object(
          'idempotency_key', 'seed-order-' || lpad(v_i::text, 4, '0') || '-abcdefgh',
          'email', v_email, 'full_name', v_customer.name, 'phone', v_customer.phone, 'phone_secondary', v_customer.phone2,
          'shipping_address', jsonb_build_object('governorate', v_customer.governorate, 'area', v_customer.area, 'landmark', v_customer.landmark),
          'shipping_method_id', v_method,
          'payment_method', case when random() < 0.7 then 'cod' else 'manual' end,
          'discount_code', v_code,
          'items', v_items
        ),
        case when v_guest then null else md5('user:' || v_customer.email)::uuid end,
        '127.0.0.1'
      );
    exception when others then
      -- e.g. discount minimum not met: retry without a code
      v_result := public.place_order(
        jsonb_build_object(
          'idempotency_key', 'seed-order-' || lpad(v_i::text, 4, '0') || '-retryxyz',
          'email', v_email, 'full_name', v_customer.name, 'phone', v_customer.phone, 'phone_secondary', v_customer.phone2,
          'shipping_address', jsonb_build_object('governorate', v_customer.governorate, 'area', v_customer.area, 'landmark', v_customer.landmark),
          'shipping_method_id', v_method, 'payment_method', 'cod', 'items', v_items
        ),
        case when v_guest then null else md5('user:' || v_customer.email)::uuid end,
        '127.0.0.1'
      );
    end;

    v_order_id := (v_result ->> 'order_id')::uuid;
    v_n := 47 - v_i;  -- older orders first
    v_age := make_interval(days => least(v_n * 1.3, 58)::integer, hours => floor(random() * 20)::integer);

    -- Lifecycle based on age
    v_final := case
      when v_n <= 2 then 'pending'
      when v_n <= 4 then 'confirmed'
      when v_n <= 6 then 'processing'
      when v_n <= 9 then 'shipped'
      when random() < 0.08 then 'cancelled'
      when random() < 0.05 then 'returned'
      else 'delivered'
    end;

    v_steps := case v_final
      when 'pending'    then array[]::text[]
      when 'confirmed'  then array['confirmed']
      when 'processing' then array['confirmed', 'processing']
      when 'shipped'    then array['confirmed', 'processing', 'shipped']
      when 'delivered'  then array['confirmed', 'processing', 'shipped', 'delivered']
      when 'cancelled'  then array['cancelled']
      when 'returned'   then array['confirmed', 'processing', 'shipped', 'delivered', 'returned']
    end;

    foreach v_step in array v_steps loop
      perform private.apply_order_status(v_order_id, v_step::public.order_status, null, md5('user:orders@vovian.local')::uuid, true);
    end loop;

    -- Bank transfers were confirmed before the order moved on
    if v_final not in ('pending', 'cancelled') then
      update public.payments set status = 'paid', reference = 'TRF-' || upper(substr(md5(v_order_id::text), 1, 8))
      where order_id = v_order_id and provider = 'manual' and status = 'pending';
      update public.orders set payment_status = 'paid' where id = v_order_id and payment_method = 'manual';
    end if;

    if v_final in ('shipped', 'delivered', 'returned') then
      update public.orders set tracking_number = 'VV' || (100000000 + floor(random() * 899999999))::bigint,
                               tracking_url = 'https://track.example-courier.iq/'
      where id = v_order_id;
    end if;

    -- Backdate everything to the order's age, spacing status steps a day apart
    update public.orders set
      created_at = now() - v_age,
      confirmed_at = case when confirmed_at is not null then now() - v_age + interval '3 hours' end,
      shipped_at = case when shipped_at is not null then now() - v_age + interval '1 day' end,
      delivered_at = case when delivered_at is not null then now() - v_age + interval '3 days' end,
      cancelled_at = case when cancelled_at is not null then now() - v_age + interval '5 hours' end
    where id = v_order_id;

    update public.order_status_history h set created_at = now() - v_age + (x.rn - 1) * interval '20 hours'
    from (select id, row_number() over (order by id) as rn from public.order_status_history where order_id = v_order_id) x
    where h.id = x.id;

    update public.payments set created_at = now() - v_age where order_id = v_order_id;
    update public.order_items set created_at = now() - v_age where order_id = v_order_id;
    update public.inventory_movements set created_at = now() - v_age where reference_id = v_order_id;
  end loop;
end $$;

-- Seeded orders generated notifications; keep only a few recent ones unread.
update public.notifications set read_at = now() where created_at < now() - interval '1 minute' or audience = 'customer';
update public.notifications set read_at = null
where id in (select id from public.notifications where audience = 'staff' order by created_at desc limit 4);

-- A few newsletter subscribers and a contact message
insert into public.newsletter_subscribers (email, locale, source, created_at) values
  ('zahraa@example.com', 'ar', 'footer', now() - interval '100 days'),
  ('shilan@example.com', 'ar', 'homepage', now() - interval '80 days'),
  ('karrar@example.com', 'ar', 'checkout', now() - interval '30 days'),
  ('reader@example.com', 'en', 'homepage', now() - interval '2 days');

insert into public.contact_messages (name, email, topic, message, created_at) values
  ('شيلان كريم', 'shilan@example.com', 'sizing', 'هل المعطف الصوفي بالحزام واسع؟ عادةً ألبس مقاس S في التريكو عندكم. وكم يستغرق التوصيل إلى أربيل؟', now() - interval '3 days');

commit;
