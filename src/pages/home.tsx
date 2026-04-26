import * as React from "react"
import { useProducts } from "@/hooks/use-products"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import { useCart } from "@/context/cart-context"
import { useActiveCampaign } from "@/hooks/use-active-campaign"
import { ProductCard } from "@/components/product-card"
import { MixCustomPicker } from "@/components/mix-custom-picker"
import { Skeleton } from "@/components/ui/skeleton"
import type { CartItemComposition, Product } from "@/types"
import { toast } from "sonner"

function ClosedShopPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-7xl select-none">🛒</div>
      <h1 className="mb-3 text-2xl font-semibold">Pemesanan Belum Dibuka</h1>
      <p className="max-w-sm text-muted-foreground">
        Pemesanan masih belum dibuka, tetap pantau Social Media kami untuk
        informasi lebih lanjut.
      </p>
    </div>
  )
}

export function HomePage() {
  const { products, loading: productsLoading, error } = useProducts()
  const { pempekTypes, loading: typesLoading } = usePempekTypes()
  const { campaign, loading: campaignLoading } = useActiveCampaign()
  const { addItem } = useCart()
  const [pickerProduct, setPickerProduct] = React.useState<Product | null>(null)

  function handleAddToCart(product: Product) {
    addItem(product)
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  function handleCustomizeMix(product: Product) {
    setPickerProduct(product)
  }

  function handlePickerConfirm(product: Product, compositions: CartItemComposition[], packQty: number) {
    addItem(product, packQty, compositions)
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  if (campaignLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) {
    return <ClosedShopPage />
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">
          Gagal memuat menu. Silakan coba lagi.
        </p>
      </div>
    )
  }

  const pempek = products.filter((p) => p.category === "pempek")
  const pelengkap = products.filter((p) => p.category === "pelengkap")

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Menu Pempek</h1>
        <p className="mt-1 text-muted-foreground">
          Pempek segar khas Palembang, dibuat setiap hari
        </p>
      </div>

      {productsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {pempek.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-medium">Pempek</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {pempek.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onCustomizeMix={handleCustomizeMix}
                  />
                ))}
              </div>
            </section>
          )}

          {pelengkap.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-medium">Pelengkap</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {pelengkap.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onCustomizeMix={handleCustomizeMix}
                  />
                ))}
              </div>
            </section>
          )}

          {products.length === 0 && (
            <p className="text-center text-muted-foreground">
              Menu belum tersedia saat ini.
            </p>
          )}
        </>
      )}

      {pickerProduct && (
        <MixCustomPicker
          product={pickerProduct}
          pempekTypes={pempekTypes}
          loadingTypes={typesLoading}
          open={!!pickerProduct}
          onOpenChange={(v) => { if (!v) setPickerProduct(null) }}
          onConfirm={handlePickerConfirm}
        />
      )}
    </main>
  )
}
