import * as React from "react"
import { Link } from "react-router-dom"
import { useOrders } from "@/hooks/use-orders"
import { useCampaigns } from "@/hooks/use-campaigns"
import { useBankAccounts } from "@/hooks/use-bank-accounts"
import { useDeliveryTypes } from "@/hooks/use-delivery-types"
import { useIsMobile } from "@/hooks/use-mobile"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { FilterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatPrice, shortId, waLink } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useProducts } from "@/hooks/use-products"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import type { BankAccount, Campaign, DeliveryTypeOption, OrderStatus, OrderWithItems, Product } from "@/types"
import { computeOrderItemUnitPrice, computeUnitPrice } from "@/types"
import { toast } from "sonner"

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Semua", value: "all" },
  { label: "Menunggu Diproses", value: "pending" },
  { label: "Sedang Diproses", value: "in_production" },
  { label: "Terkirim", value: "delivered" },
  { label: "Lunas", value: "paid" },
  { label: "Dibatalkan", value: "cancelled" },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "in_production",
  in_production: "delivered",
  delivered: "paid",
}

function buildAdminWhatsAppMessage(order: OrderWithItems): string {
  const bank = order.transactions?.bank_accounts

  const itemLines = order.order_items
    .map((item) => {
      const unitPrice = computeOrderItemUnitPrice(item)
      return `- ${item.product_name} x${item.quantity} = ${formatPrice(unitPrice * item.quantity)}`
    })
    .join("\n")

  const deliveryCost = order.transactions?.delivery_cost ?? null
  const discount = order.transactions?.discount ?? null
  const grandTotal = order.total_amount - (discount ?? 0) + (deliveryCost ?? 0)
  const transactionId = order.transactions?.id
  const invoiceLine = transactionId
    ? `${window.location.origin}/invoice/${transactionId}`
    : "-"

  const discountLine = discount != null && discount > 0
    ? [`*Diskon:* -${formatPrice(discount)}`]
    : []

  const bankLines = bank
    ? [
        `---`,
        `*Informasi Transfer:*`,
        `🏦 Bank: ${bank.bank_name}`,
        `💳 No. Rekening: ${bank.account_number}`,
        `👤 Atas Nama: ${bank.name}`,
        ``,
      ]
    : []

  return [
    `Halo, ${order.customer_name}! 👋`,
    `Berikut detail pesanan Anda:`,
    ``,
    `*Order ID:* #${order.id.slice(0, 8).toUpperCase()}`,
    `*Nama:* ${order.customer_name}`,
    ``,
    `*Pesanan:*`,
    itemLines,
    ``,
    `*Subtotal:* ${formatPrice(order.total_amount)}`,
    ...discountLine,
    `*Ongkir:* ${deliveryCost != null ? formatPrice(deliveryCost) : "belum ditentukan"}`,
    `*Total yang Harus Dibayar:* ${deliveryCost != null ? formatPrice(grandTotal) : "-"}`,
    ``,
    `*Link Invoice:* ${invoiceLine}`,
    ``,
    ...bankLines,
    `Terima kasih sudah memesan! 🙏`,
  ].join("\n")
}

function OngkirCell({
  order,
  onSave,
}: {
  order: OrderWithItems
  onSave: (cost: number | null) => Promise<void>
}) {
  const initial = order.transactions?.delivery_cost ?? null
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(initial !== null ? String(initial) : "")
  const [saving, setSaving] = React.useState(false)

  // Sync if prop changes (e.g. after refetch)
  React.useEffect(() => {
    setValue(initial !== null ? String(initial) : "")
  }, [initial])

  const isDirty = value !== (initial !== null ? String(initial) : "")

  async function handleSave() {
    setSaving(true)
    try {
      const cost = value === "" ? null : Number(value)
      await onSave(cost)
      toast.success("Ongkir disimpan")
      setEditing(false)
    } catch {
      toast.error("Gagal menyimpan ongkir")
    } finally {
      setSaving(false)
    }
  }

  if (initial !== null && !editing) {
    return <span className="text-sm">{formatPrice(initial)}</span>
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className="h-7 w-24 text-xs"
        autoFocus={editing}
      />
      {isDirty && (
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={saving} onClick={handleSave}>
          Simpan
        </Button>
      )}
      {editing && !isDirty && (
        <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">
          batal
        </button>
      )}
    </div>
  )
}

function DiscountCell({
  order,
  onSave,
}: {
  order: OrderWithItems
  onSave: (discount: number | null) => Promise<void>
}) {
  const initial = order.transactions?.discount ?? null
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(initial !== null ? String(initial) : "")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setValue(initial !== null ? String(initial) : "")
  }, [initial])

  const isDirty = value !== (initial !== null ? String(initial) : "")

  async function handleSave() {
    setSaving(true)
    try {
      const discount = value === "" ? null : Number(value)
      await onSave(discount)
      toast.success("Diskon disimpan")
      setEditing(false)
    } catch {
      toast.error("Gagal menyimpan diskon")
    } finally {
      setSaving(false)
    }
  }

  if (initial !== null && !editing) {
    return <span className="text-sm text-green-600 dark:text-green-400">−{formatPrice(initial)}</span>
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className="h-7 w-24 text-xs"
        autoFocus={editing}
      />
      {isDirty && (
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={saving} onClick={handleSave}>
          Simpan
        </Button>
      )}
      {editing && !isDirty && (
        <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">
          batal
        </button>
      )}
    </div>
  )
}

interface SpecialOrderItem {
  product: Product
  quantity: number
}

function BankAccountCell({
  order,
  bankAccounts,
  onSave,
}: {
  order: OrderWithItems
  bankAccounts: BankAccount[]
  onSave: (bankAccountId: string | null) => Promise<void>
}) {
  const current = order.transactions?.bank_account_id ?? ""

  if (order.transactions?.is_paid) {
    const bank = order.transactions?.bank_accounts
    if (bank) {
      return (
        <div className="text-xs leading-tight">
          <p className="font-medium">{bank.bank_name}</p>
          <p className="text-muted-foreground">{bank.account_number}</p>
        </div>
      )
    }
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <Select value={current} onValueChange={(val) => void onSave(val || null)}>
      <SelectTrigger className="h-7 w-[140px] text-xs">
        <SelectValue placeholder="Pilih rekening" />
      </SelectTrigger>
      <SelectContent>
        {bankAccounts.map((ba) => (
          <SelectItem key={ba.id} value={ba.id}>
            <span className="font-medium">{ba.bank_name}</span>{" "}
            <span className="text-muted-foreground">{ba.account_number}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DeliveryTypeCell({
  order,
  deliveryTypes,
  onSave,
}: {
  order: OrderWithItems
  deliveryTypes: DeliveryTypeOption[]
  onSave: (deliveryTypeId: string | null) => Promise<void>
}) {
  const current = order.transactions?.delivery_type_id ?? ""
  const [saving, setSaving] = React.useState(false)

  async function handleChange(val: string) {
    setSaving(true)
    try {
      await onSave(val || null)
    } catch {
      toast.error("Gagal menyimpan jenis pengiriman")
    } finally {
      setSaving(false)
    }
  }

  const activeTypes = deliveryTypes.filter((dt) => dt.is_active)
  const currentType = deliveryTypes.find((dt) => dt.id === current)
  const options = currentType && !currentType.is_active
    ? [currentType, ...activeTypes]
    : activeTypes

  return (
    <Select value={current} onValueChange={(val) => void handleChange(val)} disabled={saving}>
      <SelectTrigger className="h-7 w-[160px] text-xs">
        <SelectValue placeholder="Pilih jenis" />
      </SelectTrigger>
      <SelectContent>
        {options.map((dt) => (
          <SelectItem key={dt.id} value={dt.id}>
            {dt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function OrderItemsDialog({
  order,
  typeNames,
  onClose,
}: {
  order: OrderWithItems | null
  typeNames: Map<string, string>
  onClose: () => void
}) {
  return (
    <Dialog open={!!order} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Detail Item — #{order ? shortId(order.id) : ""}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {order?.customer_name}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          {order?.order_items.map((item) => {
            const compositions = item.order_item_compositions ?? []
            const unitPrice = computeOrderItemUnitPrice(item)
            return (
              <div key={item.id} className="rounded-lg border px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{item.product_name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </div>

                {compositions.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {compositions
                      .map((c) => `${typeNames.get(c.pempek_type_id) ?? c.pempek_type_id} ×${c.quantity}`)
                      .join("  ·  ")}
                  </p>
                )}

                <div className="mt-1.5 flex justify-end text-sm">
                  <span className="text-muted-foreground">
                    {formatPrice(unitPrice)} × {item.quantity}
                  </span>
                  <span className="ml-2 font-semibold">
                    = {formatPrice(unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total: </span>
          <strong>{formatPrice(order?.total_amount ?? 0)}</strong>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SpecialOrderDialog({
  open,
  onOpenChange,
  productionCampaigns,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  productionCampaigns: Campaign[]
  onSuccess: () => void
}) {
  const { products } = useProducts()
  const [campaignId, setCampaignId] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [whatsapp, setWhatsapp] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [note, setNote] = React.useState("")
  const [items, setItems] = React.useState<SpecialOrderItem[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open && productionCampaigns.length > 0) {
      setCampaignId(productionCampaigns[0].id)
    }
  }, [open, productionCampaigns])

  function reset() {
    setCustomerName("")
    setWhatsapp("")
    setAddress("")
    setNote("")
    setItems([])
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  function toggleItem(product: Product) {
    setItems((prev) => {
      const exists = prev.find((i) => i.product.id === product.id)
      if (exists) return prev.filter((i) => i.product.id !== product.id)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    )
  }

  const totalAmount = items.reduce(
    (sum, i) => sum + computeUnitPrice(i.product) * i.quantity,
    0
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error("Tambahkan minimal satu produk")
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc("create_order_with_items", {
        p_customer_name: customerName.trim(),
        p_whatsapp_number: whatsapp.trim(),
        p_address: address.trim(),
        p_note: note.trim() || null,
        p_total_amount: totalAmount,
        p_campaign_id: campaignId || null,
        p_items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          compositions: (i.product.compositions ?? []).map((c) => ({
            pempek_type_id: c.pempek_type_id,
            quantity: c.quantity,
            price_at_order: c.price,
          })),
        })),
      })
      if (error) throw new Error(error.message)
      toast.success("Order khusus berhasil ditambahkan")
      handleClose()
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Order Khusus</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Untuk pelanggan spesial yang memesan di luar periode open order.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {productionCampaigns.length > 1 && (
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productionCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="so-name">Nama Pelanggan</Label>
            <Input
              id="so-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-wa">Nomor WhatsApp</Label>
            <Input
              id="so-wa"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              type="tel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-addr">Alamat</Label>
            <Textarea
              id="so-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-note">
              Catatan <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Textarea
              id="so-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Produk</Label>
            <div className="divide-y rounded-md border">
              {products.map((p) => {
                const item = items.find((i) => i.product.id === p.id)
                return (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!item}
                      onChange={() => toggleItem(p)}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(computeUnitPrice(p))}
                    </span>
                    {item && (
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantity(p.id, Number(e.target.value))}
                        className="h-7 w-16 text-xs"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <strong>{formatPrice(totalAmount)}</strong>
              <span className="ml-1 text-xs text-muted-foreground">
                (belum termasuk ongkir)
              </span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Buat Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminDashboardPage() {
  const { orders, loading, error, updateStatus, markTransactionPaid, setDeliveryCost, setDiscount, setBankAccount, setDeliveryType, refetch } =
    useOrders()
  const { campaigns } = useCampaigns()
  const { bankAccounts } = useBankAccounts()
  const { deliveryTypes } = useDeliveryTypes()
  const { pempekTypes } = usePempekTypes(false)
  const typeNames = React.useMemo(
    () => new Map(pempekTypes.map((t) => [t.id, t.name])),
    [pempekTypes]
  )
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = React.useState("all")
  const [pendingTab, setPendingTab] = React.useState("all")
  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false)
  const [campaignFilter, setCampaignFilter] = React.useState("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = React.useState("all")
  const [pendingDeliveryType, setPendingDeliveryType] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [showSpecialOrderDialog, setShowSpecialOrderDialog] = React.useState(false)
  const [itemsDialogOrder, setItemsDialogOrder] = React.useState<OrderWithItems | null>(null)

  // production-stage campaigns available for special orders
  const productionCampaigns = campaigns.filter((c) => c.status === "production")

  const filtered = orders
    .filter((o) => activeTab === "all" || o.status === activeTab)
    .filter((o) => {
      if (campaignFilter === "all") return true
      if (campaignFilter === "none") return !o.campaign_id
      return o.campaign_id === campaignFilter
    })
    .filter((o) => {
      if (deliveryTypeFilter === "all") return true
      if (deliveryTypeFilter === "none") return !o.transactions?.delivery_type_id
      return o.transactions?.delivery_type_id === deliveryTypeFilter
    })
    .filter((o) => {
      if (!searchQuery.trim()) return true
      return o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    })

  function openFilterDrawer() {
    setPendingTab(activeTab)
    setPendingDeliveryType(deliveryTypeFilter)
    setFilterDrawerOpen(true)
  }

  function applyFilter() {
    setActiveTab(pendingTab)
    setDeliveryTypeFilter(pendingDeliveryType)
    setFilterDrawerOpen(false)
  }

  async function handleStatusChange(order: OrderWithItems, newStatus: string) {
    setUpdatingId(order.id)
    try {
      await updateStatus(order.id, newStatus as OrderStatus)
      // When order is marked paid, sync the transaction's is_paid flag too
      if (newStatus === "paid" && !order.transactions?.is_paid) {
        await markTransactionPaid(order.id)
      }
      toast.success(`Status pesanan #${shortId(order.id)} diperbarui`)
    } catch {
      toast.error("Gagal memperbarui status")
    } finally {
      setUpdatingId(null)
    }
  }

  
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} total pesanan
          </p>
        </div>
        {productionCampaigns.length > 0 && (
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
            onClick={() => setShowSpecialOrderDialog(true)}
          >
            + Tambah Order Khusus
          </Button>
        )}
      </div>

      {/* Search + Filter toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Cari nama pelanggan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          variant={activeTab !== "all" || deliveryTypeFilter !== "all" ? "default" : "outline"}
          size="icon"
          onClick={openFilterDrawer}
          title="Filter"
        >
          <HugeiconsIcon icon={FilterIcon} className="h-4 w-4" />
        </Button>
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

      {/* Active filter labels */}
      {(activeTab !== "all" || deliveryTypeFilter !== "all") && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Filter aktif:</span>
          {activeTab !== "all" && (
            <span className="font-medium">
              {STATUS_TABS.find((t) => t.value === activeTab)?.label}
            </span>
          )}
          {deliveryTypeFilter !== "all" && (
            <span className="font-medium">
              {deliveryTypeFilter === "none"
                ? "Belum Ditentukan"
                : (deliveryTypes.find((dt) => dt.id === deliveryTypeFilter)?.name ?? "")}
            </span>
          )}
          <button
            onClick={() => { setActiveTab("all"); setDeliveryTypeFilter("all") }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Hapus semua
          </button>
        </div>
      )}

      {/* Filter — drawer on mobile, dialog on desktop */}
      {isMobile ? (
        <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filter</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4 px-4 pb-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status Pesanan</Label>
                <Select value={pendingTab} onValueChange={setPendingTab}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TABS.map((tab) => (
                      <SelectItem key={tab.value} value={tab.value}>
                        {tab.label}
                        {tab.value !== "all" && (
                          <span className="ml-1 text-xs opacity-60">
                            ({orders.filter((o) => o.status === tab.value).length})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {deliveryTypes.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jenis Pengiriman</Label>
                  <Select value={pendingDeliveryType} onValueChange={setPendingDeliveryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengiriman</SelectItem>
                      <SelectItem value="none">Belum Ditentukan</SelectItem>
                      {deliveryTypes.map((dt) => (
                        <SelectItem key={dt.id} value={dt.id}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="px-4 pb-6 pt-3">
              <button
                onClick={applyFilter}
                className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Terapkan
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Filter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status Pesanan</Label>
                <Select value={pendingTab} onValueChange={setPendingTab}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TABS.map((tab) => (
                      <SelectItem key={tab.value} value={tab.value}>
                        {tab.label}
                        {tab.value !== "all" && (
                          <span className="ml-1 text-xs opacity-60">
                            ({orders.filter((o) => o.status === tab.value).length})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {deliveryTypes.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jenis Pengiriman</Label>
                  <Select value={pendingDeliveryType} onValueChange={setPendingDeliveryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengiriman</SelectItem>
                      <SelectItem value="none">Belum Ditentukan</SelectItem>
                      {deliveryTypes.map((dt) => (
                        <SelectItem key={dt.id} value={dt.id}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setFilterDrawerOpen(false)}>Batal</Button>
              <Button onClick={applyFilter}>Terapkan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {error && (
        <p className="mb-4 text-sm text-destructive">
          Gagal memuat pesanan: {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Tidak ada pesanan
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Ongkir</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead>Pengiriman</TableHead>
                <TableHead>Bayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const txn = order.transactions
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      #{shortId(order.id)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {txn ? (
                        <a
                          href={`/invoice/${txn.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Lihat Invoice
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {order.customer_name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={waLink(order.whatsapp_number, buildAdminWhatsAppMessage(order))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {order.whatsapp_number}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">
                      <button
                        className="text-primary underline-offset-2 hover:underline"
                        onClick={() => setItemsDialogOrder(order)}
                      >
                        {order.order_items.length} item
                      </button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <DiscountCell
                        order={order}
                        onSave={(discount) => setDiscount(order.id, discount)}
                      />
                    </TableCell>
                    <TableCell>
                      <OngkirCell
                        order={order}
                        onSave={(cost) => setDeliveryCost(order.id, cost)}
                      />
                    </TableCell>
                    <TableCell>
                      <BankAccountCell
                        order={order}
                        bankAccounts={bankAccounts}
                        onSave={(bankAccountId) => setBankAccount(order.id, bankAccountId)}
                      />
                    </TableCell>
                    <TableCell>
                      <DeliveryTypeCell
                        order={order}
                        deliveryTypes={deliveryTypes}
                        onSave={(deliveryTypeId) => setDeliveryType(order.id, deliveryTypeId)}
                      />
                    </TableCell>
                    <TableCell>
                      {txn?.is_paid && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                          Lunas
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {!txn?.is_paid && (
                        <Select
                          value={order.status}
                          onValueChange={(val) => handleStatusChange(order, val)}
                          disabled={updatingId === order.id || order.status === "cancelled"}
                        >
                          <SelectTrigger className="h-8 w-[160px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NEXT_STATUS[order.status as OrderStatus] && (
                              <SelectItem
                                value={NEXT_STATUS[order.status as OrderStatus]!}
                              >
                                ✓ Konfirmasi →{" "}
                                {NEXT_STATUS[order.status as OrderStatus]}
                              </SelectItem>
                            )}
                            <SelectItem value="cancelled">
                              ✗ Batalkan
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        )}
                        {txn?.is_paid && txn?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-[160px] text-xs"
                            asChild
                          >
                            <Link to={`/invoice/${txn.id}`} target="_blank">
                              🧾 Lihat Invoice
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SpecialOrderDialog
        open={showSpecialOrderDialog}
        onOpenChange={setShowSpecialOrderDialog}
        productionCampaigns={productionCampaigns}
        onSuccess={refetch}
      />

      <OrderItemsDialog
        order={itemsDialogOrder}
        typeNames={typeNames}
        onClose={() => setItemsDialogOrder(null)}
      />
    </main>
  )
}
