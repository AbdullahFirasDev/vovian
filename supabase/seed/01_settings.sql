-- VOVIAN seed · store settings, shipping, discounts, navigation (Iraq)
begin;

insert into public.store_settings (key, value, is_public) values
  ('store', '{
     "name": "VOVIAN",
     "legal_name": "VOVIAN General Trading Co. Ltd.",
     "tagline": "Clothes for the long view",
     "email": "care@vovian.example",
     "phone": "+964 770 000 0000",
     "address": "14th of Ramadan Street, Al-Mansour, Baghdad, Iraq",
     "logo_url": null,
     "hours": "Saturday to Thursday, 10:00 to 20:00 (Baghdad time)",
     "translations": {"ar": {
       "legal_name": "شركة فوفيان للتجارة العامة المحدودة",
       "address": "شارع 14 رمضان، المنصور، بغداد، العراق",
       "hours": "من السبت إلى الخميس، 10:00 – 20:00 بتوقيت بغداد"
     }}
   }', true),
  ('currency', '{"code": "IQD", "symbol": "د.ع", "display_locale": "ar-IQ"}', true),
  ('languages', '{"default": "en", "enabled": ["en", "ar"]}', true),
  -- Iraq has no general VAT on retail clothing; enable and set a rate here if that changes.
  ('tax', '{"enabled": false, "inclusive": true, "rate": 0, "label": "Tax", "rates": {}}', true),
  ('checkout', '{"default_governorate": "baghdad", "guest_checkout": true, "country": "IQ"}', true),
  ('payment_methods', '[
     {"code": "cod", "enabled": true, "label": "Cash on delivery",
      "description": "Pay the courier in cash when your order arrives.",
      "translations": {"ar": {"label": "الدفع عند الاستلام", "description": "ادفع نقداً للمندوب عند وصول طلبك."}}},
     {"code": "manual", "enabled": true, "label": "ZainCash or bank transfer",
      "description": "Transfer the total after ordering. We ship once the payment is confirmed.",
      "instructions": "Send the order total to the VOVIAN ZainCash wallet 0780 000 0000, or by bank transfer to VOVIAN General Trading Co., Rafidain Bank, account 0000000000. Write your order number in the transfer note. Orders are held for 3 days.",
      "translations": {"ar": {"label": "زين كاش أو تحويل مصرفي", "description": "حوّل المبلغ بعد الطلب، ونشحن طلبك فور تأكيد الدفع.",
        "instructions": "أرسل إجمالي الطلب إلى محفظة زين كاش الخاصة بفوفيان 0780 000 0000، أو بحوالة مصرفية إلى شركة فوفيان للتجارة العامة، مصرف الرافدين، رقم الحساب 0000000000. اكتب رقم الطلب في ملاحظة التحويل. يُحجز الطلب لمدة 3 أيام."}}},
     {"code": "card", "enabled": false, "label": "Card", "provider": "online",
      "description": "Online card payments. Enable once a payment provider is configured.",
      "translations": {"ar": {"label": "بطاقة", "description": "الدفع الإلكتروني بالبطاقة."}}}
   ]', true),
  ('social', '{"instagram": "https://instagram.com/", "tiktok": "https://tiktok.com/", "facebook": "https://facebook.com/"}', true),
  ('seo', '{
     "title": "VOVIAN",
     "title_template": "%s · VOVIAN",
     "description": "VOVIAN makes considered clothing for women and men in Baghdad: tailoring, outerwear, knitwear and essentials, delivered across Iraq.",
     "og_image": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?sat=-100&w=1200&h=630&fit=crop"
   }', true),
  ('maintenance', '{"enabled": false, "message": "We are updating the store. Back shortly."}', true),
  ('announcement', '{"enabled": true, "text": "Free delivery in Baghdad on orders over IQD 150,000", "translations": {"ar": {"text": "توصيل مجاني داخل بغداد للطلبات فوق 150,000 د.ع"}}, "href": "/pages/shipping-policy"}', true),
  ('notifications', '{"order_email": "orders@vovian.example", "low_stock_email": "stock@vovian.example", "notify_on_order": true, "notify_on_low_stock": true}', false),
  ('brand', '{"primary": "#000000", "background": "#FFFFFF", "paper": "#F7F7F5"}', true);

-- ── Shipping by governorate ───────────────────────────────────────────────
insert into public.shipping_zones (id, name, regions, position) values
  (md5('zone:baghdad')::uuid,   'Baghdad',            array['baghdad'], 1),
  (md5('zone:kurdistan')::uuid, 'Kurdistan Region',   array['erbil', 'sulaymaniyah', 'duhok', 'halabja'], 2),
  (md5('zone:iraq')::uuid,      'Other governorates', array['*'], 9);

insert into public.shipping_methods (zone_id, code, name, description, translations, rate, free_over, min_days, max_days, position) values
  (md5('zone:baghdad')::uuid, 'standard', 'Standard delivery', 'Courier to your door',
     '{"ar": {"name": "توصيل عادي", "description": "مندوب حتى باب المنزل"}}', 5000, 150000, 1, 2, 1),
  (md5('zone:baghdad')::uuid, 'same-day', 'Same-day delivery', 'Order before 2 pm',
     '{"ar": {"name": "توصيل في نفس اليوم", "description": "للطلبات قبل الساعة 2 ظهراً"}}', 10000, null, 0, 0, 2),
  (md5('zone:kurdistan')::uuid, 'standard', 'Standard delivery', 'Courier to your door',
     '{"ar": {"name": "توصيل عادي", "description": "مندوب حتى باب المنزل"}}', 8000, 250000, 2, 4, 1),
  (md5('zone:iraq')::uuid, 'standard', 'Standard delivery', 'Courier to your door',
     '{"ar": {"name": "توصيل عادي", "description": "مندوب حتى باب المنزل"}}', 7000, 250000, 2, 3, 1);

-- ── Discounts (IQD) ────────────────────────────────────────────────────────
insert into public.discount_codes (code, description, type, value, scope, category_ids, min_order_value, usage_limit, usage_limit_per_customer, starts_at, expires_at, is_active) values
  ('WELCOME10', '10% off a first order', 'percentage', 10, 'all', '{}', null, null, 1, now() - interval '90 days', null, true),
  ('VOVIAN50',  'IQD 50,000 off orders over IQD 400,000', 'fixed', 50000, 'all', '{}', 400000, 500, null, now() - interval '30 days', now() + interval '90 days', true),
  ('FREESHIP',  'Free delivery over IQD 100,000', 'free_shipping', 0, 'all', '{}', 100000, null, null, null, null, true),
  ('KNIT20',    '20% off knitwear', 'percentage', 20, 'categories',
     array[md5('category:women:knitwear')::uuid, md5('category:men:knitwear')::uuid], null, null, null, null, now() + interval '60 days', true),
  ('SUMMER25',  'Last season — expired', 'percentage', 25, 'all', '{}', null, null, null, now() - interval '200 days', now() - interval '100 days', true);

-- ── Navigation ─────────────────────────────────────────────────────────────
insert into public.navigation_menus (handle, name, items) values
  ('main', 'Main navigation', '[
    {"label": "Women", "href": "/women", "mega": "women", "translations": {"ar": {"label": "نساء"}},
     "image": "https://images.unsplash.com/photo-1617922001439-4a2e6562f328", "image_caption": "Tailored sheath dress", "image_href": "/products/tailored-sheath-dress"},
    {"label": "Men", "href": "/men", "mega": "men", "translations": {"ar": {"label": "رجال"}},
     "image": "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599", "image_caption": "Suede overshirt jacket", "image_href": "/products/suede-overshirt-jacket"},
    {"label": "New arrivals", "href": "/new-arrivals", "translations": {"ar": {"label": "وصل حديثاً"}}},
    {"label": "Collections", "href": "/collections", "mega": "collections", "translations": {"ar": {"label": "المجموعات"}}}
  ]'),
  ('footer-shop', 'Footer · Shop', '[
    {"label": "Women", "href": "/women", "translations": {"ar": {"label": "نساء"}}},
    {"label": "Men", "href": "/men", "translations": {"ar": {"label": "رجال"}}},
    {"label": "New arrivals", "href": "/new-arrivals", "translations": {"ar": {"label": "وصل حديثاً"}}},
    {"label": "Best sellers", "href": "/best-sellers", "translations": {"ar": {"label": "الأكثر مبيعاً"}}},
    {"label": "Sale", "href": "/sale", "translations": {"ar": {"label": "التخفيضات"}}},
    {"label": "Collections", "href": "/collections", "translations": {"ar": {"label": "المجموعات"}}}
  ]'),
  ('footer-help', 'Footer · Client care', '[
    {"label": "Contact us", "href": "/contact", "translations": {"ar": {"label": "اتصل بنا"}}},
    {"label": "Track an order", "href": "/track-order", "translations": {"ar": {"label": "تتبع الطلب"}}},
    {"label": "Delivery", "href": "/pages/shipping-policy", "translations": {"ar": {"label": "التوصيل"}}},
    {"label": "Returns & exchanges", "href": "/pages/returns", "translations": {"ar": {"label": "الإرجاع والاستبدال"}}},
    {"label": "Size guide", "href": "/size-guide", "translations": {"ar": {"label": "دليل المقاسات"}}},
    {"label": "FAQ", "href": "/pages/faq", "translations": {"ar": {"label": "الأسئلة الشائعة"}}}
  ]'),
  ('footer-company', 'Footer · Company', '[
    {"label": "About VOVIAN", "href": "/about", "translations": {"ar": {"label": "عن فوفيان"}}},
    {"label": "Privacy policy", "href": "/pages/privacy", "translations": {"ar": {"label": "سياسة الخصوصية"}}},
    {"label": "Terms & conditions", "href": "/pages/terms", "translations": {"ar": {"label": "الشروط والأحكام"}}}
  ]');

commit;
