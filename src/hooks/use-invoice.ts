import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { InvoiceData } from "@/types"

interface UseInvoiceResult {
  invoice: InvoiceData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useInvoice(transactionId: string | undefined): UseInvoiceResult {
  const [invoice, setInvoice] = React.useState<InvoiceData | null>(null)
  const [loading, setLoading] = React.useState(!!transactionId)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!transactionId) return

    let cancelled = false

    async function fetchInvoice() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("*, bank_accounts(id, name, bank_name, account_number), orders(*, order_items(*, products(*), order_item_compositions(*)))")
        .eq("id", transactionId)
        .single()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setInvoice(null)
      } else {
        setInvoice(data as InvoiceData)
      }
      setLoading(false)
    }

    void fetchInvoice()
    return () => {
      cancelled = true
    }
  }, [transactionId, tick])

  const refresh = React.useCallback(() => setTick((t) => t + 1), [])

  return { invoice, loading, error, refresh }
}
