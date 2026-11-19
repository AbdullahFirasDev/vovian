import type { AppRole } from '@vovian/types'

/** Mirrors public.permissions + public.role_permissions (migration 0200). Used for UI shaping only. */
export const PERMISSIONS = [
  'dashboard.view',
  'products.read', 'products.write', 'products.delete',
  'inventory.read', 'inventory.write',
  'orders.read', 'orders.write',
  'customers.read', 'customers.write',
  'discounts.read', 'discounts.write',
  'content.read', 'content.write',
  'settings.read', 'settings.write',
  'staff.manage', 'audit.read',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super admin',
  store_manager: 'Store manager',
  product_manager: 'Product manager',
  order_manager: 'Order manager',
  inventory_manager: 'Inventory manager',
  content_manager: 'Content manager',
}

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Full access, including staff and roles.',
  store_manager: 'Everything except staff management.',
  product_manager: 'Catalogue: products, variants, categories, collections.',
  order_manager: 'Orders, payments and customers.',
  inventory_manager: 'Stock levels and adjustments.',
  content_manager: 'Homepage, pages, menus and newsletter.',
}

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  store_manager: PERMISSIONS.filter((p) => p !== 'staff.manage'),
  product_manager: ['dashboard.view', 'products.read', 'products.write', 'products.delete', 'inventory.read', 'discounts.read', 'content.read'],
  order_manager: ['dashboard.view', 'orders.read', 'orders.write', 'customers.read', 'customers.write', 'products.read', 'inventory.read', 'discounts.read'],
  inventory_manager: ['dashboard.view', 'inventory.read', 'inventory.write', 'products.read', 'orders.read'],
  content_manager: ['dashboard.view', 'content.read', 'content.write', 'products.read', 'discounts.read'],
}

export function permissionsForRoles(roles: AppRole[]): Set<Permission> {
  return new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []))
}
