import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { PackagingEntry, ProductionEntry } from "@/types"

interface UseProductionEntriesResult {
  productionEntries: ProductionEntry[]
  packagingEntries: PackagingEntry[]
  /** sum of quantity_pcs grouped by pempek_type_id */
  pempekTotals: Map<string, number>
  /** sum of quantity_packs grouped by product_id */
  productTotals: Map<string, number>
  loading: boolean
  error: string | null
  addProductionEntry: (
    campaignId: string,
    pempekTypeId: string,
    quantityPcs: number,
    note?: string
  ) => Promise<void>
  addPackagingEntry: (
    campaignId: string,
    productId: string,
    quantityPacks: number,
    note?: string
  ) => Promise<void>
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidCampaignId(id: string): boolean {
  return UUID_RE.test(id)
}

export function useProductionEntries(
  campaignId: string
): UseProductionEntriesResult {
  const [productionEntries, setProductionEntries] = React.useState<
    ProductionEntry[]
  >([])
  const [packagingEntries, setPackagingEntries] = React.useState<
    PackagingEntry[]
  >([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isValidCampaignId(campaignId)) return

    let cancelled = false

    async function fetchEntries() {
      setLoading(true)
      setError(null)

      const [prodResult, packResult] = await Promise.all([
        supabase
          .from("production_entries")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("produced_at", { ascending: false }),
        supabase
          .from("packaging_entries")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("packaged_at", { ascending: false }),
      ])

      if (cancelled) return

      if (prodResult.error) {
        setError(prodResult.error.message)
      } else if (packResult.error) {
        setError(packResult.error.message)
      } else {
        setProductionEntries((prodResult.data as ProductionEntry[]) ?? [])
        setPackagingEntries((packResult.data as PackagingEntry[]) ?? [])
      }
      setLoading(false)
    }

    void fetchEntries()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const isValid = isValidCampaignId(campaignId)

  const pempekTotals = React.useMemo(() => {
    if (!isValid) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const e of productionEntries) {
      map.set(e.pempek_type_id, (map.get(e.pempek_type_id) ?? 0) + e.quantity_pcs)
    }
    return map
  }, [isValid, productionEntries])

  const productTotals = React.useMemo(() => {
    if (!isValid) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const e of packagingEntries) {
      map.set(e.product_id, (map.get(e.product_id) ?? 0) + e.quantity_packs)
    }
    return map
  }, [isValid, packagingEntries])

  const addProductionEntry = React.useCallback(
    async (
      cId: string,
      pempekTypeId: string,
      quantityPcs: number,
      note?: string
    ) => {
      const { data, error: insertError } = await supabase
        .from("production_entries")
        .insert({
          campaign_id: cId,
          pempek_type_id: pempekTypeId,
          quantity_pcs: quantityPcs,
          note: note?.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setProductionEntries((prev) => [data as ProductionEntry, ...prev])
    },
    []
  )

  const addPackagingEntry = React.useCallback(
    async (
      cId: string,
      productId: string,
      quantityPacks: number,
      note?: string
    ) => {
      const { data, error: insertError } = await supabase
        .from("packaging_entries")
        .insert({
          campaign_id: cId,
          product_id: productId,
          quantity_packs: quantityPacks,
          note: note?.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setPackagingEntries((prev) => [data as PackagingEntry, ...prev])
    },
    []
  )

  return {
    productionEntries,
    packagingEntries,
    pempekTotals,
    productTotals,
    loading,
    error,
    addProductionEntry,
    addPackagingEntry,
  }
}
