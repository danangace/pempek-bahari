import type { Product } from "@/types"
import { computeUnitPrice } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { getImageUrl } from "@/lib/storage"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onCustomizeMix?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart, onCustomizeMix }: ProductCardProps) {
  const unitPrice = computeUnitPrice(product)

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={getImageUrl(product.image_path)}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E"
          }}
        />
      </div>
      <CardContent className="flex flex-1 flex-col px-3 py-4">
        <div className="mb-1 flex flex-col gap-1">
          <h3 className="leading-tight font-medium">{product.name}</h3>
          <Badge variant="secondary" className="w-fit text-xs capitalize">
            {product.category}
          </Badge>
        </div>
        {product.description && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex flex-col gap-2">
          {product.is_custom_mix ? (
            <span className="text-sm text-muted-foreground">Harga bervariasi</span>
          ) : (
            <span className="font-semibold text-primary">
              {formatPrice(unitPrice)}
            </span>
          )}
          {product.is_custom_mix ? (
            <Button
              size="sm"
              className="w-full rounded-lg"
              onClick={() => onCustomizeMix?.(product)}
              disabled={!onCustomizeMix}
            >
              ⚙ Pilih Isian
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full rounded-lg"
              onClick={() => onAddToCart(product)}
            >
              <HugeiconsIcon icon={ShoppingCart02Icon} className="size-4" />
              Tambah Keranjang
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
