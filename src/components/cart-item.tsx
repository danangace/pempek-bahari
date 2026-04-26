import type { CartItem } from "@/types"
import { computeCartItemUnitPrice } from "@/types"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { getImageUrl } from "@/lib/storage"
import { cartItemKey } from "@/context/cart-context"

interface CartItemRowProps {
  item: CartItem
  onRemove: (productId: string, compositionKey?: string) => void
  onUpdateQty: (productId: string, quantity: number, compositionKey?: string) => void
}

export function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: CartItemRowProps) {
  const { product, quantity } = item
  const unitPrice = computeCartItemUnitPrice(item)
  const key = cartItemKey(item)
  const isCustomMix = product.is_custom_mix && !!item.custom_compositions

  return (
    <div className="flex gap-3 py-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        <img
          src={getImageUrl(product.image_path)}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f3f4f6'/%3E%3C/svg%3E"
          }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <button
            onClick={() => onRemove(product.id, isCustomMix ? key : undefined)}
            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
            aria-label={`Hapus ${product.name}`}
          >
            Hapus
          </button>
        </div>
        {isCustomMix && item.custom_compositions && (
          <p className="text-xs text-muted-foreground">
            {item.custom_compositions
              .filter((c) => c.quantity > 0)
              .map((c) => `${c.pempek_type_name} ×${c.quantity}`)
              .join(", ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatPrice(unitPrice)} / porsi
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onUpdateQty(product.id, quantity - 1, isCustomMix ? key : undefined)}
              aria-label="Kurang"
            >
              −
            </Button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onUpdateQty(product.id, quantity + 1, isCustomMix ? key : undefined)}
              aria-label="Tambah"
            >
              +
            </Button>
          </div>
          <span className="text-sm font-semibold">
            {formatPrice(unitPrice * quantity)}
          </span>
        </div>
      </div>
    </div>
  )
}
