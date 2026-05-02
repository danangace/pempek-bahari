import * as React from "react"
import { useOrders } from "@/hooks/use-orders"
import { useCampaigns } from "@/hooks/use-campaigns"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import { useProducts } from "@/hooks/use-products"
import { useIsMobile } from "@/hooks/use-mobile"
import { useProductionEntries } from "@/hooks/use-production-entries"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { OrderWithItems, PackagingEntry, PempekType, Product, ProductionEntry } from "@/types"

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

interface PempekAggregate {
  pempek_type_id: string
  pempek_type_name: string
  total_pieces: number
}

interface ProductBreakdown {
  product_id: string | null
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
  const map = new Map<string, ProductBreakdown>()

  for (const order of orders) {
    for (const item of order.order_items) {
      const existing = map.get(item.product_name)
      map.set(item.product_name, {
        product_name: item.product_name,
        product_id: item.product_id ?? existing?.product_id ?? null,
        total_packs: (existing?.total_packs ?? 0) + item.quantity,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_packs - a.total_packs)
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

// ---------------------------------------------------------------------------
// Sisa indicator cell
// ---------------------------------------------------------------------------

function SisaCell({ demand, done }: { demand: number; done: number }) {
  const sisa = demand - done
  if (sisa > 0) {
    return (
      <TableCell className="text-right font-semibold text-destructive">
        ⚠ {sisa}
      </TableCell>
    )
  }
  return (
    <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
      {sisa === 0 ? "✓ 0" : `+${Math.abs(sisa)}`}
    </TableCell>
  )
}

// ---------------------------------------------------------------------------
// Format date helper
// ---------------------------------------------------------------------------

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// DetailEntry (Mix Custom)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Add Production Entry Form
// ---------------------------------------------------------------------------

interface AddProductionFormProps {
  pempekTypes: PempekType[]
  onSubmit: (pempekTypeId: string, qty: number, note: string) => Promise<void>
  onClose: () => void
}

function AddProductionForm({ pempekTypes, onSubmit, onClose }: AddProductionFormProps) {
  const [pempekTypeId, setPempekTypeId] = React.useState("")
  const [qty, setQty] = React.useState("")
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pempekTypeId || !qty) return
    setSaving(true)
    try {
      await onSubmit(pempekTypeId, parseInt(qty, 10), note)
      toast.success("Produksi berhasil dicatat")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencatat produksi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="prod-type">Jenis Pempek</Label>
        <Select value={pempekTypeId} onValueChange={setPempekTypeId} required>
          <SelectTrigger id="prod-type">
            <SelectValue placeholder="Pilih jenis pempek..." />
          </SelectTrigger>
          <SelectContent>
            {pempekTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prod-qty">Jumlah (pcs)</Label>
        <Input
          id="prod-qty"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Contoh: 100"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prod-note">
          Catatan <span className="text-muted-foreground">(opsional)</span>
        </Label>
        <Textarea
          id="prod-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Misal: batch pagi jam 09.00"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving || !pempekTypeId || !qty}>
          {saving ? "Menyimpan..." : "Catat"}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Add Packaging Entry Form
// ---------------------------------------------------------------------------

interface AddPackagingFormProps {
  products: Product[]
  onSubmit: (productId: string, qty: number, note: string) => Promise<void>
  onClose: () => void
}

function AddPackagingForm({ products, onSubmit, onClose }: AddPackagingFormProps) {
  const [productId, setProductId] = React.useState("")
  const [qty, setQty] = React.useState("")
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const availableProducts = products.filter((p) => p.is_available)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !qty) return
    setSaving(true)
    try {
      await onSubmit(productId, parseInt(qty, 10), note)
      toast.success("Packaging berhasil dicatat")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencatat packaging")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="pack-product">Produk</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger id="pack-product">
            <SelectValue placeholder="Pilih produk..." />
          </SelectTrigger>
          <SelectContent>
            {availableProducts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pack-qty">Jumlah (pack)</Label>
        <Input
          id="pack-qty"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Contoh: 20"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pack-note">
          Catatan <span className="text-muted-foreground">(opsional)</span>
        </Label>
        <Textarea
          id="pack-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Misal: packaging sore jam 16.00"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving || !productId || !qty}>
          {saving ? "Menyimpan..." : "Catat"}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Log history section
// ---------------------------------------------------------------------------

interface LogHistoryProps {
  productionEntries: ProductionEntry[]
  packagingEntries: PackagingEntry[]
  typeNames: Map<string, string>
  productNames: Map<string, string>
}

function LogHistory({ productionEntries, packagingEntries, typeNames, productNames }: LogHistoryProps) {
  const [open, setOpen] = React.useState(false)
  const hasAny = productionEntries.length > 0 || packagingEntries.length > 0

  if (!hasAny) return null

  return (
    <div className="mt-6">
      <button
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Riwayat Produksi & Packaging</span>
        <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-4">
          {productionEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Log Produksi (pcs)
              </p>
              <div className="space-y-1.5">
                {productionEntries.map((e) => (
                  <div key={e.id} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {typeNames.get(e.pempek_type_id) ?? e.pempek_type_id}
                      </span>
                      <span className="font-semibold">{e.quantity_pcs} pcs</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(e.produced_at)}
                      {e.note && <> · {e.note}</>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {packagingEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Log Packaging (pack)
              </p>
              <div className="space-y-1.5">
                {packagingEntries.map((e) => (
                  <div key={e.id} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {productNames.get(e.product_id) ?? e.product_id}
                      </span>
                      <span className="font-semibold">{e.quantity_packs} pack</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(e.packaged_at)}
                      {e.note && <> · {e.note}</>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Responsive modal wrapper (dialog on desktop, drawer on mobile)
// ---------------------------------------------------------------------------

interface ModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  isMobile: boolean
  children: React.ReactNode
}

function ResponsiveModal({ open, onOpenChange, title, isMobile, children }: ModalProps) {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="hidden" />
        {children}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ProductionPlanPage() {
  const { orders, loading, error } = useOrders()
  const { campaigns, loading: campaignsLoading } = useCampaigns()
  const { pempekTypes, loading: typesLoading } = usePempekTypes(false)
  const { products } = useProducts()
  const isMobile = useIsMobile()
  const [mixCustomDialog, setMixCustomDialog] = React.useState<string | null>(null)
  const [campaignFilter, setCampaignFilter] = React.useState("all")
  const [showAddProduction, setShowAddProduction] = React.useState(false)
  const [showAddPackaging, setShowAddPackaging] = React.useState(false)

  const {
    productionEntries,
    packagingEntries,
    pempekTotals,
    productTotals,
    addProductionEntry,
    addPackagingEntry,
  } = useProductionEntries(campaignFilter)

  const typeNames = new Map(pempekTypes.map((t) => [t.id, t.name]))
  const productNamesMap = new Map(products.map((p) => [p.id, p.name]))
  const customMixNames = new Set(
    products.filter((p) => p.is_custom_mix).map((p) => p.name)
  )

  const isSpecificCampaign =
    campaignFilter !== "all" && campaignFilter !== "none"

  const activeOrders = orders
    .filter((o) => o.status === "pending" || o.status === "in_production")
    .filter((o) => {
      if (campaignFilter === "all") return true
      if (campaignFilter === "none") return !o.campaign_id
      return o.campaign_id === campaignFilter
    })

  const aggregate = aggregateByPempekType(activeOrders, typeNames)
  const byProduct = aggregateByProduct(activeOrders)
  const totalPieces = aggregate.reduce((sum, p) => sum + p.total_pieces, 0)

  const selectedCampaign = campaigns.find((c) => c.id === campaignFilter)
  const isLoading = loading || typesLoading || campaignsLoading

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Rencana Produksi</h1>
        <p className="text-sm text-muted-foreground">
          Berdasarkan pesanan berstatus <em>Menunggu Diproses</em> dan{" "}
          <em>Sedang Diproses</em>
        </p>
      </div>

      {/* Campaign filter */}
      {campaigns.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Campaign:</span>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Campaign</SelectItem>
              <SelectItem value="none">Tanpa Campaign</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCampaign && (
        <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Campaign: <span className="font-medium text-foreground">{selectedCampaign.name}</span>
        </div>
      )}

      {/* Action buttons — only when specific campaign is selected */}
      {isSpecificCampaign && (
        <div className="mb-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddProduction(true)}>
            + Catat Produksi
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAddPackaging(true)}>
            + Catat Packaging
          </Button>
        </div>
      )}

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

          {/* Pempek type table */}
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Jenis Pempek</TableHead>
                  <TableHead className="text-right">Kebutuhan (pcs)</TableHead>
                  {isSpecificCampaign && (
                    <>
                      <TableHead className="text-right">Diproduksi</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregate.map((row) => {
                  const produced = pempekTotals.get(row.pempek_type_id) ?? 0
                  return (
                    <TableRow key={row.pempek_type_id}>
                      <TableCell className="font-medium">
                        {row.pempek_type_name}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.total_pieces}
                      </TableCell>
                      {isSpecificCampaign && (
                        <>
                          <TableCell className="text-right">{produced}</TableCell>
                          <SisaCell demand={row.total_pieces} done={produced} />
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold">{totalPieces} pcs</TableCell>
                  {isSpecificCampaign && (
                    <>
                      <TableCell className="text-right font-semibold">
                        {Array.from(pempekTotals.values()).reduce((s, v) => s + v, 0)}
                      </TableCell>
                      <TableCell />
                    </>
                  )}
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
                  <TableHead className="text-right">Kebutuhan (pack)</TableHead>
                  {isSpecificCampaign && (
                    <>
                      <TableHead className="text-right">Dikemas</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.map((prod) => {
                  const isCustomMix = customMixNames.has(prod.product_name)
                  const packaged = prod.product_id
                    ? (productTotals.get(prod.product_id) ?? 0)
                    : 0
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
                      <TableCell className="text-right font-semibold">
                        {prod.total_packs}
                      </TableCell>
                      {isSpecificCampaign && (
                        <>
                          <TableCell className="text-right">{packaged}</TableCell>
                          <SisaCell demand={prod.total_packs} done={packaged} />
                        </>
                      )}
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
                  {isSpecificCampaign && (
                    <>
                      <TableCell className="text-right font-semibold">
                        {Array.from(productTotals.values()).reduce((s, v) => s + v, 0)}
                      </TableCell>
                      <TableCell />
                    </>
                  )}
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Data diperbarui setiap kali halaman dimuat.
          </p>

          {/* Log history — only when specific campaign */}
          {isSpecificCampaign && (
            <LogHistory
              productionEntries={productionEntries}
              packagingEntries={packagingEntries}
              typeNames={typeNames}
              productNames={productNamesMap}
            />
          )}
        </>
      )}

      {/* Mix Custom detail */}
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

      {/* Add Production modal */}
      <ResponsiveModal
        open={showAddProduction}
        onOpenChange={(v) => setShowAddProduction(v)}
        title="Catat Produksi Pempek"
        isMobile={isMobile}
      >
        <AddProductionForm
          pempekTypes={pempekTypes}
          onSubmit={(typeId, qty, note) =>
            addProductionEntry(campaignFilter, typeId, qty, note)
          }
          onClose={() => setShowAddProduction(false)}
        />
      </ResponsiveModal>

      {/* Add Packaging modal */}
      <ResponsiveModal
        open={showAddPackaging}
        onOpenChange={(v) => setShowAddPackaging(v)}
        title="Catat Packaging Produk"
        isMobile={isMobile}
      >
        <AddPackagingForm
          products={products}
          onSubmit={(productId, qty, note) =>
            addPackagingEntry(campaignFilter, productId, qty, note)
          }
          onClose={() => setShowAddPackaging(false)}
        />
      </ResponsiveModal>
    </main>
  )
}
