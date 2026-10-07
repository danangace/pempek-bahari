import * as React from "react"
import type { Product } from "@/types"
import { computeUnitPrice } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingCart02Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { getImageUrl } from "@/lib/storage"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onCustomizeMix?: (product: Product) => void
}

const NO_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E"

export function ProductCard({ product, onAddToCart, onCustomizeMix }: ProductCardProps) {
  const unitPrice = computeUnitPrice(product)
  const [detailOpen, setDetailOpen] = React.useState(false)

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <button
        type="button"
        className="group relative aspect-square cursor-zoom-in overflow-hidden bg-muted"
        onClick={() => setDetailOpen(true)}
        aria-label={`Lihat gambar ${product.name}`}
      >
        <img
          src={getImageUrl(product.image_path)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = NO_IMAGE
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          Lihat Gambar
        </span>
      </button>
      <CardContent className="flex flex-1 flex-col px-3 py-4">
        <div className="mb-1 flex flex-col gap-1">
          <h3 className="leading-tight font-medium">{product.name}</h3>
        </div>
        {product.description && (
          <div className="mb-2">
            <p
              className="line-clamp-2 text-xs text-muted-foreground"
              title={product.description}
            >
              {product.description}
            </p>
            <button
              type="button"
              className="mt-0.5 text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => setDetailOpen(true)}
            >
              Lihat detail
            </button>
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2">
          {product.is_custom_mix ? (
            <span className="text-sm text-muted-foreground">Harga bervariasi</span>
          ) : (
            <span className="font-semibold text-primary tabular-nums">
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
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
              Pilih Isian
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detail {product.name}
            </DialogDescription>
          </DialogHeader>
          <img
            src={getImageUrl(product.image_path)}
            alt={product.name}
            className="w-full rounded-lg object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = NO_IMAGE
            }}
          />
          {product.description && (
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}
          {!product.is_custom_mix && (
            <p className="font-semibold text-primary tabular-nums">{formatPrice(unitPrice)}</p>
          )}
          {product.is_custom_mix ? (
            <Button
              className="w-full rounded-lg"
              disabled={!onCustomizeMix}
              onClick={() => {
                setDetailOpen(false)
                onCustomizeMix?.(product)
              }}
            >
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
              Pilih Isian
            </Button>
          ) : (
            <Button
              className="w-full rounded-lg"
              onClick={() => {
                onAddToCart(product)
                setDetailOpen(false)
              }}
            >
              <HugeiconsIcon icon={ShoppingCart02Icon} className="size-4" />
              Tambah Keranjang
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
