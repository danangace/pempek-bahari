export type OrderStatus =
  | "pending"
  | "in_production"
  | "delivered"
  | "paid"
  | "cancelled"

export type CampaignStatus =
  | "draft"
  | "open_order"
  | "production"
  | "distribution"
  | "closed"

export type PaymentType = "bayar_sekarang" | "bayar_nanti"

// ---------------------------------------------------------------------------
// Pempek types & compositions
// ---------------------------------------------------------------------------

export interface PempekType {
  id: string
  name: string
  price: number
  status: "ACTIVE" | "INACTIVE"
}

/** Blueprint composition row joined with pempek_type details — used in product display */
export interface ProductCompositionWithType {
  id: string
  pempek_type_id: string
  pempek_type_name: string
  price: number
  quantity: number
}

/** Per-order-item composition snapshot stored at order time */
export interface OrderItemComposition {
  id: string
  order_item_id: string
  pempek_type_id: string
  quantity: number
  price_at_order: number
}

/** Transient composition stored in cart for Mix Custom items */
export interface CartItemComposition {
  pempek_type_id: string
  pempek_type_name: string
  price_per_piece: number
  quantity: number
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string
  name: string
  description: string | null
  purchase_start_date: string
  purchase_end_date: string
  start_delivery_date: string | null
  status: CampaignStatus
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  image_path: string | null
  category: string
  is_available: boolean
  is_custom_mix: boolean
  created_at: string
  /** Joined from product_compositions → pempek_types. Always present when loaded via useProducts. */
  compositions?: ProductCompositionWithType[]
}

export interface Order {
  id: string
  campaign_id: string | null
  customer_name: string
  whatsapp_number: string
  address: string
  note: string | null
  total_amount: number
  status: OrderStatus
  payment_type: PaymentType
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  /** Joined from order_item_compositions. Present when fetched with compositions join. */
  order_item_compositions?: OrderItemComposition[]
}

export interface BankAccount {
  id: string
  name: string
  bank_name: string
  account_number: string
}

export interface DeliveryTypeOption {
  id: string
  name: string
  is_active: boolean
}

export interface Transaction {
  id: string
  order_id: string
  is_paid: boolean
  paid_at: string | null
  delivery_cost: number | null
  discount: number | null
  cash_advance: number | null
  bank_account_id: string | null
  bank_accounts?: BankAccount | null
  delivery_type_id: string | null
  delivery_types?: DeliveryTypeOption | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

/** Unit price for a fixed product computed from its blueprint compositions. Returns 0 if not loaded. */
export function computeUnitPrice(product: Product): number {
  return (product.compositions ?? []).reduce((sum, c) => sum + c.price * c.quantity, 0)
}

/** Unit price for a cart item. Mix Custom uses custom_compositions; fixed uses product compositions. */
export function computeCartItemUnitPrice(item: CartItem): number {
  if (item.custom_compositions && item.custom_compositions.length > 0) {
    return item.custom_compositions.reduce((sum, c) => sum + c.price_per_piece * c.quantity, 0)
  }
  return computeUnitPrice(item.product)
}

/** Unit price for an order item computed from its snapshotted order_item_compositions. */
export function computeOrderItemUnitPrice(item: OrderItem): number {
  return (item.order_item_compositions ?? []).reduce(
    (sum, c) => sum + c.price_at_order * c.quantity,
    0
  )
}

// ---------------------------------------------------------------------------
// Composite / join types
// ---------------------------------------------------------------------------

export interface OrderItemWithProduct extends OrderItem {
  products: Product | null
}

export interface OrderWithItemsAndProducts extends Order {
  order_items: OrderItemWithProduct[]
}

export interface InvoiceData extends Transaction {
  orders: OrderWithItemsAndProducts
}

/** Shape returned when orders are fetched with transaction join */
export interface TransactionSummary {
  id: string
  is_paid: boolean
  delivery_cost: number | null
  discount: number | null
  cash_advance: number | null
  bank_account_id: string | null
  bank_accounts?: BankAccount | null
  delivery_type_id: string | null
  delivery_types?: DeliveryTypeOption | null
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
  transactions?: TransactionSummary | null
}

export interface CartItem {
  product: Product
  quantity: number
  /** Only set for Mix Custom items — the user-selected composition */
  custom_compositions?: CartItemComposition[]
}

export interface CheckoutFormData {
  customer_name: string
  whatsapp_number: string
  address: string
  note: string
}

// ---------------------------------------------------------------------------
// Production log types
// ---------------------------------------------------------------------------

/** Append-only log entry: one batch of pempek cooked for a campaign */
export interface ProductionEntry {
  id: string
  campaign_id: string
  pempek_type_id: string
  quantity_pcs: number
  note: string | null
  produced_at: string
}

/** Append-only log entry: one packaging round for a campaign */
export interface PackagingEntry {
  id: string
  campaign_id: string
  product_id: string
  quantity_packs: number
  note: string | null
  packaged_at: string
}
