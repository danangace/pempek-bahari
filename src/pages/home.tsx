import * as React from "react"
import { useProducts } from "@/hooks/use-products"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import { useCart } from "@/context/cart-context"
import { useCampaignQuota } from "@/hooks/use-campaign-quota"
import { useActiveCampaign } from "@/hooks/use-active-campaign"
import { ProductCard } from "@/components/product-card"
import { MixCustomPicker } from "@/components/mix-custom-picker"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/storage"
import { Skeleton } from "@/components/ui/skeleton"
import type { CartItemComposition, Product } from "@/types"
import { Store01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

function ClosedShopPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <HugeiconsIcon icon={Store01Icon} className="mb-6 size-16 text-muted-foreground" />
      <h1 className="mb-3 text-2xl font-semibold">Pemesanan Belum Dibuka</h1>
      <p className="max-w-sm text-muted-foreground">
        Pemesanan masih belum dibuka, tetap pantau Social Media kami untuk
        informasi lebih lanjut.
      </p>
    </div>
  )
}

function Hero({ campaign }: { campaign: import("@/types").Campaign }) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  return (
    <section className="mb-12 grid items-center gap-6 md:grid-cols-2 md:gap-10">
      <div className="order-2 md:order-1">
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Pre-order dibuka
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Pempek ikan tenggiri fresh,{" "}
          <em className="font-semibold text-primary">Hand Made.</em>
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground text-pretty">
          {campaign.description ??
            "Bahan berkualitas, dipilih yang terbaik. Pilih paket yang sudah ada atau racik isian sesukamu."}
        </p>

        <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Periode pemesanan</dt>
            <dd className="font-medium">
              {fmt(campaign.purchase_start_date)} – {fmt(campaign.purchase_end_date)}
            </dd>
          </div>
          {campaign.start_delivery_date && (
            <div>
              <dt className="text-muted-foreground">Mulai pengiriman</dt>
              <dd className="font-medium">{fmt(campaign.start_delivery_date)}</dd>
            </div>
          )}
        </dl>

        <Button asChild size="lg" className="mt-6">
          <a href="#menu">Mulai pesan</a>
        </Button>
      </div>

      <div className="order-1 md:order-2">
        <img
          src={getImageUrl("mix.webp")}
          alt="Aneka pempek ikan tenggiri dengan kuah cuko"
          className="aspect-[4/3] w-full rounded-2xl object-cover md:aspect-square"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      </div>
    </section>
  )
}

export function HomePage() {
  const { products, loading: productsLoading, error } = useProducts()
  const { pempekTypes, loading: typesLoading } = usePempekTypes()
  const { campaign, loading: campaignLoading } = useActiveCampaign()
  const quota = useCampaignQuota(campaign)
  const { addItem } = useCart()
  const [pickerProduct, setPickerProduct] = React.useState<Product | null>(null)

  function handleAddToCart(product: Product) {
    addItem(product)
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  function handleCustomizeMix(product: Product) {
    setPickerProduct(product)
  }

  function handlePickerConfirm(
    product: Product,
    compositions: CartItemComposition[],
    packQty: number
  ) {
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
      <Hero campaign={campaign} />
      {quota.isFull && (
        <p className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Kuota produksi untuk sementara sudah penuh, sehingga belum bisa melakukan pembelian.
        </p>
      )}

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
          <div id="menu" className="scroll-mt-20" />
          {pempek.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Pempek</h2>
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
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Pelengkap</h2>
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
          onOpenChange={(v) => {
            if (!v) setPickerProduct(null)
          }}
          onConfirm={handlePickerConfirm}
        />
      )}
    </main>
  )
}
