-- =============================================================================
-- VOVIAN · 0600 · Row Level Security
--
-- Model:
--   * Customers read/write only their own private rows.
--   * Staff access is granted per permission via public.has_permission().
--   * Financially sensitive tables (orders, order_items, payments, inventory,
--     movements, discount usage, audit log) have NO direct write grants for
--     API roles — they change only through SECURITY DEFINER functions that
--     re-validate everything server-side.
-- =============================================================================

-- Enable RLS everywhere in public
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Write-protected tables: strip direct DML from API roles
-- ---------------------------------------------------------------------------
revoke insert, update, delete on
  public.orders, public.order_items, public.order_status_history, public.payments,
  public.inventory, public.inventory_movements, public.discount_usage, public.audit_logs,
  public.user_roles, public.permissions, public.role_permissions,
  public.newsletter_subscribers, public.contact_messages
from anon, authenticated;

-- Staff may resolve contact messages / manage subscribers through policies below
grant update on public.contact_messages to authenticated;
grant update, delete on public.newsletter_subscribers to authenticated;

-- Profiles: customers may only edit their own non-privileged columns.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url, locale, marketing_opt_in) on public.profiles to authenticated;

-- Orders are never readable anonymously (guest lookups go through track_order()).
revoke select on public.orders, public.order_items, public.order_status_history, public.payments, public.order_notes from anon;

-- ---------------------------------------------------------------------------
-- Identity & RBAC
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.has_permission('customers.read') or public.has_permission('staff.manage'));

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy permissions_select on public.permissions for select to authenticated using (true);
create policy role_permissions_select on public.role_permissions for select to authenticated using (true);

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('staff.manage'));

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create policy categories_public_read on public.categories for select to anon, authenticated
  using ((is_active and deleted_at is null) or public.has_permission('products.read'));
create policy categories_write on public.categories for insert to authenticated
  with check (public.has_permission('products.write'));
create policy categories_update on public.categories for update to authenticated
  using (public.has_permission('products.write')) with check (public.has_permission('products.write'));
create policy categories_delete on public.categories for delete to authenticated
  using (public.has_permission('products.delete'));

create policy collections_public_read on public.collections for select to anon, authenticated
  using ((is_active and deleted_at is null) or public.has_permission('products.read'));
create policy collections_insert on public.collections for insert to authenticated
  with check (public.has_permission('products.write'));
create policy collections_update on public.collections for update to authenticated
  using (public.has_permission('products.write')) with check (public.has_permission('products.write'));
create policy collections_delete on public.collections for delete to authenticated
  using (public.has_permission('products.delete'));

create policy products_public_read on public.products for select to anon, authenticated
  using ((status = 'active' and deleted_at is null) or public.has_permission('products.read'));
create policy products_insert on public.products for insert to authenticated
  with check (public.has_permission('products.write'));
create policy products_update on public.products for update to authenticated
  using (public.has_permission('products.write')) with check (public.has_permission('products.write'));
create policy products_delete on public.products for delete to authenticated
  using (public.has_permission('products.delete'));

-- Child catalog tables: visible when the parent product is visible (the
-- products policy is applied inside the EXISTS), writable with products.write.
do $$
declare t text;
begin
  foreach t in array array['product_options', 'product_variants', 'product_images', 'product_collections'] loop
    execute format($f$
      create policy %1$s_read on public.%1$s for select to anon, authenticated
        using (exists (select 1 from public.products p where p.id = product_id));
      create policy %1$s_insert on public.%1$s for insert to authenticated
        with check (public.has_permission('products.write'));
      create policy %1$s_update on public.%1$s for update to authenticated
        using (public.has_permission('products.write')) with check (public.has_permission('products.write'));
      create policy %1$s_delete on public.%1$s for delete to authenticated
        using (public.has_permission('products.write'));
    $f$, t);
  end loop;
end $$;

create policy product_variant_images_read on public.product_variant_images for select to anon, authenticated
  using (exists (select 1 from public.product_variants v where v.id = variant_id));
create policy product_variant_images_write on public.product_variant_images for all to authenticated
  using (public.has_permission('products.write')) with check (public.has_permission('products.write'));

create policy inventory_read on public.inventory for select to anon, authenticated
  using (
    public.has_permission('inventory.read')
    or exists (select 1 from public.product_variants v where v.id = variant_id and v.is_active and v.deleted_at is null)
  );

create policy inventory_movements_read on public.inventory_movements for select to authenticated
  using (public.has_permission('inventory.read'));

create policy reviews_read on public.reviews for select to anon, authenticated
  using (is_approved or user_id = (select auth.uid()) or public.has_permission('products.read'));
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and is_approved = false);
create policy reviews_moderate on public.reviews for update to authenticated
  using (public.has_permission('products.write')) with check (public.has_permission('products.write'));
create policy reviews_delete on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('products.write'));

-- ---------------------------------------------------------------------------
-- Customer-private data
-- ---------------------------------------------------------------------------
create policy addresses_own on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy addresses_staff_read on public.addresses for select to authenticated
  using (public.has_permission('customers.read'));

create policy carts_own on public.carts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy cart_items_own on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

create policy wishlists_own on public.wishlists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy wishlist_items_own on public.wishlist_items for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Shipping & discounts
-- ---------------------------------------------------------------------------
create policy governorates_read on public.governorates for select to anon, authenticated using (true);
create policy governorates_write on public.governorates for all to authenticated
  using (public.has_permission('settings.write')) with check (public.has_permission('settings.write'));

create policy shipping_zones_read on public.shipping_zones for select to anon, authenticated
  using (is_active or public.has_permission('settings.read'));
create policy shipping_zones_write on public.shipping_zones for all to authenticated
  using (public.has_permission('settings.write')) with check (public.has_permission('settings.write'));

create policy shipping_methods_read on public.shipping_methods for select to anon, authenticated
  using (is_active or public.has_permission('settings.read'));
create policy shipping_methods_write on public.shipping_methods for all to authenticated
  using (public.has_permission('settings.write')) with check (public.has_permission('settings.write'));

create policy discount_codes_read on public.discount_codes for select to authenticated
  using (public.has_permission('discounts.read'));
create policy discount_codes_insert on public.discount_codes for insert to authenticated
  with check (public.has_permission('discounts.write'));
create policy discount_codes_update on public.discount_codes for update to authenticated
  using (public.has_permission('discounts.write')) with check (public.has_permission('discounts.write'));
create policy discount_codes_delete on public.discount_codes for delete to authenticated
  using (public.has_permission('discounts.write'));

create policy discount_usage_read on public.discount_usage for select to authenticated
  using (public.has_permission('discounts.read'));

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create policy orders_read on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('orders.read'));

create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy order_status_history_read on public.order_status_history for select to authenticated
  using (
    public.has_permission('orders.read')
    or (is_customer_visible and exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())))
  );

create policy payments_read on public.payments for select to authenticated
  using (public.has_permission('orders.read'));

create policy order_notes_read on public.order_notes for select to authenticated
  using (public.has_permission('orders.read'));
create policy order_notes_insert on public.order_notes for insert to authenticated
  with check (public.has_permission('orders.write') and author_id = (select auth.uid()));
create policy order_notes_delete on public.order_notes for delete to authenticated
  using (author_id = (select auth.uid()) and public.has_permission('orders.write'));

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create policy homepage_banners_read on public.homepage_banners for select to anon, authenticated
  using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or public.has_permission('content.read')
  );
create policy homepage_banners_write on public.homepage_banners for all to authenticated
  using (public.has_permission('content.write')) with check (public.has_permission('content.write'));

create policy homepage_sections_read on public.homepage_sections for select to anon, authenticated
  using (is_active or public.has_permission('content.read'));
create policy homepage_sections_write on public.homepage_sections for all to authenticated
  using (public.has_permission('content.write')) with check (public.has_permission('content.write'));

create policy pages_read on public.pages for select to anon, authenticated
  using (is_published or public.has_permission('content.read'));
create policy pages_write on public.pages for all to authenticated
  using (public.has_permission('content.write')) with check (public.has_permission('content.write'));

create policy navigation_menus_read on public.navigation_menus for select to anon, authenticated using (true);
create policy navigation_menus_write on public.navigation_menus for all to authenticated
  using (public.has_permission('content.write')) with check (public.has_permission('content.write'));

create policy store_settings_read on public.store_settings for select to anon, authenticated
  using (is_public or public.has_permission('settings.read'));
create policy store_settings_write on public.store_settings for all to authenticated
  using (public.has_permission('settings.write')) with check (public.has_permission('settings.write'));

create policy newsletter_read on public.newsletter_subscribers for select to authenticated
  using (public.has_permission('content.read'));
create policy newsletter_update on public.newsletter_subscribers for update to authenticated
  using (public.has_permission('content.write')) with check (public.has_permission('content.write'));
create policy newsletter_delete on public.newsletter_subscribers for delete to authenticated
  using (public.has_permission('content.write'));

create policy contact_messages_read on public.contact_messages for select to authenticated
  using (public.has_permission('customers.read'));
create policy contact_messages_update on public.contact_messages for update to authenticated
  using (public.has_permission('customers.write')) with check (public.has_permission('customers.write'));

-- ---------------------------------------------------------------------------
-- Notifications & audit
-- ---------------------------------------------------------------------------
create policy notifications_read on public.notifications for select to authenticated
  using (
    (audience = 'customer' and user_id = (select auth.uid()))
    or (audience = 'staff' and public.is_staff() and (permission is null or public.has_permission(permission)))
  );

revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_mark_read on public.notifications for update to authenticated
  using (
    (audience = 'customer' and user_id = (select auth.uid()))
    or (audience = 'staff' and public.is_staff() and (permission is null or public.has_permission(permission)))
  );

create policy audit_logs_read on public.audit_logs for select to authenticated
  using (public.has_permission('audit.read'));
