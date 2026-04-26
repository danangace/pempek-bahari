import { Link, useNavigate } from "react-router-dom"
import { useCart } from "@/context/cart-context"
import { CartItemRow } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"

export function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-4xl">🛒</p>
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
            key={item.product.id}
            item={item}
            onRemove={removeItem}
            onUpdateQty={updateQty}
          />
        ))}
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold">{formatPrice(totalPrice)}</span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Ongkos kirim akan dikonfirmasi via WhatsApp
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" onClick={() => navigate("/checkout")}>
          Lanjut Checkout
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Lanjutkan Belanja</Link>
        </Button>
      </div>
    </main>
  )
}
