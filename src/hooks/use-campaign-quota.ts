import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { Campaign, CartItem } from "@/types"

interface UseCampaignQuotaResult {
  /** Packs of Paket Pempek already ordered (non-cancelled) in the campaign. */
  used: number
  loading: boolean
  /** True when the campaign has a quota and it is already reached. */
  isFull: boolean
  /** Packs left, or null when there is no quota. */
  remaining: number | null
  /** True when the given cart would push the campaign over its quota. */
  exceeds: (items: CartItem[]) => boolean
}

/** Packs in a cart that count toward the quota (main packs, not add-ons). */
export function countQuotaPacks(items: CartItem[]): number {
  return items
    .filter((i) => i.product.category === "pempek")
    .reduce((sum, i) => sum + i.quantity, 0)
}

export function useCampaignQuota(campaign: Campaign | null): UseCampaignQuotaResult {
  const [fetched, setFetched] = React.useState<{ key: string; used: number } | null>(null)
  const campaignId = campaign?.id
  const quota = campaign?.target_quota ?? null
  const key = `${campaignId}:${quota}`

  React.useEffect(() => {
    if (!campaignId || quota === null) return
    let cancelled = false

    async function fetchUsed() {
      const { data } = await supabase
        .from("order_items")
        .select(
          "quantity, products!inner(category), orders!inner(campaign_id, status)"
        )
        .eq("orders.campaign_id", campaignId)
        .neq("orders.status", "cancelled")
        .eq("products.category", "pempek")

      if (cancelled) return
      const rows = (data as { quantity: number }[] | null) ?? []
      setFetched({ key, used: rows.reduce((sum, r) => sum + r.quantity, 0) })
    }

    void fetchUsed()
    return () => {
      cancelled = true
    }
  }, [campaignId, quota, key])

  const used = fetched?.key === key ? fetched.used : 0
  const loading = quota !== null && fetched?.key !== key

  const remaining = quota === null ? null : Math.max(quota - used, 0)

  return {
    used,
    loading,
    isFull: quota !== null && used >= quota,
    remaining,
    exceeds: (items) => quota !== null && used + countQuotaPacks(items) > quota,
  }
}
