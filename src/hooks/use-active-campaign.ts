import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { Campaign } from "@/types"

interface UseActiveCampaignResult {
  campaign: Campaign | null
  loading: boolean
  error: string | null
}

export function useActiveCampaign(): UseActiveCampaignResult {
  const [campaign, setCampaign] = React.useState<Campaign | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function fetchActiveCampaign() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "open_order")
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCampaign((data as Campaign) ?? null)
      }
      setLoading(false)
    }

    void fetchActiveCampaign()
    return () => {
      cancelled = true
    }
  }, [])

  return { campaign, loading, error }
}
