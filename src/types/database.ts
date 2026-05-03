export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pempek_types: {
        Row: {
          id: string
          name: string
          price: number
          status: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          status?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          status?: string
        }
      }
      product_compositions: {
        Row: {
          id: string
          product_id: string
          pempek_type_id: string
          quantity: number
        }
        Insert: {
          id?: string
          product_id: string
          pempek_type_id: string
          quantity: number
        }
        Update: {
          id?: string
          product_id?: string
          pempek_type_id?: string
          quantity?: number
        }
      }
      order_item_compositions: {
        Row: {
          id: string
          order_item_id: string
          pempek_type_id: string
          quantity: number
          price_at_order: number
        }
        Insert: {
          id?: string
          order_item_id: string
          pempek_type_id: string
          quantity: number
          price_at_order: number
        }
        Update: {
          id?: string
          order_item_id?: string
          pempek_type_id?: string
          quantity?: number
          price_at_order?: number
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          purchase_start_date: string
          purchase_end_date: string
          start_delivery_date: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          purchase_start_date: string
          purchase_end_date: string
          start_delivery_date?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          purchase_start_date?: string
          purchase_end_date?: string
          start_delivery_date?: string | null
          status?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          image_path: string | null
          category: string
          is_available: boolean
          is_custom_mix: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_path?: string | null
          category?: string
          is_available?: boolean
          is_custom_mix?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_path?: string | null
          category?: string
          is_available?: boolean
          is_custom_mix?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          campaign_id: string | null
          customer_name: string
          whatsapp_number: string
          address: string
          note: string | null
          total_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          customer_name: string
          whatsapp_number: string
          address: string
          note?: string | null
          total_amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string | null
          customer_name?: string
          whatsapp_number?: string
          address?: string
          note?: string | null
          total_amount?: number
          status?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
      }
      delivery_types: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          order_id: string
          is_paid: boolean
          paid_at: string | null
          delivery_cost: number | null
          discount: number | null
          cash_advance: number | null
          bank_account_id: string | null
          delivery_type_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          is_paid?: boolean
          paid_at?: string | null
          delivery_cost?: number | null
          discount?: number | null
          cash_advance?: number | null
          bank_account_id?: string | null
          delivery_type_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          is_paid?: boolean
          paid_at?: string | null
          delivery_cost?: number | null
          discount?: number | null
          cash_advance?: number | null
          bank_account_id?: string | null
          delivery_type_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
