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

/**
 * Latest campaign that is past ordering (production > distribution > closed),
 * used by the storefront to explain why ordering is unavailable.
 */
export function useLatestInactiveCampaign() {
  const [campaign, setCampaign] = React.useState<Campaign | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function fetchLatest() {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .in("status", ["production", "distribution", "closed"])
        .order("created_at", { ascending: false })

      if (cancelled) return
      const list = (data as Campaign[] | null) ?? []
      setCampaign(
        list.find((c) => c.status === "production") ??
          list.find((c) => c.status === "distribution") ??
          list.find((c) => c.status === "closed") ??
          null
      )
      setLoading(false)
    }

    void fetchLatest()
    return () => {
      cancelled = true
    }
  }, [])

  return { campaign, loading }
}
