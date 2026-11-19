-- =============================================================================
-- VOVIAN · 0800 · Catalog read models (localised) for the storefront
-- These run as SECURITY INVOKER so RLS still applies: anonymous visitors only
-- ever see active, non-deleted products.
-- =============================================================================

-- Compact product card used by grids, carousels, wishlist, search.
create or replace function public.product_card(p_product_id uuid, p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'name', coalesce(p.translations -> p_locale ->> 'name', p.name),
    'department', p.department,
    'category', (
      select jsonb_build_object('slug', c.slug, 'name', coalesce(c.translations -> p_locale ->> 'name', c.name), 'department', c.department)
      from public.categories c where c.id = p.category_id
    ),
    'price', pr.unit_price,
    'compare_at', pr.compare_at,
    'is_new', p.is_new_arrival,
    'is_best_seller', p.is_best_seller,
    'in_stock', exists (
      select 1 from public.product_variants v join public.inventory i on i.variant_id = v.id
      where v.product_id = p.id and v.is_active and v.deleted_at is null and i.on_hand - i.reserved > 0
    ),
    'images', (
      select coalesce(jsonb_agg(jsonb_build_object('url', img.url, 'alt', coalesce(img.alt, p.name), 'color', img.color) order by img.position), '[]'::jsonb)
      from (select * from public.product_images where product_id = p.id order by position limit 4) img
    ),
    'colors', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'value', o.value, 'hex', o.swatch_hex, 'label', coalesce(o.translations -> p_locale ->> 'label', o.value)
      ) order by o.position), '[]'::jsonb)
      from public.product_options o where o.product_id = p.id and o.kind = 'color'
    ),
    'variants', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', v.id, 'color', v.color, 'size', v.size,
        'available', greatest(coalesce(i.on_hand - i.reserved, 0), 0)
      ) order by v.position, public.size_rank(v.size)), '[]'::jsonb)
      from public.product_variants v left join public.inventory i on i.variant_id = v.id
      where v.product_id = p.id and v.is_active and v.deleted_at is null
    )
  )
  from public.products p
  left join lateral (
    select x.unit_price, x.compare_at
    from public.product_variants v
    cross join lateral public.variant_unit_price(p.price, p.sale_price, v.price, v.sale_price) x
    where v.product_id = p.id and v.is_active and v.deleted_at is null
    order by x.unit_price
    limit 1
  ) pr on true
  where p.id = p_product_id;
$$;

-- ---------------------------------------------------------------------------
-- search_catalog(filters) → { items[], total, page, per_page, facets{} }
-- filters: department, category, categories[], collection, q, colors[], sizes[],
--          min_price, max_price, in_stock, on_sale, new_arrivals, best_sellers,
--          sort (featured|newest|price_asc|price_desc|best_selling),
--          page, per_page, locale
-- ---------------------------------------------------------------------------
create or replace function public.search_catalog(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  f_locale      text := coalesce(p_filters ->> 'locale', 'en');
  f_department  public.department := nullif(p_filters ->> 'department', '')::public.department;
  f_category    text := nullif(p_filters ->> 'category', '');
  f_categories  text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(p_filters -> 'categories') x), '{}');
  f_collection  text := nullif(p_filters ->> 'collection', '');
  f_q           text := lower(extensions.unaccent(nullif(trim(coalesce(p_filters ->> 'q', '')), '')));
  f_colors      text[] := coalesce((select array_agg(lower(x)) from jsonb_array_elements_text(p_filters -> 'colors') x), '{}');
  f_sizes       text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(p_filters -> 'sizes') x), '{}');
  f_min         numeric := nullif(p_filters ->> 'min_price', '')::numeric;
  f_max         numeric := nullif(p_filters ->> 'max_price', '')::numeric;
  f_in_stock    boolean := coalesce((p_filters ->> 'in_stock')::boolean, false);
  f_on_sale     boolean := coalesce((p_filters ->> 'on_sale')::boolean, false);
  f_new         boolean := coalesce((p_filters ->> 'new_arrivals')::boolean, false);
  f_best        boolean := coalesce((p_filters ->> 'best_sellers')::boolean, false);
  f_sort        text := coalesce(p_filters ->> 'sort', 'featured');
  f_per_page    integer := least(greatest(coalesce((p_filters ->> 'per_page')::integer, 24), 1), 60);
  f_page        integer := greatest(coalesce((p_filters ->> 'page')::integer, 1), 1);
  v_category_ids uuid[];
  v_result      jsonb;
begin
  -- A category slug includes its sub-categories.
  if f_category is not null then
    with recursive tree as (
      select c.id from public.categories c
      where c.slug = f_category and (f_department is null or c.department = f_department or c.department = 'unisex')
      union all
      select c.id from public.categories c join tree t on c.parent_id = t.id
    )
    select array_agg(id) into v_category_ids from tree;
    v_category_ids := coalesce(v_category_ids, array['00000000-0000-0000-0000-000000000000'::uuid]);
  end if;

  -- Scope = everything that matches the "where am I" filters (department, category,
  -- collection, search, flags). Attribute filters are applied on top so facets can
  -- show what else is available in the current scope.
  with scope as materialized (
    select p.id, pr.unit_price as price, pr.compare_at, p.published_at, p.sales_count, p.is_featured,
           coalesce(p.translations -> f_locale ->> 'name', p.name) as name, p.category_id,
           case when f_q is null then 0 else extensions.similarity(p.search_text, f_q) end as rank
    from public.products p
    left join lateral (
      select x.unit_price, x.compare_at
      from public.product_variants v
      cross join lateral public.variant_unit_price(p.price, p.sale_price, v.price, v.sale_price) x
      where v.product_id = p.id and v.is_active and v.deleted_at is null
      order by x.unit_price limit 1
    ) pr on true
    where p.status = 'active' and p.deleted_at is null
      and (f_department is null or p.department = f_department or p.department = 'unisex')
      and (v_category_ids is null or p.category_id = any (v_category_ids))
      and (f_collection is null or exists (
            select 1 from public.product_collections pc join public.collections c on c.id = pc.collection_id
            where pc.product_id = p.id and c.slug = f_collection))
      and (f_q is null or p.search_text like '%' || f_q || '%' or extensions.similarity(p.search_text, f_q) > 0.2
           or exists (select 1 from public.categories c where c.id = p.category_id
                      and lower(c.name || ' ' || coalesce(c.translations -> 'ar' ->> 'name', '')) like '%' || f_q || '%'))
      and (not f_new or p.is_new_arrival)
      and (not f_best or p.is_best_seller or p.sales_count > 0)
      and pr.unit_price is not null
  ),
  filtered as (
    select s.* from scope s
    where (cardinality(f_colors) = 0 or exists (
            select 1 from public.product_options o where o.product_id = s.id and o.kind = 'color' and lower(o.value) = any (f_colors)))
      and (cardinality(f_sizes) = 0 or exists (
            select 1 from public.product_variants v join public.inventory i on i.variant_id = v.id
            where v.product_id = s.id and v.size = any (f_sizes) and v.is_active and v.deleted_at is null
              and i.on_hand - i.reserved > 0
              and (cardinality(f_colors) = 0 or lower(v.color) = any (f_colors))))
      and (cardinality(f_categories) = 0 or exists (
            select 1 from public.categories c where c.id = s.category_id and c.slug = any (f_categories)))
      and (f_min is null or s.price >= f_min)
      and (f_max is null or s.price <= f_max)
      and (not f_on_sale or s.compare_at is not null)
      and (not f_in_stock or exists (
            select 1 from public.product_variants v join public.inventory i on i.variant_id = v.id
            where v.product_id = s.id and v.is_active and v.deleted_at is null and i.on_hand - i.reserved > 0))
  ),
  ordered as materialized (
    select f.id, count(*) over () as total_count,
      row_number() over (order by
        case when f_sort = 'price_asc' then f.price end asc nulls last,
        case when f_sort = 'price_desc' then f.price end desc nulls last,
        case when f_sort = 'newest' then f.published_at end desc nulls last,
        case when f_sort = 'best_selling' then f.sales_count end desc nulls last,
        case when f_q is not null and f_sort = 'featured' then f.rank end desc nulls last,
        case when f_sort = 'featured' then f.is_featured end desc nulls last,
        f.published_at desc nulls last, f.name
      ) as rn
    from filtered f
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(public.product_card(o.id, f_locale) order by o.rn)
      from ordered o where o.rn > (f_page - 1) * f_per_page and o.rn <= f_page * f_per_page
    ), '[]'::jsonb),
    'total', coalesce((select max(total_count) from ordered), 0),
    'page', f_page,
    'per_page', f_per_page,
    'facets', jsonb_build_object(
      'colors', (
        select coalesce(jsonb_agg(jsonb_build_object('value', c.value, 'hex', c.hex, 'count', c.n) order by c.n desc, c.value), '[]'::jsonb)
        from (
          select initcap(lower(o.value)) as value, min(o.swatch_hex) as hex, count(distinct o.product_id) as n
          from public.product_options o join scope s on s.id = o.product_id
          where o.kind = 'color' group by lower(o.value), initcap(lower(o.value))
        ) c
      ),
      'sizes', (
        select coalesce(jsonb_agg(jsonb_build_object('value', z.size, 'count', z.n) order by public.size_rank(z.size), z.size), '[]'::jsonb)
        from (
          select v.size, count(distinct v.product_id) as n
          from public.product_variants v join scope s on s.id = v.product_id
          where v.size is not null and v.is_active and v.deleted_at is null group by v.size
        ) z
      ),
      'categories', (
        select coalesce(jsonb_agg(jsonb_build_object('slug', c.slug, 'name', coalesce(c.translations -> f_locale ->> 'name', c.name), 'count', c.n) order by c.position), '[]'::jsonb)
        from (
          select cat.slug, min(cat.name) as name, (array_agg(cat.translations))[1] as translations, min(cat.position) as position, count(*) as n
          from scope s join public.categories cat on cat.id = s.category_id
          group by cat.slug
        ) c
      ),
      'price', (select jsonb_build_object('min', coalesce(floor(min(price)), 0), 'max', coalesce(ceil(max(price)), 0)) from scope)
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.search_catalog(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Product detail
-- ---------------------------------------------------------------------------
create or replace function public.get_product(p_slug text, p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'style_code', p.style_code,
    'name', coalesce(p.translations -> p_locale ->> 'name', p.name),
    'description', coalesce(p.translations -> p_locale ->> 'description', p.description),
    'material', coalesce(p.translations -> p_locale ->> 'material', p.material),
    'care', coalesce(p.translations -> p_locale ->> 'care', p.care),
    'fit', coalesce(p.translations -> p_locale ->> 'fit', p.fit),
    'details', coalesce(p.translations -> p_locale -> 'details', p.details),
    'brand', p.brand,
    'department', p.department,
    'size_guide', p.size_guide,
    'price', p.price,
    'sale_price', p.sale_price,
    'is_new', p.is_new_arrival,
    'is_best_seller', p.is_best_seller,
    'seo_title', p.seo_title,
    'seo_description', p.seo_description,
    'category', (
      select jsonb_build_object('id', c.id, 'slug', c.slug, 'name', coalesce(c.translations -> p_locale ->> 'name', c.name), 'department', c.department)
      from public.categories c where c.id = p.category_id
    ),
    'collections', (
      select coalesce(jsonb_agg(jsonb_build_object('slug', c.slug, 'name', coalesce(c.translations -> p_locale ->> 'name', c.name))), '[]'::jsonb)
      from public.product_collections pc join public.collections c on c.id = pc.collection_id
      where pc.product_id = p.id
    ),
    'images', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'url', i.url, 'alt', coalesce(i.alt, p.name), 'color', i.color, 'width', i.width, 'height', i.height,
        'variant_ids', (select coalesce(jsonb_agg(pvi.variant_id), '[]'::jsonb) from public.product_variant_images pvi where pvi.image_id = i.id)
      ) order by i.position), '[]'::jsonb)
      from public.product_images i where i.product_id = p.id
    ),
    'options', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'kind', o.kind, 'value', o.value, 'hex', o.swatch_hex,
        'label', coalesce(o.translations -> p_locale ->> 'label', o.value)
      ) order by o.kind, o.position, public.size_rank(o.value)), '[]'::jsonb)
      from public.product_options o where o.product_id = p.id
    ),
    'variants', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', v.id, 'sku', v.sku, 'color', v.color, 'size', v.size,
        'price', pr.unit_price, 'compare_at', pr.compare_at,
        'available', greatest(coalesce(i.on_hand - i.reserved, 0), 0),
        'low_stock', coalesce(i.on_hand - i.reserved, 0) between 1 and coalesce(i.low_stock_threshold, 0)
      ) order by v.position, public.size_rank(v.size)), '[]'::jsonb)
      from public.product_variants v
      left join public.inventory i on i.variant_id = v.id
      cross join lateral public.variant_unit_price(p.price, p.sale_price, v.price, v.sale_price) pr
      where v.product_id = p.id and v.is_active and v.deleted_at is null
    ),
    'rating', (
      select jsonb_build_object('average', round(avg(r.rating)::numeric, 1), 'count', count(*))
      from public.reviews r where r.product_id = p.id and r.is_approved
    ),
    'reviews', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'author', r.author_name, 'rating', r.rating, 'title', r.title, 'body', r.body, 'created_at', r.created_at
      ) order by r.created_at desc), '[]'::jsonb)
      from (select * from public.reviews where product_id = p.id and is_approved order by created_at desc limit 6) r
    ),
    'related', (
      select coalesce(jsonb_agg(public.product_card(rp.id, p_locale)), '[]'::jsonb)
      from (
        select r.id from public.products r
        where r.id <> p.id and r.status = 'active' and r.deleted_at is null
          and (r.category_id = p.category_id or r.department = p.department)
        order by (r.category_id = p.category_id) desc, r.sales_count desc
        limit 8
      ) rp
    )
  )
  from public.products p
  where p.slug = p_slug and p.deleted_at is null;
$$;

grant execute on function public.get_product(text, text) to anon, authenticated;

-- Product cards for a list of ids (wishlist, recently viewed), preserving order.
create or replace function public.product_cards(p_ids uuid[], p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(public.product_card(p.id, p_locale) order by array_position(p_ids, p.id)), '[]'::jsonb)
  from public.products p
  where p.id = any (p_ids) and p.status = 'active' and p.deleted_at is null;
$$;

grant execute on function public.product_cards(uuid[], text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Search suggestions (type-ahead)
-- ---------------------------------------------------------------------------
create or replace function public.search_suggestions(p_query text, p_locale text default 'en', p_limit integer default 6)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with q as (select lower(extensions.unaccent(trim(coalesce(p_query, '')))) as term)
  select jsonb_build_object(
    'products', (
      select coalesce(jsonb_agg(x.card order by x.score desc), '[]'::jsonb)
      from (
        select public.product_card(p.id, p_locale) as card,
               extensions.similarity(p.search_text, q.term) + case when p.search_text like q.term || '%' then 1 else 0 end as score
        from public.products p, q
        where length(q.term) >= 2 and p.status = 'active' and p.deleted_at is null
          and (p.search_text like '%' || q.term || '%' or extensions.similarity(p.search_text, q.term) > 0.25)
        order by score desc
        limit least(greatest(p_limit, 1), 12)
      ) x
    ),
    'categories', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'department', c.department, 'name', coalesce(c.translations -> p_locale ->> 'name', c.name)
      )), '[]'::jsonb)
      from (
        select c.* from public.categories c, q
        where length(q.term) >= 2 and c.is_active and c.deleted_at is null
          and lower(extensions.unaccent(c.name || ' ' || coalesce(c.translations -> 'ar' ->> 'name', ''))) like '%' || q.term || '%'
        order by c.position limit 4
      ) c
    )
  );
$$;

grant execute on function public.search_suggestions(text, text, integer) to anon, authenticated;
