import * as React from "react"
import type { CartItemComposition, PempekType, Product } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const REQUIRED_PIECES = 10

interface MixCustomPickerProps {
  product: Product
  pempekTypes: PempekType[]
  loadingTypes: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (product: Product, compositions: CartItemComposition[], packQty: number) => void
}

interface PickerBodyProps {
  pempekTypes: PempekType[]
  loadingTypes: boolean
  quantities: Record<string, number>
  packQty: number
  totalPieces: number
  remaining: number
  isValid: boolean
  unitPrice: number
  totalPrice: number
  onTypeQty: (typeId: string, delta: number) => void
  onPackQty: (delta: number) => void
}

function PickerBody({
  pempekTypes,
  loadingTypes,
  quantities,
  packQty,
  totalPieces,
  remaining,
  isValid,
  unitPrice,
  totalPrice,
  onTypeQty,
  onPackQty,
}: PickerBodyProps) {
  return (
    <>
      {loadingTypes ? (
        <div className="space-y-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : pempekTypes.length === 0 ? (
        <p className="px-4 py-4 text-center text-sm text-muted-foreground">
          Tidak ada jenis pempek tersedia.
        </p>
      ) : (
        <div className="space-y-2 px-4">
          {pempekTypes.map((type) => {
            const qty = quantities[type.id] ?? 0
            return (
              <div
                key={type.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{type.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(type.price)} / pcs
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onTypeQty(type.id, -1)}
                    disabled={qty === 0}
                    aria-label={`Kurangi ${type.name}`}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onTypeQty(type.id, 1)}
                    disabled={remaining <= 0}
                    aria-label={`Tambah ${type.name}`}
                  >
                    +
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress indicator */}
      <div
        className={`mx-4 rounded-lg px-4 py-2.5 text-sm ${
          isValid
            ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isValid ? (
          <span className="font-medium">✓ Sempurna! {REQUIRED_PIECES} pcs terpilih</span>
        ) : remaining > 0 ? (
          <span>Tambahkan {remaining} pcs lagi</span>
        ) : (
          <span className="text-destructive">Terlalu banyak ({totalPieces} pcs)</span>
        )}
      </div>

      {/* Pack quantity + price */}
      {isValid && (
        <div className="mx-4 space-y-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Jumlah porsi</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPackQty(-1)}
                disabled={packQty <= 1}
              >
                −
              </Button>
              <span className="w-8 text-center text-sm font-medium">{packQty}</span>
              <Button variant="outline" size="icon-sm" onClick={() => onPackQty(1)}>
                +
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Harga per porsi</span>
            <span className="font-medium">{formatPrice(unitPrice)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>
      )}
    </>
  )
}

export function MixCustomPicker({
  product,
  pempekTypes,
  loadingTypes,
  open,
  onOpenChange,
  onConfirm,
}: MixCustomPickerProps) {
  const isMobile = useIsMobile()
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [packQty, setPackQty] = React.useState(1)

  React.useEffect(() => {
    if (open) {
      setQuantities({})
      setPackQty(1)
    }
  }, [open])

  function setTypeQty(typeId: string, delta: number) {
    setQuantities((prev) => {
      const current = prev[typeId] ?? 0
      const next = Math.max(0, current + delta)
      return { ...prev, [typeId]: next }
    })
  }

  const totalPieces = Object.values(quantities).reduce((sum, q) => sum + q, 0)
  const remaining = REQUIRED_PIECES - totalPieces
  const isValid = totalPieces === REQUIRED_PIECES

  const unitPrice = pempekTypes.reduce((sum, t) => sum + (quantities[t.id] ?? 0) * t.price, 0)
  const totalPrice = unitPrice * packQty

  const compositions: CartItemComposition[] = pempekTypes
    .filter((t) => (quantities[t.id] ?? 0) > 0)
    .map((t) => ({
      pempek_type_id: t.id,
      pempek_type_name: t.name,
      price_per_piece: t.price,
      quantity: quantities[t.id],
    }))

  function handleConfirm() {
    if (!isValid) return
    onConfirm(product, compositions, packQty)
    onOpenChange(false)
  }

  const bodyProps: PickerBodyProps = {
    pempekTypes,
    loadingTypes,
    quantities,
    packQty,
    totalPieces,
    remaining,
    isValid,
    unitPrice,
    totalPrice,
    onTypeQty: setTypeQty,
    onPackQty: (delta) => setPackQty((q) => Math.max(1, q + delta)),
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Pilih Isian — {product.name}</DrawerTitle>
            <p className="text-center text-sm text-muted-foreground">
              Pilih kombinasi pempek (total harus tepat {REQUIRED_PIECES} pcs)
            </p>
          </DrawerHeader>

          <div className="overflow-y-auto pb-2">
            <PickerBody {...bodyProps} />
          </div>

          <DrawerFooter>
            <Button onClick={handleConfirm} disabled={!isValid}>
              Tambah ke Keranjang
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pilih Isian — {product.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pilih kombinasi pempek (total harus tepat {REQUIRED_PIECES} pcs)
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <PickerBody {...bodyProps} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Tambah ke Keranjang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
