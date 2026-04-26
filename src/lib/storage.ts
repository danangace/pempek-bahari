import { supabase } from "@/lib/supabase"

const bucket = import.meta.env.VITE_SUPABASE_BUCKET_NAME as string

export function getImageUrl(filePath: string | null | undefined): string {
  if (!filePath) return "/placeholder-product.png"
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
