import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { PempekType } from "@/types"

interface UsePempekTypesResult {
  pempekTypes: PempekType[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePempekTypes(activeOnly = true): UsePempekTypesResult {
  const [pempekTypes, setPempekTypes] = React.useState<PempekType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const builder = supabase.from("pempek_types").select("*").order("name")
      const { data, error: fetchError } = activeOnly
        ? await builder.eq("status", "ACTIVE")
        : await builder

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setPempekTypes((data as PempekType[]) ?? [])
      }
      setLoading(false)
    }

    void fetch()
    return () => {
      cancelled = true
    }
  }, [tick, activeOnly])

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  return { pempekTypes, loading, error, refetch }
}

