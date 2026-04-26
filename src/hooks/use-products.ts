import * as React from "react"
import { supabase } from "@/lib/supabase"
import type { Product, ProductCompositionWithType } from "@/types"

/** Raw shape of a product_compositions row joined with pempek_types */
interface RawComposition {
  id: string
  pempek_type_id: string
  quantity: number
  pempek_types: {
    name: string
    price: number
  }
}

/** Raw shape returned by Supabase with the join */
interface RawProduct {
  id: string
  name: string
  description: string | null
  image_path: string | null
  category: string
  is_available: boolean
  is_custom_mix: boolean
  created_at: string
  product_compositions: RawComposition[]
}

function mapComposition(raw: RawComposition): ProductCompositionWithType {
  return {
    id: raw.id,
    pempek_type_id: raw.pempek_type_id,
    pempek_type_name: raw.pempek_types.name,
    price: raw.pempek_types.price,
    quantity: raw.quantity,
  }
}

function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    image_path: raw.image_path,
    category: raw.category,
    is_available: raw.is_available,
    is_custom_mix: raw.is_custom_mix,
    created_at: raw.created_at,
    compositions: raw.product_compositions.map(mapComposition),
  }
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*, product_compositions(id, pempek_type_id, quantity, pempek_types(name, price))")
        .eq("is_available", true)
        .order("category")
        .order("name")

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProducts((data as RawProduct[]).map(mapProduct))
      }
      setLoading(false)
    }

    void fetchProducts()
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}

