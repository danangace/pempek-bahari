import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { OrderStatus, OrderWithItems } from "@/types"

interface UseOrdersResult {
  orders: OrderWithItems[]
  loading: boolean
  error: string | null
  refetch: () => void
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>
  markTransactionPaid: (orderId: string) => Promise<void>
  setDeliveryCost: (orderId: string, cost: number | null) => Promise<void>
  setDiscount: (orderId: string, discount: number | null) => Promise<void>
  setBankAccount: (orderId: string, bankAccountId: string | null) => Promise<void>
  setDeliveryType: (orderId: string, deliveryTypeId: string | null) => Promise<void>
}

export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = React.useState<OrderWithItems[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function fetchOrders() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*, order_items(*, order_item_compositions(*)), transactions(id, is_paid, delivery_cost, discount, bank_account_id, bank_accounts(id, name, bank_name, account_number), delivery_type_id, delivery_types(id, name, is_active))")
        .order("created_at", { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setOrders((data as OrderWithItems[]) ?? [])
      }
      setLoading(false)
    }

    void fetchOrders()
    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = React.useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  const updateStatus = React.useCallback(
    async (orderId: string, status: OrderStatus) => {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
    },
    []
  )

  const markTransactionPaid = React.useCallback(async (orderId: string) => {
    const paidAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ is_paid: true, paid_at: paidAt })
      .eq("order_id", orderId)

    if (updateError) throw new Error(updateError.message)

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const existing = o.transactions
        return {
          ...o,
          transactions: {
            id: existing?.id ?? "",
            is_paid: true,
            delivery_cost: existing?.delivery_cost ?? null,
            discount: existing?.discount ?? null,
            bank_account_id: existing?.bank_account_id ?? null,
            bank_accounts: existing?.bank_accounts ?? null,
            delivery_type_id: existing?.delivery_type_id ?? null,
            delivery_types: existing?.delivery_types ?? null,
          },
        }
      })
    )
  }, [])

  const setDeliveryCost = React.useCallback(
    async (orderId: string, cost: number | null) => {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ delivery_cost: cost })
        .eq("order_id", orderId)

      if (updateError) throw new Error(updateError.message)

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o
          const existing = o.transactions
          return {
            ...o,
            transactions: {
              id: existing?.id ?? "",
              is_paid: existing?.is_paid ?? false,
              delivery_cost: cost,
              discount: existing?.discount ?? null,
              bank_account_id: existing?.bank_account_id ?? null,
              bank_accounts: existing?.bank_accounts ?? null,
              delivery_type_id: existing?.delivery_type_id ?? null,
              delivery_types: existing?.delivery_types ?? null,
            },
          }
        })
      )
    },
    []
  )

  const setDiscount = React.useCallback(
    async (orderId: string, discount: number | null) => {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ discount })
        .eq("order_id", orderId)

      if (updateError) throw new Error(updateError.message)

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o
          const existing = o.transactions
          return {
            ...o,
            transactions: {
              id: existing?.id ?? "",
              is_paid: existing?.is_paid ?? false,
              delivery_cost: existing?.delivery_cost ?? null,
              discount,
              bank_account_id: existing?.bank_account_id ?? null,
              bank_accounts: existing?.bank_accounts ?? null,
              delivery_type_id: existing?.delivery_type_id ?? null,
              delivery_types: existing?.delivery_types ?? null,
            },
          }
        })
      )
    },
    []
  )

  const setBankAccount = React.useCallback(
    async (orderId: string, bankAccountId: string | null) => {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ bank_account_id: bankAccountId })
        .eq("order_id", orderId)

      if (updateError) throw new Error(updateError.message)

      // Optimistic update: refetch to get bank_accounts join populated
      setTick((t) => t + 1)
    },
    []
  )

  const setDeliveryType = React.useCallback(
    async (orderId: string, deliveryTypeId: string | null) => {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ delivery_type_id: deliveryTypeId })
        .eq("order_id", orderId)

      if (updateError) throw new Error(updateError.message)

      // Refetch to get delivery_types join populated
      setTick((t) => t + 1)
    },
    []
  )

  return { orders, loading, error, refetch, updateStatus, markTransactionPaid, setDeliveryCost, setDiscount, setBankAccount, setDeliveryType }
}
