import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { DeliveryTypeOption } from "@/types"

interface UseDeliveryTypesResult {
  deliveryTypes: DeliveryTypeOption[]
  loading: boolean
  refetch: () => void
  createDeliveryType: (name: string) => Promise<void>
  updateDeliveryType: (id: string, data: { name?: string; is_active?: boolean }) => Promise<void>
}

export function useDeliveryTypes(): UseDeliveryTypesResult {
  const [deliveryTypes, setDeliveryTypes] = React.useState<DeliveryTypeOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function fetchDeliveryTypes() {
      setLoading(true)
      const { data } = await supabase
        .from("delivery_types")
        .select("id, name, is_active")
        .order("name")

      if (!cancelled) {
        setDeliveryTypes((data as DeliveryTypeOption[]) ?? [])
        setLoading(false)
      }
    }

    void fetchDeliveryTypes()
    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  const createDeliveryType = React.useCallback(async (name: string) => {
    const { error } = await supabase
      .from("delivery_types")
      .insert({ name: name.trim() })

    if (error) throw new Error(error.message)
    setTick((t) => t + 1)
  }, [])

  const updateDeliveryType = React.useCallback(
    async (id: string, data: { name?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from("delivery_types")
        .update(data)
        .eq("id", id)

      if (error) throw new Error(error.message)
      setTick((t) => t + 1)
    },
    []
  )

  return { deliveryTypes, loading, refetch, createDeliveryType, updateDeliveryType }
}
