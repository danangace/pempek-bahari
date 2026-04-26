import * as React from "react"
import { useOrders } from "@/hooks/use-orders"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import { useProducts } from "@/hooks/use-products"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { OrderWithItems } from "@/types"

interface PempekAggregate {
  pempek_type_id: string
  pempek_type_name: string
  total_pieces: number
}

interface ProductBreakdown {
  product_name: string
  total_packs: number
}

function aggregateByPempekType(
  orders: OrderWithItems[],
  typeNames: Map<string, string>
): PempekAggregate[] {
  const map = new Map<string, number>()

  for (const order of orders) {
    for (const item of order.order_items) {
      for (const comp of item.order_item_compositions ?? []) {
        const current = map.get(comp.pempek_type_id) ?? 0
        map.set(comp.pempek_type_id, current + comp.quantity * item.quantity)
      }
    }
  }

  return Array.from(map.entries())
    .map(([pempek_type_id, total_pieces]) => ({
      pempek_type_id,
      pempek_type_name: typeNames.get(pempek_type_id) ?? pempek_type_id,
      total_pieces,
    }))
    .sort((a, b) => b.total_pieces - a.total_pieces)
}

function aggregateByProduct(orders: OrderWithItems[]): ProductBreakdown[] {
  const map = new Map<string, number>()

  for (const order of orders) {
    for (const item of order.order_items) {
      map.set(item.product_name, (map.get(item.product_name) ?? 0) + item.quantity)
    }
  }

  return Array.from(map.entries())
    .map(([product_name, total_packs]) => ({ product_name, total_packs }))
    .sort((a, b) => b.total_packs - a.total_packs)
}

interface MixCustomEntry {
  order_id: string
  customer_name: string
  quantity: number
  compositions: { type_name: string; pieces: number }[]
}

function getMixCustomEntries(
  orders: OrderWithItems[],
  productName: string,
  typeNames: Map<string, string>
): MixCustomEntry[] {
  const entries: MixCustomEntry[] = []
  for (const order of orders) {
    for (const item of order.order_items) {
      if (item.product_name !== productName) continue
      entries.push({
        order_id: order.id,
        customer_name: order.customer_name,
        quantity: item.quantity,
        compositions: (item.order_item_compositions ?? [])
          .map((c) => ({
            type_name: typeNames.get(c.pempek_type_id) ?? c.pempek_type_id,
            pieces: c.quantity,
          }))
          .sort((a, b) => b.pieces - a.pieces),
      })
    }
  }
  return entries
}

function DetailEntry({ entry }: { entry: MixCustomEntry }) {
  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{entry.customer_name}</span>
        <span className="text-xs text-muted-foreground">{entry.quantity} pack</span>
      </div>
      {entry.compositions.length > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {entry.compositions.map((c) => `${c.type_name} x${c.pieces}`).join(", ")}
        </p>
      )}
    </div>
  )
}

export function ProductionPlanPage() {
  const { orders, loading, error } = useOrders()
  const { pempekTypes, loading: typesLoading } = usePempekTypes(false)
  const { products } = useProducts()
  const isMobile = useIsMobile()
  const [mixCustomDialog, setMixCustomDialog] = React.useState<string | null>(null)

  const typeNames = new Map(pempekTypes.map((t) => [t.id, t.name]))
  const customMixNames = new Set(
    products.filter((p) => p.is_custom_mix).map((p) => p.name)
  )

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "in_production"
  )
  const aggregate = aggregateByPempekType(activeOrders, typeNames)
  const byProduct = aggregateByProduct(activeOrders)
  const totalPieces = aggregate.reduce((sum, p) => sum + p.total_pieces, 0)

  const isLoading = loading || typesLoading

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Rencana Produksi</h1>
        <p className="text-sm text-muted-foreground">
          Berdasarkan pesanan berstatus <em>Menunggu Diproses</em> dan{" "}
          <em>Sedang Diproses</em>
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">
          Gagal memuat data: {error}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : aggregate.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-3 text-muted-foreground">
            Tidak ada pesanan aktif saat ini.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-lg bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">Total pesanan aktif:</span>{" "}
            <strong>{activeOrders.length} pesanan</strong>
            {" · "}
            <strong>{totalPieces} pcs total</strong>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Jenis Pempek</TableHead>
                  <TableHead className="text-right">Jumlah (pcs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregate.map((row) => (
                  <TableRow key={row.pempek_type_id}>
                    <TableCell className="font-medium">
                      {row.pempek_type_name}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.total_pieces}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{totalPieces} pcs</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Per-product breakdown */}
          <h2 className="mt-6 text-base font-semibold">Rincian per Produk</h2>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Jenis Produk</TableHead>
                  <TableHead className="text-right">Jumlah (pack)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.map((prod) => {
                  const isCustomMix = customMixNames.has(prod.product_name)
                  return (
                    <TableRow key={prod.product_name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {prod.product_name}
                          {isCustomMix && (
                            <button
                              className="text-xs text-primary underline-offset-2 hover:underline"
                              onClick={() => setMixCustomDialog(prod.product_name)}
                            >
                              Lihat Detail
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{prod.total_packs}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">
                    {byProduct.reduce((sum, p) => sum + p.total_packs, 0)} pack
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Data diperbarui setiap kali halaman dimuat.
          </p>
        </>
      )}

      {/* Mix Custom detail — drawer on mobile, dialog on desktop */}
      {isMobile ? (
        <Drawer open={!!mixCustomDialog} onOpenChange={(v) => { if (!v) setMixCustomDialog(null) }}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Detail {mixCustomDialog}</DrawerTitle>
              <p className="text-center text-sm text-muted-foreground">
                Rincian isian per pesanan dari order aktif
              </p>
            </DrawerHeader>
            <div className="space-y-2 overflow-y-auto px-4 pb-6">
              {mixCustomDialog &&
                getMixCustomEntries(activeOrders, mixCustomDialog, typeNames).map((entry, i) => (
                  <DetailEntry key={`${entry.order_id}-${i}`} entry={entry} />
                ))}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!mixCustomDialog} onOpenChange={(v) => { if (!v) setMixCustomDialog(null) }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detail {mixCustomDialog}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Rincian isian per pesanan dari order aktif
              </p>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {mixCustomDialog &&
                getMixCustomEntries(activeOrders, mixCustomDialog, typeNames).map((entry, i) => (
                  <DetailEntry key={`${entry.order_id}-${i}`} entry={entry} />
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}
