
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "addresses": {
                  Row: {
                    "area": string,"created_at": string,"full_name": string,"governorate": string,"id": string,"is_default": boolean,"label": string | null,"landmark": string,"phone": string,"phone_secondary": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "area": string,"created_at"?: string,"full_name": string,"governorate": string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"landmark": string,"phone": string,"phone_secondary"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "area"?: string,"created_at"?: string,"full_name"?: string,"governorate"?: string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"landmark"?: string,"phone"?: string,"phone_secondary"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_governorate_fkey"
      columns: ["governorate"]
isOneToOne: false
      referencedRelation: "governorates"
      referencedColumns: ["code"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"changes": Json | null,"created_at": string,"entity": string,"entity_id": string | null,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"cart_items": {
                  Row: {
                    "cart_id": string,"created_at": string,"id": string,"quantity": number,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cart_id": string,"created_at"?: string,"id"?: string,"quantity": number,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "cart_id"?: string,"created_at"?: string,"id"?: string,"quantity"?: number,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cart_items_cart_id_fkey"
      columns: ["cart_id"]
isOneToOne: false
      referencedRelation: "carts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cart_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"carts": {
                  Row: {
                    "created_at": string,"discount_code": string | null,"id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"discount_code"?: string | null,"id"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"discount_code"?: string | null,"id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"department": Database["public"]['Enums']["department"],"description": string | null,"id": string,"image_url": string | null,"is_active": boolean,"name": string,"parent_id": string | null,"position": number,"seo_description": string | null,"seo_title": string | null,"slug": string,"translations": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"department": Database["public"]['Enums']["department"],"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name": string,"parent_id"?: string | null,"position"?: number,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"department"?: Database["public"]['Enums']["department"],"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"name"?: string,"parent_id"?: string | null,"position"?: number,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "cover_image_url": string | null,"created_at": string,"deleted_at": string | null,"description": string | null,"ends_at": string | null,"gallery": NonNullable<Json>,"hero_image_url": string | null,"id": string,"is_active": boolean,"is_featured": boolean,"name": string,"position": number,"seo_description": string | null,"seo_title": string | null,"slug": string,"starts_at": string | null,"subtitle": string | null,"translations": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_image_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"ends_at"?: string | null,"gallery"?: NonNullable<Json>,"hero_image_url"?: string | null,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name": string,"position"?: number,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"starts_at"?: string | null,"subtitle"?: string | null,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "cover_image_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"ends_at"?: string | null,"gallery"?: NonNullable<Json>,"hero_image_url"?: string | null,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name"?: string,"position"?: number,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"starts_at"?: string | null,"subtitle"?: string | null,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"contact_messages": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"is_resolved": boolean,"message": string,"name": string,"order_number": string | null,"topic": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"id"?: string,"is_resolved"?: boolean,"message": string,"name": string,"order_number"?: string | null,"topic"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"is_resolved"?: boolean,"message"?: string,"name"?: string,"order_number"?: string | null,"topic"?: string
                  }
                  Relationships: [
                    
                  ]
                },"discount_codes": {
                  Row: {
                    "category_ids": (string)[],"code": string,"created_at": string,"created_by": string | null,"description": string | null,"expires_at": string | null,"id": string,"is_active": boolean,"min_order_value": number | null,"product_ids": (string)[],"scope": Database["public"]['Enums']["discount_scope"],"starts_at": string | null,"times_used": number,"type": Database["public"]['Enums']["discount_type"],"updated_at": string,"usage_limit": number | null,"usage_limit_per_customer": number | null,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category_ids"?: (string)[],"code": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"min_order_value"?: number | null,"product_ids"?: (string)[],"scope"?: Database["public"]['Enums']["discount_scope"],"starts_at"?: string | null,"times_used"?: number,"type": Database["public"]['Enums']["discount_type"],"updated_at"?: string,"usage_limit"?: number | null,"usage_limit_per_customer"?: number | null,"value"?: number
                  }
                  Update: {
                    "category_ids"?: (string)[],"code"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"expires_at"?: string | null,"id"?: string,"is_active"?: boolean,"min_order_value"?: number | null,"product_ids"?: (string)[],"scope"?: Database["public"]['Enums']["discount_scope"],"starts_at"?: string | null,"times_used"?: number,"type"?: Database["public"]['Enums']["discount_type"],"updated_at"?: string,"usage_limit"?: number | null,"usage_limit_per_customer"?: number | null,"value"?: number
                  }
                  Relationships: [
                    
                  ]
                },"discount_usage": {
                  Row: {
                    "amount": number,"created_at": string,"discount_id": string,"email": string,"id": string,"order_id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"discount_id": string,"email": string,"id"?: string,"order_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"discount_id"?: string,"email"?: string,"id"?: string,"order_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "discount_usage_discount_id_fkey"
      columns: ["discount_id"]
isOneToOne: false
      referencedRelation: "discount_codes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "discount_usage_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"governorates": {
                  Row: {
                    "code": string,"is_active": boolean,"name": string,"position": number,"region": string,"translations": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"is_active"?: boolean,"name": string,"position"?: number,"region"?: string,"translations"?: NonNullable<Json>
                  }
                  Update: {
                    "code"?: string,"is_active"?: boolean,"name"?: string,"position"?: number,"region"?: string,"translations"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"homepage_banners": {
                  Row: {
                    "body": string | null,"created_at": string,"cta_href": string | null,"cta_label": string | null,"cta_secondary_href": string | null,"cta_secondary_label": string | null,"ends_at": string | null,"id": string,"image_url": string | null,"image_url_secondary": string | null,"is_active": boolean,"mobile_image_url": string | null,"placement": string,"position": number,"starts_at": string | null,"subtitle": string | null,"title": string,"translations": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"cta_secondary_href"?: string | null,"cta_secondary_label"?: string | null,"ends_at"?: string | null,"id"?: string,"image_url"?: string | null,"image_url_secondary"?: string | null,"is_active"?: boolean,"mobile_image_url"?: string | null,"placement"?: string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title": string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"cta_secondary_href"?: string | null,"cta_secondary_label"?: string | null,"ends_at"?: string | null,"id"?: string,"image_url"?: string | null,"image_url_secondary"?: string | null,"is_active"?: boolean,"mobile_image_url"?: string | null,"placement"?: string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"homepage_sections": {
                  Row: {
                    "body": string | null,"config": NonNullable<Json>,"created_at": string,"id": string,"is_active": boolean,"position": number,"subtitle": string | null,"title": string | null,"translations": NonNullable<Json>,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"subtitle"?: string | null,"title"?: string | null,"translations"?: NonNullable<Json>,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"subtitle"?: string | null,"title"?: string | null,"translations"?: NonNullable<Json>,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"inventory": {
                  Row: {
                    "low_stock_threshold": number,"on_hand": number,"reserved": number,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "low_stock_threshold"?: number,"on_hand"?: number,"reserved"?: number,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "low_stock_threshold"?: number,"on_hand"?: number,"reserved"?: number,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: true
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"inventory_movements": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"delta": number,"id": number,"note": string | null,"quantity_after": number,"reason": Database["public"]['Enums']["inventory_reason"],"reference_id": string | null,"reference_type": string | null,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"delta": number,"id"?: never,"note"?: string | null,"quantity_after": number,"reason": Database["public"]['Enums']["inventory_reason"],"reference_id"?: string | null,"reference_type"?: string | null,"variant_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"delta"?: number,"id"?: never,"note"?: string | null,"quantity_after"?: number,"reason"?: Database["public"]['Enums']["inventory_reason"],"reference_id"?: string | null,"reference_type"?: string | null,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"navigation_menus": {
                  Row: {
                    "handle": string,"id": string,"items": NonNullable<Json>,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "handle": string,"id"?: string,"items"?: NonNullable<Json>,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "handle"?: string,"id"?: string,"items"?: NonNullable<Json>,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"newsletter_subscribers": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"is_subscribed": boolean,"locale": string,"source": string,"unsubscribed_at": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"id"?: string,"is_subscribed"?: boolean,"locale"?: string,"source"?: string,"unsubscribed_at"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"is_subscribed"?: boolean,"locale"?: string,"source"?: string,"unsubscribed_at"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "audience": string,"body": string | null,"created_at": string,"data": NonNullable<Json>,"id": string,"link": string | null,"permission": string | null,"read_at": string | null,"title": string,"type": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audience": string,"body"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"link"?: string | null,"permission"?: string | null,"read_at"?: string | null,"title": string,"type": string,"user_id"?: string | null
                  }
                  Update: {
                    "audience"?: string,"body"?: string | null,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"link"?: string | null,"permission"?: string | null,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"order_items": {
                  Row: {
                    "color": string | null,"compare_at": number | null,"created_at": string,"discount_amount": number,"id": string,"image_url": string | null,"line_total": number,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"size": string | null,"sku": string,"unit_price": number,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string | null,"compare_at"?: number | null,"created_at"?: string,"discount_amount"?: number,"id"?: string,"image_url"?: string | null,"line_total": number,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"size"?: string | null,"sku": string,"unit_price": number,"variant_id"?: string | null
                  }
                  Update: {
                    "color"?: string | null,"compare_at"?: number | null,"created_at"?: string,"discount_amount"?: number,"id"?: string,"image_url"?: string | null,"line_total"?: number,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"size"?: string | null,"sku"?: string,"unit_price"?: number,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"order_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"order_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_notes_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_status_history": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"from_status": Database["public"]['Enums']["order_status"] | null,"id": number,"is_customer_visible": boolean,"note": string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"is_customer_visible"?: boolean,"note"?: string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"is_customer_visible"?: boolean,"note"?: string | null,"order_id"?: string,"to_status"?: Database["public"]['Enums']["order_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_status_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "access_token": string,"cancelled_at": string | null,"confirmed_at": string | null,"created_at": string,"currency": string,"customer_name": string,"delivered_at": string | null,"delivery_instructions": string | null,"discount_code": string | null,"discount_total": number,"email": string,"id": string,"idempotency_key": string,"locale": string,"order_number": string,"payment_method": string,"payment_status": Database["public"]['Enums']["payment_status"],"phone": string,"phone_secondary": string | null,"placed_ip": string | null,"shipped_at": string | null,"shipping_address": NonNullable<Json>,"shipping_method_id": string | null,"shipping_method_name": string,"shipping_total": number,"status": Database["public"]['Enums']["order_status"],"subtotal": number,"tax_inclusive": boolean,"tax_total": number,"total": number,"tracking_number": string | null,"tracking_url": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_token"?: string,"cancelled_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"currency"?: string,"customer_name": string,"delivered_at"?: string | null,"delivery_instructions"?: string | null,"discount_code"?: string | null,"discount_total"?: number,"email": string,"id"?: string,"idempotency_key": string,"locale"?: string,"order_number"?: string,"payment_method": string,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone": string,"phone_secondary"?: string | null,"placed_ip"?: string | null,"shipped_at"?: string | null,"shipping_address": NonNullable<Json>,"shipping_method_id"?: string | null,"shipping_method_name": string,"shipping_total"?: number,"status"?: Database["public"]['Enums']["order_status"],"subtotal": number,"tax_inclusive"?: boolean,"tax_total"?: number,"total": number,"tracking_number"?: string | null,"tracking_url"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "access_token"?: string,"cancelled_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"currency"?: string,"customer_name"?: string,"delivered_at"?: string | null,"delivery_instructions"?: string | null,"discount_code"?: string | null,"discount_total"?: number,"email"?: string,"id"?: string,"idempotency_key"?: string,"locale"?: string,"order_number"?: string,"payment_method"?: string,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone"?: string,"phone_secondary"?: string | null,"placed_ip"?: string | null,"shipped_at"?: string | null,"shipping_address"?: NonNullable<Json>,"shipping_method_id"?: string | null,"shipping_method_name"?: string,"shipping_total"?: number,"status"?: Database["public"]['Enums']["order_status"],"subtotal"?: number,"tax_inclusive"?: boolean,"tax_total"?: number,"total"?: number,"tracking_number"?: string | null,"tracking_url"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_shipping_method_id_fkey"
      columns: ["shipping_method_id"]
isOneToOne: false
      referencedRelation: "shipping_methods"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_published": boolean,"seo_description": string | null,"seo_title": string | null,"slug": string,"summary": string | null,"title": string,"translations": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"summary"?: string | null,"title": string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_published"?: boolean,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"summary"?: string | null,"title"?: string,"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"currency": string,"id": string,"order_id": string,"provider": string,"provider_payload": NonNullable<Json>,"recorded_by": string | null,"reference": string | null,"status": Database["public"]['Enums']["payment_record_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"currency": string,"id"?: string,"order_id": string,"provider": string,"provider_payload"?: NonNullable<Json>,"recorded_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_record_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"currency"?: string,"id"?: string,"order_id"?: string,"provider"?: string,"provider_payload"?: NonNullable<Json>,"recorded_by"?: string | null,"reference"?: string | null,"status"?: Database["public"]['Enums']["payment_record_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "code": string,"description": string,"module": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"description": string,"module": string
                  }
                  Update: {
                    "code"?: string,"description"?: string,"module"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_collections": {
                  Row: {
                    "collection_id": string,"position": number,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"position"?: number,"product_id": string
                  }
                  Update: {
                    "collection_id"?: string,"position"?: number,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_collections_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_collections_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt": string | null,"color": string | null,"created_at": string,"height": number | null,"id": string,"position": number,"product_id": string,"storage_path": string | null,"url": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"color"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"position"?: number,"product_id": string,"storage_path"?: string | null,"url": string,"width"?: number | null
                  }
                  Update: {
                    "alt"?: string | null,"color"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"position"?: number,"product_id"?: string,"storage_path"?: string | null,"url"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_options": {
                  Row: {
                    "id": string,"kind": Database["public"]['Enums']["option_kind"],"position": number,"product_id": string,"swatch_hex": string | null,"translations": NonNullable<Json>,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"kind": Database["public"]['Enums']["option_kind"],"position"?: number,"product_id": string,"swatch_hex"?: string | null,"translations"?: NonNullable<Json>,"value": string
                  }
                  Update: {
                    "id"?: string,"kind"?: Database["public"]['Enums']["option_kind"],"position"?: number,"product_id"?: string,"swatch_hex"?: string | null,"translations"?: NonNullable<Json>,"value"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_options_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_variant_images": {
                  Row: {
                    "image_id": string,"position": number,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "image_id": string,"position"?: number,"variant_id": string
                  }
                  Update: {
                    "image_id"?: string,"position"?: number,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variant_images_image_id_fkey"
      columns: ["image_id"]
isOneToOne: false
      referencedRelation: "product_images"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_variant_images_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"product_variants": {
                  Row: {
                    "barcode": string | null,"color": string | null,"created_at": string,"deleted_at": string | null,"id": string,"is_active": boolean,"position": number,"price": number | null,"product_id": string,"sale_price": number | null,"size": string | null,"sku": string,"updated_at": string,"weight_grams": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "barcode"?: string | null,"color"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"position"?: number,"price"?: number | null,"product_id": string,"sale_price"?: number | null,"size"?: string | null,"sku": string,"updated_at"?: string,"weight_grams"?: number | null
                  }
                  Update: {
                    "barcode"?: string | null,"color"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"position"?: number,"price"?: number | null,"product_id"?: string,"sale_price"?: number | null,"size"?: string | null,"sku"?: string,"updated_at"?: string,"weight_grams"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "brand": string,"care": string | null,"category_id": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"department": Database["public"]['Enums']["department"],"description": string | null,"details": NonNullable<Json>,"fit": string | null,"id": string,"is_best_seller": boolean,"is_featured": boolean,"is_new_arrival": boolean,"material": string | null,"name": string,"price": number,"published_at": string | null,"sale_price": number | null,"sales_count": number,"search_text": string,"seo_description": string | null,"seo_title": string | null,"size_guide": string,"slug": string,"status": Database["public"]['Enums']["product_status"],"style_code": string,"tags": (string)[],"translations": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string,"care"?: string | null,"category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"department": Database["public"]['Enums']["department"],"description"?: string | null,"details"?: NonNullable<Json>,"fit"?: string | null,"id"?: string,"is_best_seller"?: boolean,"is_featured"?: boolean,"is_new_arrival"?: boolean,"material"?: string | null,"name": string,"price": number,"published_at"?: string | null,"sale_price"?: number | null,"sales_count"?: number,"search_text"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"size_guide"?: string,"slug": string,"status"?: Database["public"]['Enums']["product_status"],"style_code": string,"tags"?: (string)[],"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "brand"?: string,"care"?: string | null,"category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"department"?: Database["public"]['Enums']["department"],"description"?: string | null,"details"?: NonNullable<Json>,"fit"?: string | null,"id"?: string,"is_best_seller"?: boolean,"is_featured"?: boolean,"is_new_arrival"?: boolean,"material"?: string | null,"name"?: string,"price"?: number,"published_at"?: string | null,"sale_price"?: number | null,"sales_count"?: number,"search_text"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"size_guide"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["product_status"],"style_code"?: string,"tags"?: (string)[],"translations"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"locale": string,"marketing_opt_in": boolean,"phone": string | null,"staff_notes": string | null,"status": Database["public"]['Enums']["customer_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"locale"?: string,"marketing_opt_in"?: boolean,"phone"?: string | null,"staff_notes"?: string | null,"status"?: Database["public"]['Enums']["customer_status"],"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"locale"?: string,"marketing_opt_in"?: boolean,"phone"?: string | null,"staff_notes"?: string | null,"status"?: Database["public"]['Enums']["customer_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reviews": {
                  Row: {
                    "author_name": string,"body": string | null,"created_at": string,"id": string,"is_approved": boolean,"product_id": string,"rating": number,"title": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"body"?: string | null,"created_at"?: string,"id"?: string,"is_approved"?: boolean,"product_id": string,"rating": number,"title"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "author_name"?: string,"body"?: string | null,"created_at"?: string,"id"?: string,"is_approved"?: boolean,"product_id"?: string,"rating"?: number,"title"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "permission": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "permission": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  Update: {
                    "permission"?: string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_permission_fkey"
      columns: ["permission"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["code"]
    }
                  ]
                },"shipping_methods": {
                  Row: {
                    "code": string,"created_at": string,"description": string | null,"free_over": number | null,"id": string,"is_active": boolean,"max_days": number,"min_days": number,"name": string,"position": number,"rate": number,"translations": NonNullable<Json>,"updated_at": string,"zone_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"description"?: string | null,"free_over"?: number | null,"id"?: string,"is_active"?: boolean,"max_days"?: number,"min_days"?: number,"name": string,"position"?: number,"rate": number,"translations"?: NonNullable<Json>,"updated_at"?: string,"zone_id": string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"description"?: string | null,"free_over"?: number | null,"id"?: string,"is_active"?: boolean,"max_days"?: number,"min_days"?: number,"name"?: string,"position"?: number,"rate"?: number,"translations"?: NonNullable<Json>,"updated_at"?: string,"zone_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipping_methods_zone_id_fkey"
      columns: ["zone_id"]
isOneToOne: false
      referencedRelation: "shipping_zones"
      referencedColumns: ["id"]
    }
                  ]
                },"shipping_zones": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"name": string,"position": number,"regions": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"position"?: number,"regions"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"position"?: number,"regions"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"store_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"granted_by": string | null,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted_by"?: string | null,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"granted_by"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wishlist_items": {
                  Row: {
                    "created_at": string,"product_id": string,"wishlist_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"product_id": string,"wishlist_id": string
                  }
                  Update: {
                    "created_at"?: string,"product_id"?: string,"wishlist_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wishlist_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_items_wishlist_id_fkey"
      columns: ["wishlist_id"]
isOneToOne: false
      referencedRelation: "wishlists"
      referencedColumns: ["id"]
    }
                  ]
                },"wishlists": {
                  Row: {
                    "created_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_adjust_inventory":
{ Args: { "p_delta": number,"p_note"?: string,"p_reason"?: Database["public"]['Enums']["inventory_reason"],"p_variant_id": string }; Returns: number
                           },
"admin_archive_product":
{ Args: { "p_product_id": string }; Returns: undefined
                           },
"admin_customer":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"admin_customers":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_search"?: string,"p_status"?: Database["public"]['Enums']["customer_status"] }; Returns: Json
                           },
"admin_dashboard":
{ Args: { "p_days"?: number }; Returns: Json
                           },
"admin_duplicate_product":
{ Args: { "p_product_id": string }; Returns: string
                           },
"admin_find_user":
{ Args: { "p_email": string }; Returns: string
                           },
"admin_record_payment":
{ Args: { "p_amount": number,"p_order_id": string,"p_provider"?: string,"p_reference"?: string,"p_status": Database["public"]['Enums']["payment_record_status"] }; Returns: undefined
                           },
"admin_set_inventory":
{ Args: { "p_note"?: string,"p_quantity": number,"p_variant_id": string }; Returns: number
                           },
"admin_set_low_stock_threshold":
{ Args: { "p_threshold": number,"p_variant_id": string }; Returns: undefined
                           },
"admin_set_user_roles":
{ Args: { "p_roles": (Database["public"]['Enums']["app_role"])[],"p_user_id": string }; Returns: undefined
                           },
"admin_staff":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_update_customer":
{ Args: { "p_staff_notes": string,"p_status": Database["public"]['Enums']["customer_status"],"p_user_id": string }; Returns: undefined
                           },
"admin_update_order_status":
{ Args: { "p_customer_visible"?: boolean,"p_note"?: string,"p_order_id": string,"p_status": Database["public"]['Enums']["order_status"] }; Returns: undefined
                           },
"admin_update_order_tracking":
{ Args: { "p_order_id": string,"p_tracking_number": string,"p_tracking_url": string }; Returns: undefined
                           },
"cancel_my_order":
{ Args: { "p_order_number": string }; Returns: Json
                           },
"check_rate_limit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"get_collection":
{ Args: { "p_locale"?: string,"p_slug": string }; Returns: Json
                           },
"get_homepage":
{ Args: { "p_locale"?: string }; Returns: Json
                           },
"get_my_order":
{ Args: { "p_order_number": string }; Returns: Json
                           },
"get_order_by_token":
{ Args: { "p_order_number": string,"p_token": string }; Returns: Json
                           },
"get_page":
{ Args: { "p_locale"?: string,"p_slug": string }; Returns: Json
                           },
"get_product":
{ Args: { "p_locale"?: string,"p_slug": string }; Returns: Json
                           },
"get_store_config":
{ Args: { "p_locale"?: string }; Returns: Json
                           },
"has_permission":
{ Args: { "p_permission": string }; Returns: boolean
                           },
"has_role":
{ Args: { "p_role": Database["public"]['Enums']["app_role"] }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"merge_cart":
{ Args: { "p_items": Json }; Returns: undefined
                           },
"my_access":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"normalize_iq_phone":
{ Args: { "p_phone": string }; Returns: string
                           },
"order_transition_allowed":
{ Args: { "p_from": Database["public"]['Enums']["order_status"],"p_to": Database["public"]['Enums']["order_status"] }; Returns: boolean
                           },
"place_order":
{ Args: { "p_ip"?: string,"p_payload": Json,"p_user_id"?: string }; Returns: Json
                           },
"product_card":
{ Args: { "p_locale"?: string,"p_product_id": string }; Returns: Json
                           },
"product_cards":
{ Args: { "p_ids": (string)[],"p_locale"?: string }; Returns: Json
                           },
"quote_cart":
{ Args: { "p_discount_code"?: string,"p_email"?: string,"p_governorate"?: string,"p_items": Json,"p_locale"?: string,"p_shipping_method_id"?: string }; Returns: Json
                           },
"search_catalog":
{ Args: { "p_filters"?: Json }; Returns: Json
                           },
"search_suggestions":
{ Args: { "p_limit"?: number,"p_locale"?: string,"p_query": string }; Returns: Json
                           },
"sitemap_entries":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"size_rank":
{ Args: { "p_size": string }; Returns: number
                           },
"slugify":
{ Args: { "value": string }; Returns: string
                           },
"subscribe_newsletter":
{ Args: { "p_email": string,"p_locale"?: string,"p_source"?: string }; Returns: Json
                           },
"track_order":
{ Args: { "p_contact": string,"p_order_number": string }; Returns: Json
                           },
"variant_unit_price":
{ Args: { "p_product_price": number,"p_product_sale": number,"p_variant_price": number,"p_variant_sale": number }; Returns: {
              "compare_at": number,"unit_price": number
            }[]
                           }
          }
          Enums: {
            "app_role": "super_admin"|"store_manager"|"product_manager"|"order_manager"|"inventory_manager"|"content_manager","customer_status": "active"|"vip"|"blocked","department": "women"|"men"|"unisex","discount_scope": "all"|"products"|"categories","discount_type": "percentage"|"fixed"|"free_shipping","inventory_reason": "initial"|"order"|"cancellation"|"return"|"adjustment"|"restock"|"damage"|"correction","option_kind": "color"|"size"|"other","order_status": "pending"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled"|"returned","payment_record_status": "pending"|"paid"|"failed"|"refunded","payment_status": "unpaid"|"pending_confirmation"|"paid"|"partially_refunded"|"refunded"|"failed","product_status": "draft"|"active"|"archived"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["super_admin", "store_manager", "product_manager", "order_manager", "inventory_manager", "content_manager"],"customer_status": ["active", "vip", "blocked"],"department": ["women", "men", "unisex"],"discount_scope": ["all", "products", "categories"],"discount_type": ["percentage", "fixed", "free_shipping"],"inventory_reason": ["initial", "order", "cancellation", "return", "adjustment", "restock", "damage", "correction"],"option_kind": ["color", "size", "other"],"order_status": ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],"payment_record_status": ["pending", "paid", "failed", "refunded"],"payment_status": ["unpaid", "pending_confirmation", "paid", "partially_refunded", "refunded", "failed"],"product_status": ["draft", "active", "archived"]
          }
        }
} as const
