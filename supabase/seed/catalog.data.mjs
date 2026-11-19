// VOVIAN seed catalogue — source of truth for supabase/seed/02_catalog.sql
// Regenerate with: node scripts/generate-seed.mjs
//
// Imagery: Unsplash photos (Unsplash License), hot-linked via images.unsplash.com
// as Unsplash's API guidelines require. Admins replace them with uploads to
// Supabase Storage from the dashboard.

export const U = (id) => `https://images.unsplash.com/photo-${id}`
// Editorial imagery is desaturated to sit inside the black & white identity.
export const UBW = (id) => `https://images.unsplash.com/photo-${id}?sat=-100`

export const colorsAr = {
  Black: 'أسود', White: 'أبيض', Ivory: 'عاجي', Ecru: 'بيج فاتح', Camel: 'جملي', Navy: 'كحلي',
  Grey: 'رمادي', 'Grey Melange': 'رمادي مُبرقش', Charcoal: 'فحمي', Burgundy: 'عنابي', Scarlet: 'قرمزي',
  Coral: 'مرجاني', Plum: 'برقوقي', Blush: 'وردي فاتح', Tangerine: 'برتقالي', Indigo: 'نيلي',
  'Light Wash': 'غسيل فاتح', 'Mid Wash': 'غسيل متوسط', Khaki: 'كاكي', Cognac: 'كونياك', Tan: 'بني فاتح',
  Rust: 'صدئي', Rose: 'وردي', Teal: 'فيروزي داكن', Red: 'أحمر', 'Sky Blue': 'أزرق سماوي',
  'Dove Grey': 'رمادي حمامي', Chambray: 'شامبراي', 'Heather Blue': 'أزرق مُبرقش', 'Dark Brown': 'بني داكن',
  'Black Rinse': 'أسود مغسول', 'Floral Blue': 'أزرق مزهر', 'Red Print': 'طبعة حمراء', 'Ivory Floral': 'عاجي مزهر',
  'Black Stripe': 'مخطط أسود', 'Blue Check': 'مربعات زرقاء', 'Navy Check': 'مربعات كحلية', 'Rust Chevron': 'شيفرون صدئي',
}

export const SIZES = {
  women: ['XS', 'S', 'M', 'L', 'XL'],
  men: ['S', 'M', 'L', 'XL', 'XXL'],
  womenDenim: ['25', '26', '27', '28', '29', '30', '31'],
  menDenim: ['28', '29', '30', '31', '32', '34', '36'],
  womenShoes: ['36', '37', '38', '39', '40', '41'],
  menShoes: ['40', '41', '42', '43', '44', '45'],
  one: ['One Size'],
}

export const categories = [
  // department, slug, name, ar, image
  ['women', 'dresses', 'Dresses', 'فساتين', U('1595777457583-95e059d581b8')],
  ['women', 'tops', 'Tops', 'بلوزات', U('1581044777550-4cfa60707c03')],
  ['women', 'shirts', 'Shirts', 'قمصان', U('1583846717393-dc2412c95ed7')],
  ['women', 'trousers', 'Trousers', 'سراويل', U('1509631179647-0177331693ae')],
  ['women', 'jeans', 'Jeans', 'جينز', U('1475178626620-a4d074967452')],
  ['women', 'skirts', 'Skirts', 'تنانير', U('1550639525-c97d455acf70')],
  ['women', 'outerwear', 'Outerwear', 'معاطف', U('1539533018447-63fcce2678e3')],
  ['women', 'knitwear', 'Knitwear', 'تريكو', U('1578587018452-892bacefd3f2')],
  ['women', 'shoes', 'Shoes', 'أحذية', U('1543163521-1bf539c55dd2')],
  ['women', 'accessories', 'Accessories', 'إكسسوارات', U('1492707892479-7bc8d5a4ee93')],
  ['men', 't-shirts', 'T-Shirts', 'تيشيرتات', U('1521572163474-6864f9cf17ab')],
  ['men', 'shirts', 'Shirts', 'قمصان', U('1602810318383-e386cc2a3ccf')],
  ['men', 'trousers', 'Trousers', 'سراويل', U('1473966968600-fa801b869a1a')],
  ['men', 'jeans', 'Jeans', 'جينز', U('1604176354204-9268737828e4')],
  ['men', 'jackets', 'Jackets', 'جاكيتات', U('1487222477894-8943e31ef7b2')],
  ['men', 'tailoring', 'Tailoring', 'بدلات', U('1617137968427-85924c800a22')],
  ['men', 'knitwear', 'Knitwear', 'تريكو', U('1506794778202-cad84cf45f1d')],
  ['men', 'shoes', 'Shoes', 'أحذية', U('1614252235316-8c857d38b5f4')],
  ['men', 'accessories', 'Accessories', 'إكسسوارات', U('1479064555552-3ef4979f8908')],
]

export const collections = [
  {
    slug: 'the-tailoring-edit', name: 'The Tailoring Edit', ar: 'مختارات الخياطة',
    subtitle: 'Sharp lines, softened', subtitleAr: 'خطوط حادة بلمسة ناعمة',
    description: 'Suiting cut close to the body and finished by hand, for the days that ask more of you.',
    descriptionAr: 'بدلات مفصّلة بدقة ومنتهية يدوياً، للأيام التي تتطلب حضوراً أكبر.',
    cover: UBW('1617137968427-85924c800a22'), hero: UBW('1519085360753-af0119f7cbe7'),
    gallery: [UBW('1617127365659-c47fa864d8bc'), UBW('1594938298603-c8148c4dae35')],
    featured: true, position: 1,
  },
  {
    slug: 'winter-atelier', name: 'Winter Atelier', ar: 'أتيليه الشتاء',
    subtitle: 'Wool, leather, weight', subtitleAr: 'صوف وجلد وثقل',
    description: 'Double-faced wool, vegetable-tanned leather and boots built to be resoled. Outerwear for the cold months.',
    descriptionAr: 'صوف مزدوج الوجه وجلد مدبوغ نباتياً وأحذية قابلة للإصلاح. ملابس خارجية للأشهر الباردة.',
    cover: UBW('1539533018447-63fcce2678e3'), hero: UBW('1512436991641-6745cdb1723f'),
    gallery: [UBW('1520975954732-35dd22299614'), UBW('1483985988355-763728e1935b')],
    featured: true, position: 2,
  },
  {
    slug: 'riviera', name: 'Riviera', ar: 'ريفييرا',
    subtitle: 'Dresses for long evenings', subtitleAr: 'فساتين للأمسيات الطويلة',
    description: 'Silk chiffon, cotton voile and printed crepe that move with the wind off the water.',
    descriptionAr: 'شيفون حريري وقطن خفيف وكريب مطبوع يتحرك مع نسيم البحر.',
    cover: UBW('1595777457583-95e059d581b8'), hero: UBW('1502716119720-b23a93e5fe1b'),
    gallery: [UBW('1596783074918-c84cb06531ca'), UBW('1496747611176-843222e1e57c')],
    featured: true, position: 3,
  },
  {
    slug: 'after-dark', name: 'After Dark', ar: 'بعد الغروب',
    subtitle: 'Evening, considered', subtitleAr: 'سهرة مدروسة',
    description: 'Gowns, dinner suits and the few pieces that make an entrance without trying.',
    descriptionAr: 'فساتين سهرة وبدلات عشاء وقطع قليلة تلفت الأنظار دون جهد.',
    cover: UBW('1612336307429-8a898d10e223'), hero: UBW('1566174053879-31528523f8ae'),
    gallery: [UBW('1617127365659-c47fa864d8bc')],
    featured: false, position: 4,
  },
]

// c(name, hex, images[])
const c = (name, hex, images) => ({ name, hex, images: images.map(U) })

const CARE_WOOL = 'Dry clean only. Store folded with cedar. Brush after wear.'
const CARE_COTTON = 'Machine wash cold, inside out. Line dry. Warm iron.'
const CARE_SILK = 'Dry clean or hand wash cold. Do not wring. Cool iron on reverse.'
const CARE_DENIM = 'Wash rarely, cold and inside out. Line dry to preserve colour.'
const CARE_LEATHER = 'Wipe with a dry cloth. Condition twice a year. Keep away from heat.'
const CARE_AR = {
  wool: 'تنظيف جاف فقط. يُحفظ مطوياً مع خشب الأرز.',
  cotton: 'غسيل بارد في الغسالة على الوجه المقلوب. يُجفف بالتعليق.',
  silk: 'تنظيف جاف أو غسيل يدوي بارد. لا يُعصر.',
  denim: 'يُغسل نادراً بماء بارد وعلى الوجه المقلوب.',
  leather: 'يُمسح بقطعة قماش جافة ويُرطّب مرتين في السنة.',
}

// Each product: slug, code, name, ar{name,description}, dept, category, price, sale,
// material, care, fit, details[], description, colors[], sizes, flags, collections[], tags[]
export const products = [
  // ─────────────────────────── WOMEN · DRESSES ───────────────────────────
  {
    slug: 'off-shoulder-column-dress', code: 'VW-DR-0101', name: 'Off-Shoulder Column Dress', dept: 'women', category: 'dresses',
    price: 420, material: '78% viscose, 22% elastane crepe', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Close to the body. True to size.',
    description: 'A floor-grazing column in heavy stretch crepe. The neckline sits just off the shoulder and holds its line without boning.',
    ar: { name: 'فستان طويل بأكتاف مكشوفة', description: 'فستان عمودي طويل من الكريب المطاطي الثقيل، بخط عنق ينسدل عن الكتفين ويحافظ على شكله دون دعامات.', material: 'كريب ٧٨٪ فسكوز و٢٢٪ إيلاستين' },
    details: ['Bonded neckline', 'Concealed back zip', 'Fully lined'],
    colors: [c('Plum', '#5B1F4A', ['1566174053879-31528523f8ae'])], sizes: SIZES.women,
    flags: { best: true, featured: true }, collections: ['after-dark'], tags: ['evening', 'gown'],
  },
  {
    slug: 'pleated-chiffon-maxi-dress', code: 'VW-DR-0102', name: 'Pleated Chiffon Maxi Dress', dept: 'women', category: 'dresses',
    price: 385, sale: 289, material: '100% silk chiffon, viscose lining', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Relaxed through the skirt. Fitted bodice.',
    description: 'Sun-ray pleats fall from a fitted bodice and open fully when you move. Two colourways, each dyed after pleating so the colour sits deep in the folds.',
    ar: { name: 'فستان شيفون طويل بطيات', description: 'طيات شعاعية تنساب من صدار محدد وتنفتح بالكامل مع الحركة. لونان، صُبغ كل منهما بعد التطيات ليتعمق اللون في الثنايا.', material: 'شيفون حرير ١٠٠٪ مع بطانة فسكوز' },
    details: ['Sun-ray pleating', 'Adjustable straps', 'Invisible side zip'],
    colors: [c('Scarlet', '#B3121F', ['1595777457583-95e059d581b8']), c('Coral', '#E8806F', ['1596783074918-c84cb06531ca'])],
    sizes: SIZES.women, flags: { new: true, featured: true }, collections: ['riviera'], tags: ['summer', 'maxi'],
  },
  {
    slug: 'printed-fit-and-flare-dress', code: 'VW-DR-0103', name: 'Printed Fit-and-Flare Dress', dept: 'women', category: 'dresses',
    price: 260, material: '100% cotton poplin', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Fitted waist, full skirt. True to size.',
    description: 'Cotton poplin printed with a hand-painted floral, cut with a cinched waist and a skirt full enough to spin in.',
    ar: { name: 'فستان مطبوع بتنورة واسعة', description: 'بوبلين قطني مطبوع بزهور مرسومة يدوياً، بخصر محدد وتنورة واسعة.', material: 'بوبلين قطن ١٠٠٪' },
    details: ['Self-tie belt', 'Side pockets', 'Midi length'],
    colors: [c('Red Print', '#C62D2D', ['1572804013309-59a88b7e92f1'])], sizes: SIZES.women,
    flags: {}, collections: ['riviera'], tags: ['print', 'midi'],
  },
  {
    slug: 'tailored-sheath-dress', code: 'VW-DR-0104', name: 'Tailored Sheath Dress', dept: 'women', category: 'dresses',
    price: 340, material: '96% virgin wool, 4% elastane', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Tailored. Size up for a looser fit.',
    description: 'Cut from a light, springy suiting wool with darts that follow the body. Cap sleeves and a knee-skimming hem.',
    ar: { name: 'فستان مفصّل ضيق', description: 'مفصّل من صوف البدلات الخفيف بخياطات تتبع الجسم، بأكمام قصيرة وطول حتى الركبة.', material: 'صوف خام ٩٦٪ و٤٪ إيلاستين' },
    details: ['Cap sleeves', 'Back vent', 'Half lined'],
    colors: [c('Dove Grey', '#A9A9A6', ['1617922001439-4a2e6562f328'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['the-tailoring-edit'], tags: ['workwear'],
  },
  {
    slug: 'denim-shirt-dress', code: 'VW-DR-0105', name: 'Denim Shirt Dress', dept: 'women', category: 'dresses',
    price: 210, material: '100% organic cotton denim, 8 oz', care: CARE_DENIM, careAr: CARE_AR.denim, fit: 'Relaxed. True to size.',
    description: 'A short-sleeved shirt dress in soft, lightweight denim with a gathered skirt and pearl-effect snaps.',
    ar: { name: 'فستان قميص من الدنيم', description: 'فستان قميص بأكمام قصيرة من دنيم خفيف وناعم، بتنورة مجمّعة وأزرار كبس لؤلؤية.', material: 'دنيم قطن عضوي ١٠٠٪' },
    details: ['Snap front', 'Chest pockets', 'Gathered skirt'],
    colors: [c('Indigo', '#5D7BA6', ['1591369822096-ffd140ec948f'])], sizes: SIZES.women,
    flags: {}, collections: [], tags: ['denim', 'day'],
  },
  {
    slug: 'polka-dot-midi-dress', code: 'VW-DR-0106', name: 'Polka Dot Midi Dress', dept: 'women', category: 'dresses',
    price: 295, sale: 220, material: '100% silk crepe de chine', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Fluid. True to size.',
    description: 'A ruffled midi with a high side split, in silk crepe de chine printed with an irregular dot.',
    ar: { name: 'فستان متوسط الطول بنقاط', description: 'فستان بكشكش وفتحة جانبية عالية، من حرير الكريب دي شين المطبوع بنقاط غير منتظمة.', material: 'كريب دي شين حرير ١٠٠٪' },
    details: ['Ruffle trim', 'Side split', 'Elasticated waist'],
    colors: [c('Red', '#B42025', ['1502716119720-b23a93e5fe1b'])], sizes: SIZES.women,
    flags: {}, collections: ['riviera'], tags: ['print', 'midi'],
  },
  {
    slug: 'floral-wrap-dress', code: 'VW-DR-0107', name: 'Floral Wrap Dress', dept: 'women', category: 'dresses',
    price: 245, material: '100% viscose georgette', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Adjustable wrap. True to size.',
    description: 'A true wrap dress in floating georgette, printed with botanical florals on an ivory ground.',
    ar: { name: 'فستان ملفوف مزهر', description: 'فستان ملفوف من جورجيت خفيف مطبوع بزهور نباتية على أرضية عاجية.', material: 'جورجيت فسكوز ١٠٠٪' },
    details: ['Tie waist', 'Flutter sleeves', 'Asymmetric hem'],
    colors: [c('Ivory Floral', '#F2EDE4', ['1496747611176-843222e1e57c'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['riviera'], tags: ['print', 'summer'],
  },
  {
    slug: 'draped-crepe-gown', code: 'VW-DR-0108', name: 'Draped Crepe Gown', dept: 'women', category: 'dresses',
    price: 890, material: '100% triacetate crepe', care: 'Dry clean only.', careAr: 'تنظيف جاف فقط.', fit: 'Fitted bodice, draped train.',
    description: 'A sculpted mini bodice with a sweeping draped panel that falls into a train. Made in our Florence atelier in small runs.',
    ar: { name: 'فستان سهرة من الكريب بطيّات', description: 'صدار قصير منحوت مع لوح منسدل ينتهي بذيل طويل. يُصنع في أتيليه فلورنسا بكميات محدودة.', material: 'كريب تراي أسيتات ١٠٠٪' },
    details: ['Draped train', 'Structured shoulders', 'Made in Italy'],
    colors: [c('Scarlet', '#A3121C', ['1612336307429-8a898d10e223'])], sizes: SIZES.women,
    flags: { featured: true }, collections: ['after-dark'], tags: ['evening', 'gown'],
  },
  {
    slug: 'broderie-ruffle-mini-dress', code: 'VW-DR-0109', name: 'Broderie Ruffle Mini Dress', dept: 'women', category: 'dresses',
    price: 230, material: '100% cotton broderie anglaise', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Relaxed. True to size.',
    description: 'Tiered ruffles of cotton broderie, worn on or off the shoulder.',
    ar: { name: 'فستان قصير بكشكش مطرز', description: 'طبقات من كشكش القطن المطرز، يمكن ارتداؤه على الكتفين أو بعيداً عنهما.', material: 'قطن مطرز ١٠٠٪' },
    details: ['Elasticated neckline', 'Tiered skirt', 'Cotton lining'],
    colors: [c('White', '#FFFFFF', ['1515372039744-b8f02a3ae446'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['riviera'], tags: ['summer'],
  },
  {
    slug: 'halter-wide-leg-jumpsuit', code: 'VW-DR-0110', name: 'Halter Wide-Leg Jumpsuit', dept: 'women', category: 'dresses',
    price: 320, material: '100% recycled polyester satin', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Fitted waist, wide leg.',
    description: 'A deep-V halter jumpsuit with a sash waist and fluid wide legs in heavy satin.',
    ar: { name: 'جمبسوت بياقة رسن وأرجل واسعة', description: 'جمبسوت بفتحة V عميقة وحزام عند الخصر وأرجل واسعة منسدلة من الساتان الثقيل.', material: 'ساتان بوليستر معاد تدويره ١٠٠٪' },
    details: ['Sash belt', 'Side pockets', 'Back zip'],
    colors: [c('Teal', '#1F6F78', ['1495385794356-15371f348c31'])], sizes: SIZES.women,
    flags: {}, collections: ['after-dark'], tags: ['evening'],
  },

  // ─────────────────────────── WOMEN · TOPS & SHIRTS ───────────────────────────
  {
    slug: 'pussy-bow-poplin-blouse', code: 'VW-SH-0201', name: 'Pussy-Bow Poplin Blouse', dept: 'women', category: 'shirts',
    price: 185, material: '100% cotton poplin', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Regular. True to size.',
    description: 'Crisp white poplin with a fine black ribbon tie at the collar. Tuck it into tailoring or wear it loose.',
    ar: { name: 'بلوزة بوبلين بربطة عنق', description: 'بوبلين أبيض ناصع مع شريط أسود رفيع عند الياقة. تُرتدى داخل البنطال المفصّل أو منسدلة.', material: 'بوبلين قطن ١٠٠٪' },
    details: ['Ribbon tie', 'Mother-of-pearl buttons', 'Double cuffs'],
    colors: [c('White', '#FFFFFF', ['1583846717393-dc2412c95ed7'])], sizes: SIZES.women,
    flags: { best: true }, collections: ['the-tailoring-edit'], tags: ['workwear'],
  },
  {
    slug: 'organza-puff-sleeve-blouse', code: 'VW-TP-0202', name: 'Organza Puff-Sleeve Blouse', dept: 'women', category: 'tops',
    price: 240, material: '100% silk organza', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Voluminous sleeves, cropped body.',
    description: 'Sheer printed organza gathered into exaggerated sleeves. The body is lined so it can be worn alone.',
    ar: { name: 'بلوزة أورجانزا بأكمام منفوخة', description: 'أورجانزا شفافة مطبوعة مجمّعة في أكمام واسعة، والجسم مبطن ليُرتدى وحده.', material: 'أورجانزا حرير ١٠٠٪' },
    details: ['Lined body', 'Elastic cuffs', 'Off-shoulder option'],
    colors: [c('Blush', '#E8C4C4', ['1581044777550-4cfa60707c03'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['after-dark'], tags: ['evening'],
  },
  {
    slug: 'sculpted-shoulder-tank', code: 'VW-TP-0203', name: 'Sculpted Shoulder Tank', dept: 'women', category: 'tops',
    price: 95, material: '100% organic cotton jersey, 220 gsm', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Boxy. Size down for a closer fit.',
    description: 'A heavyweight jersey tank with padded, squared-off shoulders. The base layer that changes a silhouette.',
    ar: { name: 'توب بأكتاف منحوتة', description: 'توب جيرسي ثقيل بأكتاف مبطنة مربعة، طبقة أساسية تغيّر شكل الإطلالة.', material: 'جيرسي قطن عضوي ١٠٠٪' },
    details: ['Removable shoulder pads', 'Ribbed neckline'],
    colors: [c('White', '#FFFFFF', ['1598554747436-c9293d6a588f'])], sizes: SIZES.women,
    flags: {}, collections: [], tags: ['essentials'],
  },

  // ─────────────────────────── WOMEN · KNITWEAR ───────────────────────────
  {
    slug: 'cotton-crew-sweater', code: 'VW-KN-0301', name: 'Cotton Crew Sweater', dept: 'women', category: 'knitwear',
    price: 165, material: '100% Pima cotton', care: 'Hand wash cold. Dry flat.', careAr: 'غسيل يدوي بارد. يُجفف مسطحاً.', fit: 'Relaxed. True to size.',
    description: 'A soft, slightly oversized crew in fine-gauge Pima cotton. Dropped shoulders, long ribbed cuffs.',
    ar: { name: 'كنزة قطنية برقبة دائرية', description: 'كنزة واسعة قليلاً من قطن بيما الناعم، بأكتاف منخفضة وأساور مضلعة طويلة.', material: 'قطن بيما ١٠٠٪' },
    details: ['Dropped shoulder', 'Rib trims'],
    colors: [c('Tangerine', '#E8742A', ['1578587018452-892bacefd3f2']), c('Grey Melange', '#B8B8B4', ['1556905055-8f358a7a47b2'])],
    sizes: SIZES.women, flags: { best: true }, collections: [], tags: ['knit', 'essentials'],
  },
  {
    slug: 'chevron-intarsia-sweater', code: 'VW-KN-0302', name: 'Chevron Intarsia Sweater', dept: 'women', category: 'knitwear',
    price: 210, sale: 150, material: '70% merino wool, 30% alpaca', care: 'Hand wash cold. Dry flat.', careAr: 'غسيل يدوي بارد. يُجفف مسطحاً.', fit: 'Oversized.',
    description: 'Bold rust and ecru chevrons knitted in a single intarsia piece, so there are no seams across the pattern.',
    ar: { name: 'كنزة شيفرون منسوجة', description: 'نقشة شيفرون بلوني الصدأ والبيج منسوجة كقطعة واحدة دون درزات عبر النقشة.', material: 'صوف ميرينو ٧٠٪ وألباكا ٣٠٪' },
    details: ['Intarsia knit', 'Funnel neck'],
    colors: [c('Rust Chevron', '#A4562F', ['1475180098004-ca77a66827be'])], sizes: SIZES.women,
    flags: {}, collections: ['winter-atelier'], tags: ['knit'],
  },
  {
    slug: 'crochet-fringe-poncho', code: 'VW-KN-0303', name: 'Crochet Fringe Poncho', dept: 'women', category: 'knitwear',
    price: 175, material: '100% cotton', care: 'Hand wash cold. Dry flat.', careAr: 'غسيل يدوي بارد. يُجفف مسطحاً.', fit: 'One size.',
    description: 'An open-work crochet poncho finished with a long hand-knotted fringe.',
    ar: { name: 'بونشو كروشيه بأهداب', description: 'بونشو كروشيه مفرّغ ينتهي بأهداب طويلة معقودة يدوياً.', material: 'قطن ١٠٠٪' },
    details: ['Hand-knotted fringe', 'V-neck'],
    colors: [c('Ecru', '#EFE6D2', ['1434389677669-e08b4cac3105'])], sizes: SIZES.one,
    flags: {}, collections: ['riviera'], tags: ['knit', 'summer'],
  },

  // ─────────────────────────── WOMEN · SKIRTS / JEANS / TROUSERS ───────────────────────────
  {
    slug: 'quilted-a-line-midi-skirt', code: 'VW-SK-0401', name: 'Quilted A-Line Midi Skirt', dept: 'women', category: 'skirts',
    price: 260, material: 'Wool-blend shell, recycled wadding', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'High waist. True to size.',
    description: 'A diamond-quilted wool skirt with a tie belt. Warm enough for winter, structured enough to hold its shape.',
    ar: { name: 'تنورة متوسطة مبطنة', description: 'تنورة صوفية مبطنة بنقشة الماس مع حزام للربط. دافئة للشتاء وتحافظ على شكلها.', material: 'صوف ممزوج مع حشوة معاد تدويرها' },
    details: ['Tie belt', 'Side zip', 'Midi length'],
    colors: [c('Black', '#000000', ['1550639525-c97d455acf70'])], sizes: SIZES.women,
    flags: { best: true }, collections: ['winter-atelier'], tags: ['winter'],
  },
  {
    slug: 'high-rise-straight-jean', code: 'VW-JN-0501', name: 'High-Rise Straight Jean', dept: 'women', category: 'jeans',
    price: 160, material: '99% cotton, 1% elastane denim, 11 oz', care: CARE_DENIM, careAr: CARE_AR.denim, fit: 'High rise, straight leg. True to waist size.',
    description: 'Our signature straight leg, cut with a high rise and a full-length hem in a lightly washed blue.',
    ar: { name: 'جينز مستقيم بخصر عالٍ', description: 'قصّتنا المستقيمة المميزة بخصر عالٍ وطول كامل بلون أزرق مغسول خفيفاً.', material: 'دنيم ٩٩٪ قطن و١٪ إيلاستين' },
    details: ['Five pockets', 'Button fly', '32" inseam'],
    colors: [c('Light Wash', '#A9C2DB', ['1475178626620-a4d074967452'])], sizes: SIZES.womenDenim, sizeGuide: 'denim',
    flags: { best: true }, collections: [], tags: ['denim', 'essentials'],
  },
  {
    slug: 'patchwork-boyfriend-jean', code: 'VW-JN-0502', name: 'Patchwork Boyfriend Jean', dept: 'women', category: 'jeans',
    price: 175, material: '100% cotton denim', care: CARE_DENIM, careAr: CARE_AR.denim, fit: 'Relaxed, tapered. Size down.',
    description: 'A relaxed boyfriend jean with repaired rips and hand-stitched patches, each pair slightly different.',
    ar: { name: 'جينز بوي فريند مرقّع', description: 'جينز واسع بقطوع مُصلحة ورقع مخيطة يدوياً، كل قطعة مختلفة قليلاً.', material: 'دنيم قطن ١٠٠٪' },
    details: ['Hand-stitched patches', 'Cropped hem'],
    colors: [c('Mid Wash', '#6E8FB5', ['1541099649105-f69ad21f3246'])], sizes: SIZES.womenDenim, sizeGuide: 'denim',
    flags: {}, collections: [], tags: ['denim'],
  },
  {
    slug: 'satin-cargo-jogger', code: 'VW-TR-0601', name: 'Satin Cargo Jogger', dept: 'women', category: 'trousers',
    price: 190, material: '100% viscose satin', care: CARE_SILK, careAr: CARE_AR.silk, fit: 'Relaxed, cuffed ankle.',
    description: 'Utility pockets in liquid satin, with an elasticated waist and cuffed ankles.',
    ar: { name: 'بنطال جوغر ساتان بجيوب', description: 'جيوب عملية من الساتان الناعم مع خصر مطاطي وأطراف مضمومة.', material: 'ساتان فسكوز ١٠٠٪' },
    details: ['Cargo pockets', 'Elastic waist'],
    colors: [c('Blush', '#E3B9AE', ['1594633312681-425c7b97ccd1'])], sizes: SIZES.women,
    flags: {}, collections: [], tags: ['lounge'],
  },
  {
    slug: 'striped-wide-leg-trouser', code: 'VW-TR-0602', name: 'Striped Wide-Leg Trouser', dept: 'women', category: 'trousers',
    price: 215, material: '64% polyester, 34% viscose, 2% elastane', care: 'Cool machine wash. Do not tumble dry.', careAr: 'غسيل بارد. لا يُجفف بالمجفف.', fit: 'High waist, wide leg.',
    description: 'Vertical stripes and a high waist lengthen the leg; the hem breaks just over a heel.',
    ar: { name: 'بنطال واسع مخطط', description: 'خطوط عمودية وخصر عالٍ تطيل الساق، والطرف ينسدل فوق الكعب.', material: 'بوليستر وفسكوز وإيلاستين' },
    details: ['Pressed crease', 'Slant pockets'],
    colors: [c('Black Stripe', '#1A1A1A', ['1509631179647-0177331693ae'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['the-tailoring-edit'], tags: ['tailoring'],
  },

  // ─────────────────────────── WOMEN · OUTERWEAR ───────────────────────────
  {
    slug: 'belted-wool-coat', code: 'VW-OW-0701', name: 'Belted Wool Coat', dept: 'women', category: 'outerwear',
    price: 590, material: '90% wool, 10% cashmere, double-faced', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Relaxed. True to size.',
    description: 'Double-faced wool and cashmere, unlined so it drapes rather than stands. Wear it belted or open.',
    ar: { name: 'معطف صوف بحزام', description: 'صوف وكشمير مزدوج الوجه دون بطانة لينسدل بنعومة. يُرتدى بالحزام أو مفتوحاً.', material: '٩٠٪ صوف و١٠٪ كشمير' },
    details: ['Unlined', 'Hand-finished seams', 'Detachable belt'],
    colors: [c('Camel', '#B98A5E', ['1539533018447-63fcce2678e3'])], sizes: SIZES.women,
    flags: { best: true, featured: true }, collections: ['winter-atelier'], tags: ['coat', 'winter'],
  },
  {
    slug: 'ruffle-placket-coat', code: 'VW-OW-0702', name: 'Ruffle Placket Coat', dept: 'women', category: 'outerwear',
    price: 680, material: '100% wool gabardine', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Slim through the body.',
    description: 'A narrow black coat with a ruffled placket and covered buttons that run to the hem.',
    ar: { name: 'معطف بكشكش على الأزرار', description: 'معطف أسود ضيق مع كشكش على خط الأزرار المكسوة حتى الطرف.', material: 'غابردين صوف ١٠٠٪' },
    details: ['Covered buttons', 'Ruffle placket', 'Silk-blend lining'],
    colors: [c('Black', '#000000', ['1554412933-514a83d2f3c8'])], sizes: SIZES.women,
    flags: { new: true, featured: true }, collections: ['winter-atelier', 'after-dark'], tags: ['coat'],
  },
  {
    slug: 'double-breasted-coat', code: 'VW-OW-0703', name: 'Double-Breasted Coat', dept: 'women', category: 'outerwear',
    price: 540, material: '80% wool, 20% polyamide', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Regular. True to size.',
    description: 'A burgundy wool coat with a high funnel collar and a double row of horn buttons.',
    ar: { name: 'معطف بصفين من الأزرار', description: 'معطف صوف عنابي بياقة عالية وصفين من أزرار القرن.', material: '٨٠٪ صوف و٢٠٪ بولي أميد' },
    details: ['Funnel collar', 'Horn buttons'],
    colors: [c('Burgundy', '#6E1E2B', ['1483985988355-763728e1935b'])], sizes: SIZES.women,
    flags: {}, collections: ['winter-atelier'], tags: ['coat'],
  },
  {
    slug: 'check-wool-coat', code: 'VW-OW-0704', name: 'Check Wool Coat', dept: 'women', category: 'outerwear',
    price: 495, sale: 395, material: '100% brushed wool', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Oversized.',
    description: 'A brushed navy check, cut long and loose with a notch lapel.',
    ar: { name: 'معطف صوف بمربعات', description: 'مربعات كحلية من الصوف المصفف، بقصة طويلة وواسعة وياقة مسننة.', material: 'صوف مصفف ١٠٠٪' },
    details: ['Notch lapel', 'Flap pockets'],
    colors: [c('Navy Check', '#2C3A4F', ['1485968579580-b6d095142e6e'])], sizes: SIZES.women,
    flags: {}, collections: ['winter-atelier'], tags: ['coat'],
  },
  {
    slug: 'oversized-wool-trench', code: 'VW-OW-0705', name: 'Oversized Wool Trench', dept: 'women', category: 'outerwear',
    price: 620, material: '100% virgin wool', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Oversized. Size down.',
    description: 'The trench rebuilt in powder-blue wool: storm flaps, a wide belt and a generous cut that sits over knitwear.',
    ar: { name: 'ترنش صوفي واسع', description: 'الترنش بصيغة جديدة من الصوف الأزرق الفاتح، مع حزام عريض وقصة واسعة فوق التريكو.', material: 'صوف خام ١٠٠٪' },
    details: ['Storm flaps', 'Wide belt', 'Raglan sleeves'],
    colors: [c('Sky Blue', '#9DB7D5', ['1539109136881-3be0616acf4b'])], sizes: SIZES.women,
    flags: { new: true }, collections: ['winter-atelier'], tags: ['coat', 'campaign'],
  },

  // ─────────────────────────── WOMEN · SHOES / ACCESSORIES ───────────────────────────
  {
    slug: 'floral-stiletto-pump', code: 'VW-SO-0801', name: 'Floral Stiletto Pump', dept: 'women', category: 'shoes',
    price: 350, material: 'Printed satin upper, leather sole', care: 'Store in dust bag. Spot clean only.', careAr: 'يُحفظ في كيس. تنظيف موضعي فقط.', fit: 'True to size. 100 mm heel.',
    description: 'A pointed pump in printed satin on a 100 mm stiletto.',
    ar: { name: 'حذاء كعب عالٍ مزهر', description: 'حذاء مدبب من الساتان المطبوع بكعب رفيع ١٠٠ ملم.', material: 'ساتان مطبوع ونعل جلدي' },
    details: ['100 mm heel', 'Leather lining', 'Made in Italy'],
    colors: [c('Floral Blue', '#3459A5', ['1543163521-1bf539c55dd2'])], sizes: SIZES.womenShoes, sizeGuide: 'shoes',
    flags: {}, collections: ['after-dark'], tags: ['heels'],
  },
  {
    slug: 'quilted-crossbody-bag', code: 'VW-AC-0901', name: 'Quilted Crossbody Bag', dept: 'women', category: 'accessories',
    price: 420, material: 'Quilted lambskin, brass hardware', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: '24 × 15 × 6 cm.',
    description: 'Diamond-quilted lambskin with an adjustable strap. Fits a phone, cards and keys.',
    ar: { name: 'حقيبة كروس مبطنة', description: 'جلد حمل مبطن بنقشة الماس مع حزام قابل للتعديل، تتسع لهاتف وبطاقات ومفاتيح.', material: 'جلد حمل مبطن وقطع نحاسية' },
    details: ['Adjustable strap', 'Zip top', 'Card slots'],
    colors: [c('Black', '#000000', ['1492707892479-7bc8d5a4ee93'])], sizes: SIZES.one, sizeGuide: 'none',
    flags: { best: true }, collections: [], tags: ['bag'],
  },
  {
    slug: 'structured-top-handle-bag', code: 'VW-AC-0902', name: 'Structured Top-Handle Bag', dept: 'women', category: 'accessories',
    price: 560, material: 'Smooth calf leather, palladium hardware', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: '28 × 21 × 12 cm.',
    description: 'A rigid top-handle bag in polished calf, with a turn-lock and a detachable shoulder strap.',
    ar: { name: 'حقيبة يد بمقبض علوي', description: 'حقيبة صلبة بمقبض علوي من جلد العجل المصقول، بقفل دوّار وحزام كتف قابل للإزالة.', material: 'جلد عجل ناعم' },
    details: ['Turn-lock closure', 'Detachable strap', 'Suede lining'],
    colors: [c('Red', '#B5281C', ['1584917865442-de89df76afd3'])], sizes: SIZES.one, sizeGuide: 'none',
    flags: { new: true }, collections: ['after-dark'], tags: ['bag'],
  },

  // ─────────────────────────── MEN · T-SHIRTS ───────────────────────────
  {
    slug: 'essential-crew-tee', code: 'VM-TS-1001', name: 'Essential Crew Tee', dept: 'men', category: 't-shirts',
    price: 65, material: '100% organic cotton jersey, 200 gsm', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Regular. True to size.',
    description: 'The tee we wear most: a dense, smooth jersey with a narrow rib collar that keeps its shape wash after wash.',
    ar: { name: 'تيشيرت أساسي برقبة دائرية', description: 'التيشيرت الذي نرتديه أكثر: جيرسي كثيف وناعم بياقة مضلعة رفيعة تحافظ على شكلها.', material: 'جيرسي قطن عضوي ١٠٠٪' },
    details: ['Taped shoulders', 'Side seams', 'Pre-shrunk'],
    colors: [
      c('White', '#FFFFFF', ['1521572163474-6864f9cf17ab', '1562157873-818bc0726f68']),
      c('Black', '#000000', ['1583743814966-8936f5b7be1a', '1576871337622-98d48d1cf531']),
      c('Heather Blue', '#8EA3BC', ['1564584217132-2271feaeb3c5']),
    ],
    sizes: SIZES.men, flags: { best: true, featured: true }, collections: [], tags: ['essentials', 'tee'],
  },
  {
    slug: 'v-neck-tee', code: 'VM-TS-1002', name: 'V-Neck Tee', dept: 'men', category: 't-shirts',
    price: 60, material: '100% Supima cotton', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Slim. Size up for a relaxed fit.',
    description: 'A lighter Supima jersey with a shallow V that sits well under an open shirt.',
    ar: { name: 'تيشيرت برقبة V', description: 'جيرسي سوبيما أخف بفتحة V قصيرة تناسب الارتداء تحت قميص مفتوح.', material: 'قطن سوبيما ١٠٠٪' },
    details: ['Shallow V', 'Coverstitched hems'],
    colors: [c('White', '#FFFFFF', ['1507003211169-0a1dd7228f2d'])], sizes: SIZES.men,
    flags: {}, collections: [], tags: ['essentials', 'tee'],
  },
  {
    slug: 'contrast-trim-tee', code: 'VM-TS-1003', name: 'Contrast Trim Tee', dept: 'men', category: 't-shirts',
    price: 75, material: '100% cotton slub jersey', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Boxy, dropped shoulder.',
    description: 'A boxy slub-jersey tee with grey flatlock seams that trace the construction.',
    ar: { name: 'تيشيرت بحواف متباينة', description: 'تيشيرت واسع من الجيرسي المحبب بدرزات رمادية مسطحة تبرز التصميم.', material: 'جيرسي قطن محبب ١٠٠٪' },
    details: ['Flatlock seams', 'Dropped shoulder'],
    colors: [c('Black', '#000000', ['1622519407650-3df9883f76a5'])], sizes: SIZES.men,
    flags: { new: true }, collections: [], tags: ['tee'],
  },

  // ─────────────────────────── MEN · SHIRTS ───────────────────────────
  {
    slug: 'cotton-poplin-shirt', code: 'VM-SH-1101', name: 'Cotton Poplin Shirt', dept: 'men', category: 'shirts',
    price: 140, material: '100% two-ply cotton poplin', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Tailored. True to collar size.',
    description: 'Two-ply poplin with a semi-spread collar and a single-needle finish. Three colours, one cut.',
    ar: { name: 'قميص بوبلين قطني', description: 'بوبلين مزدوج الخيط بياقة نصف مفتوحة وخياطة بإبرة واحدة. ثلاثة ألوان وقصة واحدة.', material: 'بوبلين قطن مزدوج ١٠٠٪' },
    details: ['Semi-spread collar', 'Mother-of-pearl buttons', 'Split yoke'],
    colors: [
      c('White', '#FFFFFF', ['1603252109303-2751441dd157', '1602810318383-e386cc2a3ccf']),
      c('Grey', '#8C9096', ['1602810318383-e386cc2a3ccf']),
      c('Burgundy', '#5E1E33', ['1602810318383-e386cc2a3ccf']),
    ],
    sizes: SIZES.men, flags: { best: true }, collections: ['the-tailoring-edit'], tags: ['shirt', 'workwear'],
  },
  {
    slug: 'chambray-dot-shirt', code: 'VM-SH-1102', name: 'Chambray Dot Shirt', dept: 'men', category: 'shirts',
    price: 130, material: '100% cotton chambray', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Regular.',
    description: 'Washed chambray with a tiny woven dot and a button-down collar.',
    ar: { name: 'قميص شامبراي منقط', description: 'شامبراي مغسول بنقاط صغيرة منسوجة وياقة بأزرار.', material: 'شامبراي قطن ١٠٠٪' },
    details: ['Button-down collar', 'Chest pocket'],
    colors: [c('Chambray', '#5D7896', ['1596755094514-f87e34085b2c'])], sizes: SIZES.men,
    flags: {}, collections: [], tags: ['shirt'],
  },

  // ─────────────────────────── MEN · TROUSERS / JEANS ───────────────────────────
  {
    slug: 'tapered-chino', code: 'VM-TR-1201', name: 'Tapered Chino', dept: 'men', category: 'trousers',
    price: 135, material: '98% cotton twill, 2% elastane', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Tapered, mid rise.',
    description: 'A garment-dyed twill chino with a gentle taper and enough stretch to sit comfortably all day.',
    ar: { name: 'بنطال تشينو ضيق الأطراف', description: 'تشينو من التويل المصبوغ بعد الخياطة بأطراف ضيقة ومرونة مريحة طوال اليوم.', material: 'تويل ٩٨٪ قطن و٢٪ إيلاستين' },
    details: ['Garment dyed', 'Button fly'],
    colors: [c('Khaki', '#B9A27E', ['1473966968600-fa801b869a1a'])], sizes: SIZES.men,
    flags: {}, collections: [], tags: ['essentials'],
  },
  {
    slug: 'pleated-wool-trouser', code: 'VM-TR-1202', name: 'Pleated Wool Trouser', dept: 'men', category: 'trousers',
    price: 210, material: '100% tropical wool', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Relaxed, single pleat.',
    description: 'Tropical wool with a single forward pleat and side adjusters. Light enough for three seasons.',
    ar: { name: 'بنطال صوف بطيّة', description: 'صوف استوائي بطيّة أمامية واحدة ومشابك جانبية للتعديل، خفيف لثلاثة فصول.', material: 'صوف استوائي ١٠٠٪' },
    details: ['Side adjusters', 'Single pleat', 'Turn-ups'],
    colors: [c('Charcoal', '#3A3B3D', ['1544441893-675973e31985'])], sizes: SIZES.men,
    flags: {}, collections: ['the-tailoring-edit'], tags: ['tailoring'],
  },
  {
    slug: 'slim-rigid-jean', code: 'VM-JN-1301', name: 'Slim Rigid Jean', dept: 'men', category: 'jeans',
    price: 150, material: '100% cotton selvedge denim, 13.5 oz', care: CARE_DENIM, careAr: CARE_AR.denim, fit: 'Slim. Rigid denim relaxes with wear.',
    description: 'Japanese selvedge denim with no stretch. Starts stiff, then moulds to you.',
    ar: { name: 'جينز ضيق صلب', description: 'دنيم سيلفدج ياباني بدون مرونة، يبدأ صلباً ثم يتشكل على جسمك.', material: 'دنيم سيلفدج قطن ١٠٠٪' },
    details: ['Selvedge outseam', 'Copper rivets'],
    colors: [c('Black Rinse', '#1E2126', ['1624378439575-d8705ad7ae80']), c('Indigo', '#2E4466', ['1604176354204-9268737828e4'])],
    sizes: SIZES.menDenim, sizeGuide: 'denim', flags: { best: true }, collections: [], tags: ['denim'],
  },

  // ─────────────────────────── MEN · JACKETS ───────────────────────────
  {
    slug: 'leather-biker-jacket', code: 'VM-JK-1401', name: 'Leather Biker Jacket', dept: 'men', category: 'jackets',
    price: 890, material: 'Vegetable-tanned lambskin, cotton lining', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: 'Slim. Order your usual size.',
    description: 'Vegetable-tanned lambskin that softens and darkens over years. Asymmetric zip, snap lapels, belted hem.',
    ar: { name: 'جاكيت جلد بايكر', description: 'جلد حمل مدبوغ نباتياً يلين ويغمق مع السنين. سحاب غير متماثل وياقة بكبسات وحزام عند الطرف.', material: 'جلد حمل مدبوغ نباتياً' },
    details: ['Asymmetric zip', 'Snap lapels', 'Zip cuffs'],
    colors: [
      c('Black', '#000000', ['1520975954732-35dd22299614', '1551028719-00167b16eac5']),
      c('Cognac', '#8A4B2A', ['1487222477894-8943e31ef7b2']),
    ],
    sizes: SIZES.men, flags: { best: true, featured: true }, collections: ['winter-atelier'], tags: ['leather', 'jacket'],
  },
  {
    slug: 'denim-trucker-jacket', code: 'VM-JK-1402', name: 'Denim Trucker Jacket', dept: 'men', category: 'jackets',
    price: 220, material: '100% cotton denim, corduroy collar', care: CARE_DENIM, careAr: CARE_AR.denim, fit: 'Regular.',
    description: 'A raw-indigo trucker with a corduroy collar and contrast tan stitching.',
    ar: { name: 'جاكيت دنيم', description: 'جاكيت دنيم نيلي خام بياقة من القطيفة وخياطة بلون متباين.', material: 'دنيم قطن ١٠٠٪' },
    details: ['Corduroy collar', 'Flap chest pockets'],
    colors: [c('Indigo', '#2E3F63', ['1611312449408-fcece27cdbb7'])], sizes: SIZES.men,
    flags: {}, collections: [], tags: ['denim', 'jacket'],
  },
  {
    slug: 'suede-overshirt-jacket', code: 'VM-JK-1403', name: 'Suede Overshirt Jacket', dept: 'men', category: 'jackets',
    price: 480, material: 'Goat suede', care: 'Specialist suede clean only.', careAr: 'تنظيف متخصص للشامواه فقط.', fit: 'Relaxed.',
    description: 'Soft goat suede cut like a shirt, with snap pockets. Layers over a tee or under a coat.',
    ar: { name: 'جاكيت قميص من الشامواه', description: 'شامواه ماعز ناعم بقصة القميص وجيوب بكبسات، يُرتدى فوق تيشيرت أو تحت معطف.', material: 'شامواه ماعز' },
    details: ['Snap closures', 'Unlined'],
    colors: [c('Tan', '#A0683A', ['1617114919297-3c8ddb01f599'])], sizes: SIZES.men,
    flags: { new: true }, collections: [], tags: ['jacket'],
  },
  {
    slug: 'nylon-bomber-jacket', code: 'VM-JK-1404', name: 'Nylon Bomber Jacket', dept: 'men', category: 'jackets',
    price: 260, sale: 195, material: 'Recycled nylon shell, padded', care: 'Machine wash cold. Line dry.', careAr: 'غسيل بارد. يُجفف بالتعليق.', fit: 'Regular.',
    description: 'A lightly padded bomber in matte recycled nylon with a utility sleeve pocket.',
    ar: { name: 'جاكيت بومبر نايلون', description: 'بومبر مبطن خفيفاً من النايلون المعاد تدويره بجيب عملي على الكم.', material: 'نايلون معاد تدويره' },
    details: ['Sleeve pocket', 'Ribbed trims'],
    colors: [c('Rust', '#B0603A', ['1591047139829-d91aecb6caea'])], sizes: SIZES.men,
    flags: {}, collections: [], tags: ['jacket'],
  },

  // ─────────────────────────── MEN · TAILORING ───────────────────────────
  {
    slug: 'windowpane-three-piece-suit', code: 'VM-TL-1501', name: 'Windowpane Three-Piece Suit', dept: 'men', category: 'tailoring',
    price: 1250, material: '100% Super 120s wool', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Tailored. Hemmed free in store.',
    description: 'Jacket, waistcoat and trousers in a blue windowpane check, half-canvassed for shape that lasts.',
    ar: { name: 'بدلة ثلاثية بمربعات', description: 'جاكيت وصديري وبنطال بمربعات زرقاء، بتبطين نصفي يحافظ على الشكل طويلاً.', material: 'صوف سوبر ١٢٠ ١٠٠٪' },
    details: ['Half-canvassed', 'Peak lapel', 'Working cuffs'],
    colors: [c('Blue Check', '#3B5584', ['1594938298603-c8148c4dae35'])], sizes: SIZES.men,
    flags: { featured: true }, collections: ['the-tailoring-edit'], tags: ['suit'],
  },
  {
    slug: 'navy-tailored-blazer', code: 'VM-TL-1502', name: 'Navy Tailored Blazer', dept: 'men', category: 'tailoring',
    price: 620, material: '100% wool hopsack', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Slim.',
    description: 'A single-breasted blazer in breathable hopsack. Soft shoulder, two buttons, patch pockets.',
    ar: { name: 'بليزر كحلي مفصّل', description: 'بليزر بصف أزرار واحد من الصوف المنسوج المسامي، بكتف ناعم وجيوب خارجية.', material: 'صوف هوبساك ١٠٠٪' },
    details: ['Soft shoulder', 'Patch pockets'],
    colors: [c('Navy', '#1F2A44', ['1617137968427-85924c800a22'])], sizes: SIZES.men,
    flags: {}, collections: ['the-tailoring-edit'], tags: ['blazer'],
  },
  {
    slug: 'black-evening-blazer', code: 'VM-TL-1503', name: 'Black Evening Blazer', dept: 'men', category: 'tailoring',
    price: 690, material: 'Wool and mohair blend', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Slim.',
    description: 'Wool-mohair with a faint sheen and a slim shawl lapel. Wear it with a black shirt, buttoned to the top.',
    ar: { name: 'بليزر سهرة أسود', description: 'صوف وموهير بلمعة خفيفة وياقة شال رفيعة. يُرتدى مع قميص أسود مزرر حتى الأعلى.', material: 'مزيج صوف وموهير' },
    details: ['Shawl lapel', 'Jetted pockets'],
    colors: [c('Black', '#000000', ['1617127365659-c47fa864d8bc'])], sizes: SIZES.men,
    flags: { new: true }, collections: ['after-dark'], tags: ['blazer', 'evening'],
  },
  {
    slug: 'midnight-dinner-suit', code: 'VM-TL-1504', name: 'Midnight Dinner Suit', dept: 'men', category: 'tailoring',
    price: 1390, material: '100% wool barathea', care: CARE_WOOL, careAr: CARE_AR.wool, fit: 'Tailored.',
    description: 'Midnight-navy barathea, which reads deeper than black under artificial light. Grosgrain facings.',
    ar: { name: 'بدلة سهرة كحلية داكنة', description: 'صوف باراثيا كحلي داكن يبدو أعمق من الأسود تحت الإضاءة الصناعية، مع حواف من الغروغران.', material: 'صوف باراثيا ١٠٠٪' },
    details: ['Grosgrain lapels', 'Side-adjuster trousers'],
    colors: [c('Navy', '#141B2D', ['1519085360753-af0119f7cbe7'])], sizes: SIZES.men,
    flags: {}, collections: ['after-dark'], tags: ['suit', 'evening'],
  },

  // ─────────────────────────── MEN · KNITWEAR ───────────────────────────
  {
    slug: 'shawl-collar-cardigan', code: 'VM-KN-1601', name: 'Shawl Collar Cardigan', dept: 'men', category: 'knitwear',
    price: 230, material: '100% lambswool', care: 'Hand wash cold. Dry flat.', careAr: 'غسيل يدوي بارد. يُجفف مسطحاً.', fit: 'Regular.',
    description: 'A chunky lambswool cardigan with a deep shawl collar and leather-covered buttons.',
    ar: { name: 'كارديغان بياقة شال', description: 'كارديغان سميك من صوف الحمل بياقة شال عميقة وأزرار مكسوة بالجلد.', material: 'صوف حمل ١٠٠٪' },
    details: ['Leather buttons', 'Patch pockets'],
    colors: [c('Charcoal', '#4A4A48', ['1506794778202-cad84cf45f1d'])], sizes: SIZES.men,
    flags: {}, collections: ['winter-atelier'], tags: ['knit'],
  },
  {
    slug: 'merino-quarter-zip', code: 'VM-KN-1602', name: 'Merino Quarter-Zip', dept: 'men', category: 'knitwear',
    price: 185, material: '100% extra-fine merino', care: 'Machine wash wool cycle. Dry flat.', careAr: 'غسيل برنامج الصوف. يُجفف مسطحاً.', fit: 'Regular.',
    description: 'Fine merino with a short zip neck. Warm, light and smart enough over a collared shirt.',
    ar: { name: 'كنزة ميرينو بسحاب قصير', description: 'ميرينو ناعم بسحاب قصير عند الرقبة، دافئة وخفيفة وأنيقة فوق قميص.', material: 'ميرينو ناعم جداً ١٠٠٪' },
    details: ['Metal zip', 'Fully fashioned'],
    colors: [c('Grey', '#8A8D90', ['1500648767791-00dcc994a43e'])], sizes: SIZES.men,
    flags: { best: true }, collections: [], tags: ['knit', 'essentials'],
  },
  {
    slug: 'loopback-sweatshirt', code: 'VM-KN-1603', name: 'Loopback Sweatshirt', dept: 'men', category: 'knitwear',
    price: 110, sale: 85, material: '100% cotton loopback, 400 gsm', care: CARE_COTTON, careAr: CARE_AR.cotton, fit: 'Relaxed.',
    description: 'A heavyweight loopback crew, brushed only on the outside so it stays breathable.',
    ar: { name: 'سويتشيرت قطني ثقيل', description: 'سويتشيرت ثقيل برقبة دائرية، مصفف من الخارج فقط ليبقى قابلاً للتنفس.', material: 'قطن ١٠٠٪ وزن ٤٠٠ غرام' },
    details: ['Raglan sleeves', 'Rib panels'],
    colors: [c('White', '#F4F4F2', ['1620799140408-edc6dcb6d633']), c('Rose', '#E4C3C6', ['1516826957135-700dedea698c'])],
    sizes: SIZES.men, flags: {}, collections: [], tags: ['lounge'],
  },

  // ─────────────────────────── MEN · SHOES / ACCESSORIES ───────────────────────────
  {
    slug: 'leather-derby-shoe', code: 'VM-SO-1701', name: 'Leather Derby Shoe', dept: 'men', category: 'shoes',
    price: 340, material: 'Full-grain calf, Goodyear-welted leather sole', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: 'True to size.',
    description: 'A pebble-grain derby on a Goodyear welt, so it can be resoled for decades.',
    ar: { name: 'حذاء ديربي جلدي', description: 'حذاء ديربي من الجلد المحبب بخياطة غوديير، يمكن إعادة نعله لعقود.', material: 'جلد عجل كامل الحبيبات' },
    details: ['Goodyear welt', 'Leather sole'],
    colors: [c('Cognac', '#8B4A22', ['1614252235316-8c857d38b5f4'])], sizes: SIZES.menShoes, sizeGuide: 'shoes',
    flags: {}, collections: ['the-tailoring-edit'], tags: ['shoes'],
  },
  {
    slug: 'lace-up-leather-boot', code: 'VM-SO-1702', name: 'Lace-Up Leather Boot', dept: 'men', category: 'shoes',
    price: 390, material: 'Waxed calf, commando rubber sole', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: 'True to size.',
    description: 'A waxed leather boot on a commando sole, with speed hooks and a padded collar.',
    ar: { name: 'حذاء جلدي برقبة ورباط', description: 'حذاء من الجلد المشمع بنعل مطاطي متين وخطاطيف للرباط وياقة مبطنة.', material: 'جلد عجل مشمع ونعل مطاطي' },
    details: ['Speed hooks', 'Commando sole'],
    colors: [c('Dark Brown', '#3B2618', ['1608256246200-53e635b5b65f'])], sizes: SIZES.menShoes, sizeGuide: 'shoes',
    flags: { best: true }, collections: ['winter-atelier'], tags: ['boots'],
  },
  {
    slug: 'bridle-leather-belt', code: 'VM-AC-1801', name: 'Bridle Leather Belt', dept: 'men', category: 'accessories',
    price: 120, material: 'English bridle leather, solid brass buckle', care: CARE_LEATHER, careAr: CARE_AR.leather, fit: 'One size, adjustable 80–100 cm.',
    description: 'A 35 mm belt in stiff English bridle leather, finished with a solid brass buckle.',
    ar: { name: 'حزام جلد بريدل', description: 'حزام بعرض ٣٥ ملم من جلد البريدل الإنجليزي الصلب مع إبزيم نحاسي.', material: 'جلد بريدل إنجليزي' },
    details: ['35 mm width', 'Solid brass'],
    colors: [c('Cognac', '#7A4424', ['1479064555552-3ef4979f8908'])], sizes: SIZES.one, sizeGuide: 'none',
    flags: {}, collections: [], tags: ['belt'],
  },
]
