-- =============================================================================
-- VOVIAN · 1100 · Storefront aggregates (one round-trip per SSR page)
-- =============================================================================

-- Public store configuration (public settings + navigation + categories)
create or replace function public.get_store_config(p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'settings', (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.store_settings where is_public
    ),
    'menus', (
      select coalesce(jsonb_object_agg(handle, items), '{}'::jsonb) from public.navigation_menus
    ),
    'governorates', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', g.code, 'name', coalesce(g.translations -> p_locale ->> 'name', g.name), 'region', g.region
      ) order by g.position), '[]'::jsonb)
      from public.governorates g where g.is_active
    ),
    'categories', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'department', c.department, 'parent_id', c.parent_id,
        'name', coalesce(c.translations -> p_locale ->> 'name', c.name),
        'image_url', c.image_url
      ) order by c.department, c.position), '[]'::jsonb)
      from public.categories c where c.is_active and c.deleted_at is null
    ),
    'collections', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'name', coalesce(c.translations -> p_locale ->> 'name', c.name),
        'cover_image_url', c.cover_image_url, 'is_featured', c.is_featured
      ) order by c.position), '[]'::jsonb)
      from public.collections c
      where c.is_active and c.deleted_at is null
        and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now())
    )
  );
$$;

grant execute on function public.get_store_config(text) to anon, authenticated;

-- Homepage: ordered sections, each resolved with its data.
create or replace function public.get_homepage(p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'banners', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'placement', b.placement,
        'title', coalesce(b.translations -> p_locale ->> 'title', b.title),
        'subtitle', coalesce(b.translations -> p_locale ->> 'subtitle', b.subtitle),
        'body', coalesce(b.translations -> p_locale ->> 'body', b.body),
        'image_url', b.image_url, 'image_url_secondary', b.image_url_secondary, 'mobile_image_url', b.mobile_image_url,
        'cta_label', coalesce(b.translations -> p_locale ->> 'cta_label', b.cta_label), 'cta_href', b.cta_href,
        'cta_secondary_label', coalesce(b.translations -> p_locale ->> 'cta_secondary_label', b.cta_secondary_label),
        'cta_secondary_href', b.cta_secondary_href
      ) order by b.placement, b.position), '[]'::jsonb)
      from public.homepage_banners b
      where b.is_active and (b.starts_at is null or b.starts_at <= now()) and (b.ends_at is null or b.ends_at > now())
    ),
    'sections', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'type', s.type,
        'title', coalesce(s.translations -> p_locale ->> 'title', s.title),
        'subtitle', coalesce(s.translations -> p_locale ->> 'subtitle', s.subtitle),
        'body', coalesce(s.translations -> p_locale ->> 'body', s.body),
        'config', s.config,
        'products', case
          when s.type = 'new_arrivals' then (
            select coalesce(jsonb_agg(public.product_card(p.id, p_locale) order by p.published_at desc), '[]'::jsonb)
            from (select id, published_at from public.products
                  where status = 'active' and deleted_at is null and is_new_arrival
                  order by published_at desc limit coalesce((s.config ->> 'limit')::integer, 8)) p)
          when s.type = 'best_sellers' then (
            select coalesce(jsonb_agg(public.product_card(p.id, p_locale) order by p.sales_count desc), '[]'::jsonb)
            from (select id, sales_count from public.products
                  where status = 'active' and deleted_at is null and (is_best_seller or sales_count > 0)
                  order by is_best_seller desc, sales_count desc limit coalesce((s.config ->> 'limit')::integer, 8)) p)
        end,
        'collections', case when s.type = 'featured_collections' then (
          select coalesce(jsonb_agg(jsonb_build_object(
            'slug', c.slug,
            'name', coalesce(c.translations -> p_locale ->> 'name', c.name),
            'subtitle', coalesce(c.translations -> p_locale ->> 'subtitle', c.subtitle),
            'description', coalesce(c.translations -> p_locale ->> 'description', c.description),
            'cover_image_url', c.cover_image_url, 'hero_image_url', c.hero_image_url, 'gallery', c.gallery,
            'products', (
              select coalesce(jsonb_agg(public.product_card(pc.product_id, p_locale) order by pc.position), '[]'::jsonb)
              from (select pc.product_id, pc.position from public.product_collections pc
                    join public.products p on p.id = pc.product_id and p.status = 'active' and p.deleted_at is null
                    where pc.collection_id = c.id order by pc.position limit 3) pc
            )
          ) order by c.position), '[]'::jsonb)
          from public.collections c
          where c.is_featured and c.is_active and c.deleted_at is null
        ) end
      ) order by s.position), '[]'::jsonb)
      from public.homepage_sections s where s.is_active
    )
  );
$$;

grant execute on function public.get_homepage(text) to anon, authenticated;

-- Collection page header
create or replace function public.get_collection(p_slug text, p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', c.slug,
    'name', coalesce(c.translations -> p_locale ->> 'name', c.name),
    'subtitle', coalesce(c.translations -> p_locale ->> 'subtitle', c.subtitle),
    'description', coalesce(c.translations -> p_locale ->> 'description', c.description),
    'cover_image_url', c.cover_image_url, 'hero_image_url', c.hero_image_url, 'gallery', c.gallery,
    'seo_title', c.seo_title, 'seo_description', c.seo_description
  )
  from public.collections c where c.slug = p_slug and c.is_active and c.deleted_at is null;
$$;

grant execute on function public.get_collection(text, text) to anon, authenticated;

-- Static page
create or replace function public.get_page(p_slug text, p_locale text default 'en')
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', p.slug,
    'title', coalesce(p.translations -> p_locale ->> 'title', p.title),
    'summary', coalesce(p.translations -> p_locale ->> 'summary', p.summary),
    'body', coalesce(p.translations -> p_locale ->> 'body', p.body),
    'seo_title', p.seo_title, 'seo_description', p.seo_description, 'updated_at', p.updated_at
  )
  from public.pages p where p.slug = p_slug and p.is_published;
$$;

grant execute on function public.get_page(text, text) to anon, authenticated;

-- Sitemap data (slugs + timestamps)
create or replace function public.sitemap_entries()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'products', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'updated_at', updated_at)), '[]'::jsonb)
                 from public.products where status = 'active' and deleted_at is null),
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'department', department, 'updated_at', updated_at)), '[]'::jsonb)
                   from public.categories where is_active and deleted_at is null),
    'collections', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'updated_at', updated_at)), '[]'::jsonb)
                    from public.collections where is_active and deleted_at is null),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'updated_at', updated_at)), '[]'::jsonb)
              from public.pages where is_published)
  );
$$;

grant execute on function public.sitemap_entries() to anon, authenticated;

-- Signed-in customer: merge a guest cart into the server cart (sums quantities, caps at 20)
create or replace function public.merge_cart(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_cart uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  insert into public.carts (user_id) values ((select auth.uid()))
  on conflict (user_id) do update set updated_at = now()
  returning id into v_cart;

  insert into public.cart_items (cart_id, variant_id, quantity)
  select v_cart, (e ->> 'variant_id')::uuid, least(greatest((e ->> 'quantity')::integer, 1), 20)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  where exists (select 1 from public.product_variants v where v.id = (e ->> 'variant_id')::uuid)
  on conflict (cart_id, variant_id) do update
    set quantity = least(public.cart_items.quantity + excluded.quantity, 20);
end;
$$;

revoke execute on function public.merge_cart(jsonb) from public, anon;
grant execute on function public.merge_cart(jsonb) to authenticated;
