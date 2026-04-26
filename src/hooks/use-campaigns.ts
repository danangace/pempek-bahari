import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { Campaign, CampaignStatus } from "@/types"

interface CreateCampaignData {
  name: string
  description?: string | null
  purchase_start_date: string
  purchase_end_date: string
}

interface UpdateCampaignData {
  name?: string
  description?: string | null
  purchase_start_date?: string
  purchase_end_date?: string
  status?: CampaignStatus
}

interface UseCampaignsResult {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  refetch: () => void
  createCampaign: (data: CreateCampaignData) => Promise<Campaign>
  updateCampaign: (id: string, data: UpdateCampaignData) => Promise<void>
}

export function useCampaigns(): UseCampaignsResult {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function fetchCampaigns() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setCampaigns((data as Campaign[]) ?? [])
      }
      setLoading(false)
    }

    void fetchCampaigns()
    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  const createCampaign = React.useCallback(
    async (data: CreateCampaignData): Promise<Campaign> => {
      const { data: created, error: insertError } = await supabase
        .from("campaigns")
        .insert({ ...data, status: "draft" })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      const campaign = created as Campaign
      setCampaigns((prev) => [campaign, ...prev])
      return campaign
    },
    []
  )

  const updateCampaign = React.useCallback(
    async (id: string, data: UpdateCampaignData): Promise<void> => {
      // Guard: if activating this campaign, ensure no other is already open_order
      if (data.status === "open_order") {
        const existing = campaigns.find(
          (c) => c.status === "open_order" && c.id !== id
        )
        if (existing) {
          throw new Error(
            `Campaign "${existing.name}" masih berstatus Open Order. Tutup campaign tersebut terlebih dahulu sebelum membuka campaign baru.`
          )
        }
      }

      const { error: updateError } = await supabase
        .from("campaigns")
        .update(data)
        .eq("id", id)

      if (updateError) {
        // Surface the DB-level unique constraint error in a friendly way
        if (updateError.message.includes("campaigns_one_open_order")) {
          throw new Error(
            "Hanya boleh ada satu campaign yang berstatus Open Order. Tutup campaign yang sedang aktif terlebih dahulu."
          )
        }
        throw new Error(updateError.message)
      }

      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      )
    },
    [campaigns]
  )

  return { campaigns, loading, error, refetch, createCampaign, updateCampaign }
}
