import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { OrderWithItems } from "@/types"

interface UseOrderResult {
  order: OrderWithItems | null
  loading: boolean
  error: string | null
}

export function useOrder(orderId: string | undefined): UseOrderResult {
  const [order, setOrder] = React.useState<OrderWithItems | null>(null)
  const [loading, setLoading] = React.useState(!!orderId)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!orderId) return

    let cancelled = false

    async function fetchOrder() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*, order_items(*, order_item_compositions(*))")
        .eq("id", orderId)
        .single()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setOrder(null)
      } else {
        setOrder(data as OrderWithItems)
      }
      setLoading(false)
    }

    void fetchOrder()
    return () => {
      cancelled = true
    }
  }, [orderId])

  return { order, loading, error }
}
