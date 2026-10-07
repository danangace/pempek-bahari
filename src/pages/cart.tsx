import { Link, useNavigate } from "react-router-dom"
import { ShoppingBag02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useActiveCampaign } from "@/hooks/use-active-campaign"
import { useCampaignQuota } from "@/hooks/use-campaign-quota"
import { cartItemKey, useCart } from "@/context/cart-context"
import { CartItemRow } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"

export function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart()
  const navigate = useNavigate()
  const { campaign } = useActiveCampaign()
  const quota = useCampaignQuota(campaign)
  const overQuota = !quota.loading && quota.exceeds(items)

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <HugeiconsIcon icon={ShoppingBag02Icon} className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-medium">Keranjang kosong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tambahkan pempek favoritmu terlebih dahulu
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Lihat Menu</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Keranjang</h1>

      <div className="divide-y divide-border">
        {items.map((item) => (
          <CartItemRow
            key={cartItemKey(item)}
            item={item}
            onRemove={removeItem}
            onUpdateQty={updateQty}
          />
        ))}
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold tabular-nums">{formatPrice(totalPrice)}</span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Ongkos kirim akan dikonfirmasi via WhatsApp
      </p>

      {overQuota && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {quota.isFull
            ? "Mohon maaf, kuota produksi untuk sementara sudah penuh sehingga belum bisa melakukan pembelian. Silakan cek kembali nanti."
            : `Mohon maaf, sisa kuota produksi hanya ${quota.remaining} paket pempek. Kurangi jumlah paket di keranjang untuk melanjutkan.`}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" disabled={overQuota} onClick={() => navigate("/checkout")}>
          Lanjut Checkout
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Lanjutkan Belanja</Link>
        </Button>
      </div>
    </main>
  )
}
