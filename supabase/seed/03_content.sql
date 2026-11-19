-- VOVIAN seed · homepage content & static pages (all editable from the admin)
begin;

-- ── Banners ────────────────────────────────────────────────────────────────
insert into public.homepage_banners (placement, title, subtitle, body, translations, image_url, image_url_secondary, cta_label, cta_href, cta_secondary_label, cta_secondary_href, position) values
  ('hero', 'Autumn–Winter 2026', 'Wool, leather and the long view',
   'Coats cut to be worn for a decade. Tailoring finished by hand.',
   '{"ar": {"title": "خريف وشتاء ٢٠٢٦", "subtitle": "صوف وجلد ونظرة بعيدة", "body": "معاطف مفصّلة لتُرتدى عقداً كاملاً، وخياطة منتهية يدوياً.", "cta_label": "تسوقي للنساء", "cta_secondary_label": "تسوق للرجال"}}',
   'https://images.unsplash.com/photo-1550639525-c97d455acf70?sat=-100',
   'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?sat=-100',
   'Shop women', '/women', 'Shop men', '/men', 1),
  ('campaign', 'Città', 'Autumn–Winter 26, photographed in Milan',
   'A week walking the city in powder-blue wool. The oversized trench, the belted coat and the boots that carried us between them.',
   '{"ar": {"title": "تشيتا", "subtitle": "خريف وشتاء ٢٦، صُوّرت في ميلانو", "body": "أسبوع نتجول في المدينة بصوف أزرق فاتح: الترنش الواسع والمعطف ذو الحزام والأحذية التي حملتنا بينهما.", "cta_label": "اكتشف المجموعة"}}',
   'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?sat=-100',
   'https://images.unsplash.com/photo-1539109136881-3be0616acf4b',
   'Discover the collection', '/collections/winter-atelier', null, null, 1);

-- ── Sections (ordered) ─────────────────────────────────────────────────────
insert into public.homepage_sections (type, title, subtitle, body, translations, config, position) values
  ('hero', null, null, null, '{}', '{}', 1),
  ('editorial_intro', 'Fewer, better, longer.', null,
   'VOVIAN began in a small studio in Al-Mansour, Baghdad, with one rule: make each piece good enough to keep. We work with mills in Biella and Porto, finish by hand in Baghdad, and repair what we sell.',
   '{"ar": {"title": "أقل، أفضل، أطول عمراً.", "body": "بدأت فوفيان في استوديو صغير في المنصور ببغداد بقاعدة واحدة: أن تكون كل قطعة جديرة بالاحتفاظ بها. نعمل مع مصانع النسيج في بييلا وبورتو، وننهي القطع يدوياً في بغداد، ونصلح ما نبيعه."}}',
   '{"images": [
      {"url": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?sat=-100", "alt": "Coats on a rail in the VOVIAN studio"},
      {"url": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?sat=-100", "alt": "Knitwear samples hanging in natural light"}
    ], "link": {"label": "About VOVIAN", "href": "/about", "translations": {"ar": {"label": "عن فوفيان"}}}}', 2),
  ('categories', 'Shop by category', null, null,
   '{"ar": {"title": "تسوق حسب الفئة"}}',
   '{"items": [
      {"label": "Women", "href": "/women", "image": "https://images.unsplash.com/photo-1554412933-514a83d2f3c8", "translations": {"ar": {"label": "نساء"}}},
      {"label": "Men", "href": "/men", "image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7", "translations": {"ar": {"label": "رجال"}}},
      {"label": "New arrivals", "href": "/new-arrivals", "image": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e", "translations": {"ar": {"label": "وصل حديثاً"}}},
      {"label": "Best sellers", "href": "/best-sellers", "image": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3", "translations": {"ar": {"label": "الأكثر مبيعاً"}}},
      {"label": "Accessories", "href": "/accessories", "image": "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93", "translations": {"ar": {"label": "إكسسوارات"}}}
    ]}', 3),
  ('featured_collections', 'Collections', null, null, '{"ar": {"title": "المجموعات"}}', '{}', 4),
  ('new_arrivals', 'New arrivals', 'Just in this week', null,
   '{"ar": {"title": "وصل حديثاً", "subtitle": "وصل هذا الأسبوع"}}', '{"limit": 8, "href": "/new-arrivals"}', 5),
  ('campaign', null, null, null, '{}', '{"three": true}', 6),
  ('best_sellers', 'Best sellers', 'What our clients come back for', null,
   '{"ar": {"title": "الأكثر مبيعاً", "subtitle": "ما يعود إليه عملاؤنا"}}', '{"limit": 8, "href": "/best-sellers"}', 7),
  ('philosophy', 'Made to be kept', null,
   'Every VOVIAN piece carries a lifetime repair promise. Bring it to our Al-Mansour studio, or send it with any courier, with a loose button, a split seam or a worn elbow, and our atelier will mend it at no charge.',
   '{"ar": {"title": "صُنعت لتبقى", "body": "كل قطعة من فوفيان تحمل وعداً بالإصلاح مدى الحياة. أحضرها إلى الاستوديو في المنصور أو أرسلها مع أي مندوب إن انفك زر أو انفتق درز أو بلي مرفق، وسيصلحها الأتيليه مجاناً."}}',
   '{"image": {"url": "https://images.unsplash.com/photo-1504198458649-3128b932f49e?sat=-100", "alt": "Folded knitwear on a chair"},
     "points": [
       {"title": "Natural fibres", "body": "Wool, cotton, silk, linen and leather from mills we have visited.", "translations": {"ar": {"title": "ألياف طبيعية", "body": "صوف وقطن وحرير وكتان وجلد من مصانع زرناها بأنفسنا."}}},
       {"title": "Small runs", "body": "We cut to order in batches, so little is left over at the end of a season.", "translations": {"ar": {"title": "كميات صغيرة", "body": "نقص على دفعات حسب الطلب، فلا يتبقى إلا القليل في نهاية الموسم."}}},
       {"title": "Free repairs", "body": "For as long as you own the piece.", "translations": {"ar": {"title": "إصلاح مجاني", "body": "طوال فترة امتلاكك للقطعة."}}}
     ]}', 8),
  ('newsletter', 'Letters from the studio', null,
   'New collections, restocks and the occasional essay. Once a month, no more.',
   '{"ar": {"title": "رسائل من الاستوديو", "body": "مجموعات جديدة وإعادة توفر ومقالات بين حين وآخر. مرة في الشهر، لا أكثر."}}', '{}', 9);

-- ── Static pages (Markdown) ────────────────────────────────────────────────
insert into public.pages (slug, title, summary, body, translations) values
('about', 'About VOVIAN', 'A Baghdad studio making clothes for the long view.',
$md$
VOVIAN was founded in 2019 in a small studio on 14th of Ramadan Street in Al-Mansour, Baghdad. We design for women and men who would rather own fewer things and wear them longer.

## How we make

We source wool from Biella, cotton from Porto and leather from a vegetable tannery outside Florence. Patterns are cut and finished in our Baghdad studio; production runs are small and close to demand.

## What we promise

- **Honest materials.** Every product page lists exactly what it is made of.
- **Repairs for life.** Bring any VOVIAN piece back and our atelier will mend it at no charge.
- **Fair returns.** 14 days to return or exchange unworn pieces.

## Visit

Our studio and fitting room in Al-Mansour are open Saturday to Thursday, 10:00 to 20:00. Book a fitting through [Contact](/contact).
$md$,
$json${"ar": {"title": "عن فوفيان", "summary": "استوديو في بغداد يصنع ملابس تدوم طويلاً.", "body": "تأسست فوفيان عام 2019 في استوديو صغير في شارع 14 رمضان بالمنصور في بغداد. نصمم للنساء والرجال الذين يفضلون امتلاك أشياء أقل وارتداءها لفترة أطول.\n\n## كيف نصنع\n\nنحصل على الصوف من بييلا والقطن من بورتو والجلد من مدبغة نباتية قرب فلورنسا. تُقص القطع وتُنهى في الاستوديو ببغداد، والإنتاج بكميات صغيرة قريبة من الطلب.\n\n## ما نعد به\n\n- **مواد صادقة.** كل صفحة منتج تذكر بدقة مكوناته.\n- **إصلاح مدى الحياة.** أعد أي قطعة من فوفيان وسيصلحها الأتيليه مجاناً.\n- **إرجاع عادل.** 14 يوماً لإرجاع أو استبدال القطع غير المستخدمة.\n\n## زيارتنا\n\nالاستوديو وغرفة القياس في المنصور مفتوحان من السبت إلى الخميس، من 10:00 إلى 20:00. احجز موعداً عبر [اتصل بنا](/contact)."}}$json$::jsonb),

('shipping-policy', 'Delivery', 'We deliver to every governorate in Iraq.',
$md$
## Delivery times and costs

| Governorate | Delivery | Cost |
| --- | --- | --- |
| Baghdad | 1–2 days | IQD 5,000. Free over IQD 150,000 |
| Baghdad, same day | Order before 2 pm | IQD 10,000 |
| Erbil, Sulaymaniyah, Duhok, Halabja | 2–4 days | IQD 8,000. Free over IQD 250,000 |
| All other governorates | 2–3 days | IQD 7,000. Free over IQD 250,000 |

Delivery days are Saturday to Thursday. Orders confirmed before 2 pm leave our studio the same day.

## What we need from you

Your governorate, your area or neighbourhood and the **nearest landmark** (a mosque, school, market or square), plus a phone number the courier can reach. A backup number helps if your phone is off.

## Before the courier arrives

The courier calls before delivery. You can inspect the pieces before paying cash on delivery. Track your order anytime on [Track an order](/track-order).
$md$,
$json${"ar": {"title": "التوصيل", "summary": "نوصل إلى جميع محافظات العراق.", "body": "## مدة التوصيل وكلفته\n\n| المحافظة | مدة التوصيل | الكلفة |\n| --- | --- | --- |\n| بغداد | 1–2 يوم | 5,000 د.ع. مجاني فوق 150,000 د.ع |\n| بغداد، نفس اليوم | للطلبات قبل الساعة 2 ظهراً | 10,000 د.ع |\n| أربيل، السليمانية، دهوك، حلبجة | 2–4 أيام | 8,000 د.ع. مجاني فوق 250,000 د.ع |\n| باقي المحافظات | 2–3 أيام | 7,000 د.ع. مجاني فوق 250,000 د.ع |\n\nأيام التوصيل من السبت إلى الخميس. الطلبات المؤكدة قبل الساعة 2 ظهراً تخرج من الاستوديو في اليوم نفسه.\n\n## ما نحتاجه منك\n\nالمحافظة والمنطقة أو الحي و**أقرب نقطة دالة** (جامع، مدرسة، سوق أو ساحة)، مع رقم هاتف يتواصل عليه المندوب. الرقم الاحتياطي يساعدنا إن كان هاتفك مغلقاً.\n\n## قبل وصول المندوب\n\nيتصل بك المندوب قبل التوصيل، ويمكنك معاينة القطع قبل الدفع عند الاستلام. تابع طلبك في أي وقت عبر [تتبع الطلب](/track-order)."}}$json$::jsonb),

('returns', 'Returns & exchanges', '14 days to return or exchange unworn pieces.',
$md$
## Our policy

You have **14 days** from delivery to return or exchange unworn, unwashed pieces with their tags attached. Exchanges for another size are free in Baghdad; in other governorates the courier fee for the return is IQD 5,000.

## How to return or exchange

1. Sign in and open the order under **Account › Orders**, or [contact us](/contact) with your order number.
2. Pack the pieces in their original packaging.
3. Hand the parcel to our courier when they collect it, or bring it to the Al-Mansour studio.

## Refunds

Cash-on-delivery orders are refunded in cash by the courier or by ZainCash, within 5 days of the parcel reaching us. Transfers are refunded to the same wallet or account.

## Exceptions

Earrings, swimwear and pieces altered to order cannot be returned unless faulty.
$md$,
$json${"ar": {"title": "الإرجاع والاستبدال", "summary": "14 يوماً لإرجاع أو استبدال القطع غير المستخدمة.", "body": "## سياستنا\n\nلديك **14 يوماً** من تاريخ التوصيل لإرجاع أو استبدال القطع غير المستخدمة وغير المغسولة مع بطاقاتها. الاستبدال بمقاس آخر مجاني داخل بغداد، وفي باقي المحافظات تبلغ أجرة مندوب الإرجاع 5,000 د.ع.\n\n## طريقة الإرجاع أو الاستبدال\n\n1. سجّل الدخول وافتح الطلب من **الحساب › الطلبات**، أو [تواصل معنا](/contact) مع رقم الطلب.\n2. ضع القطع في تغليفها الأصلي.\n3. سلّم الطرد لمندوبنا عند الاستلام، أو أحضره إلى الاستوديو في المنصور.\n\n## استرداد المبلغ\n\nطلبات الدفع عند الاستلام تُسترد نقداً عبر المندوب أو عبر زين كاش خلال 5 أيام من وصول الطرد إلينا. التحويلات تُسترد إلى المحفظة أو الحساب نفسه.\n\n## الاستثناءات\n\nالأقراط وملابس السباحة والقطع المعدلة حسب الطلب لا تُرجع إلا في حال وجود عيب."}}$json$::jsonb),

('faq', 'Frequently asked questions', 'Orders, sizing, delivery and care.',
$md$
## Orders

**Can I change my order after placing it?**
While it is still pending you can cancel it from your account and order again. Once confirmed, call or message us and we will do our best.

**How can I pay?**
Cash on delivery anywhere in Iraq, or ZainCash and bank transfer. Card payments are coming soon.

## Delivery

**Do you deliver outside Baghdad?**
Yes, to all governorates, including the Kurdistan Region. See [Delivery](/pages/shipping-policy).

**Why do you ask for the nearest landmark?**
It is how couriers find homes in Iraq. A mosque, school, market or square near you saves a phone call.

## Sizing

**How do VOVIAN sizes run?**
True to size unless the product page says otherwise. Each product links to the [size guide](/size-guide).

## Care & repairs

**What does the repair promise cover?**
Loose buttons, open seams, worn linings and elbows, for as long as you own the piece.
$md$,
$json${"ar": {"title": "الأسئلة الشائعة", "summary": "الطلبات والمقاسات والتوصيل والعناية.", "body": "## الطلبات\n\n**هل يمكنني تعديل طلبي بعد إرساله؟**\nما دام الطلب قيد الانتظار يمكنك إلغاؤه من حسابك وإعادة الطلب. بعد التأكيد اتصل بنا أو راسلنا وسنبذل جهدنا.\n\n**كيف أدفع؟**\nالدفع عند الاستلام في جميع أنحاء العراق، أو عبر زين كاش والتحويل المصرفي. الدفع بالبطاقة قريباً.\n\n## التوصيل\n\n**هل توصلون خارج بغداد؟**\nنعم، إلى جميع المحافظات بما فيها إقليم كردستان. راجع [التوصيل](/pages/shipping-policy).\n\n**لماذا تطلبون أقرب نقطة دالة؟**\nلأنها الطريقة التي يجد بها المندوب البيوت في العراق. ذكر جامع أو مدرسة أو سوق أو ساحة قريبة يوفر عليك اتصالاً.\n\n## المقاسات\n\n**كيف تأتي مقاسات فوفيان؟**\nمطابقة للمقاس المعتاد ما لم تذكر صفحة المنتج غير ذلك. راجع [دليل المقاسات](/size-guide).\n\n## العناية والإصلاح\n\n**ماذا يشمل وعد الإصلاح؟**\nالأزرار المفكوكة والدرزات المفتوحة والبطانات والمرافق البالية، طوال فترة امتلاكك للقطعة."}}$json$::jsonb),

('privacy', 'Privacy policy', 'What we collect, why, and your rights.',
$md$
_Last updated 16 November 2026._

## What we collect

When you order or create an account we collect your name, email, phone numbers, governorate, area and nearest landmark. We store your order history and, if you choose, your wishlist and saved addresses.

## Why

To deliver your orders, answer your questions, and — only if you subscribe — send our monthly letter. We share your name, phone and address with the delivery courier only to deliver your order. We do not sell personal data.

## Your rights

You can view and edit your details in your account, unsubscribe from any email, or ask us to delete your data by writing to care@vovian.example.
$md$,
$json${"ar": {"title": "سياسة الخصوصية", "summary": "ما نجمعه ولماذا، وحقوقك.", "body": "_آخر تحديث 16 تشرين الثاني 2026._\n\n## ما نجمعه\n\nعند الطلب أو إنشاء حساب نجمع اسمك وبريدك الإلكتروني وأرقام هاتفك والمحافظة والمنطقة وأقرب نقطة دالة، ونحفظ سجل طلباتك وقائمة رغباتك وعناوينك إن اخترت ذلك.\n\n## لماذا\n\nلتوصيل طلباتك والرد على أسئلتك، ولإرسال رسالتنا الشهرية إن اشتركت فقط. نشارك اسمك وهاتفك وعنوانك مع شركة التوصيل لغرض توصيل الطلب فقط. لا نبيع البيانات الشخصية.\n\n## حقوقك\n\nيمكنك عرض بياناتك وتعديلها من حسابك، وإلغاء الاشتراك من أي رسالة، أو طلب حذف بياناتك بمراسلة care@vovian.example."}}$json$::jsonb),

('terms', 'Terms & conditions', 'The terms that apply when you shop with VOVIAN.',
$md$
_Last updated 16 November 2026._

## Orders

An order is a request to buy. The contract is formed when we confirm your order by phone, message or email. We may decline an order if an item is unavailable or a price was displayed in error; any payment will be refunded in full.

## Prices

Prices are in Iraqi dinars (IQD). Delivery charges are shown before you place your order.

## Payment

Cash-on-delivery orders are paid to the courier on delivery. ZainCash and bank-transfer orders ship once payment is received; unpaid orders are cancelled after 3 days.

## Law

These terms are governed by the laws of the Republic of Iraq. Nothing in them limits your rights as a consumer.
$md$,
$json${"ar": {"title": "الشروط والأحكام", "summary": "الشروط المطبقة عند التسوق من فوفيان.", "body": "_آخر تحديث 16 تشرين الثاني 2026._\n\n## الطلبات\n\nالطلب هو رغبة في الشراء، ويُبرم العقد عند تأكيدنا للطلب هاتفياً أو برسالة أو بالبريد الإلكتروني. قد نرفض الطلب إن لم تتوفر القطعة أو عُرض سعر بالخطأ، ويُعاد أي مبلغ مدفوع كاملاً.\n\n## الأسعار\n\nالأسعار بالدينار العراقي، وتظهر أجور التوصيل قبل إتمام الطلب.\n\n## الدفع\n\nطلبات الدفع عند الاستلام تُدفع للمندوب عند التوصيل. طلبات زين كاش والتحويل المصرفي تُشحن بعد استلام المبلغ، وتُلغى غير المدفوعة بعد 3 أيام.\n\n## القانون\n\nتخضع هذه الشروط لقوانين جمهورية العراق، ولا شيء فيها يقيّد حقوقك كمستهلك."}}$json$::jsonb);

commit;
