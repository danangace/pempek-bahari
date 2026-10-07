import * as React from "react"
import { useCampaigns } from "@/hooks/use-campaigns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import type { Campaign, CampaignStatus } from "@/types"

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft:        { label: "Draft",        className: "bg-muted text-muted-foreground" },
  open_order:   { label: "Open Order",   className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  production:   { label: "Produksi",     className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  distribution: { label: "Distribusi",   className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  closed:       { label: "Ditutup",      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

// Forward-only status transitions
const NEXT_STATUS: Partial<Record<CampaignStatus, CampaignStatus>> = {
  draft:        "open_order",
  open_order:   "production",
  production:   "distribution",
  distribution: "closed",
}

const NEXT_STATUS_LABEL: Partial<Record<CampaignStatus, string>> = {
  draft:        "Buka Order",
  open_order:   "Mulai Produksi",
  production:   "Mulai Distribusi",
  distribution: "Tutup Campaign",
}

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`border-0 font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

function parseQuota(value: string | undefined): number | null {
  const n = parseInt(value ?? "", 10)
  return Number.isNaN(n) ? null : n
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

interface CreateFormData {
  name: string
  description: string
  purchase_start_date: string
  purchase_end_date: string
  start_delivery_date: string
  target_quota: string
}

export function AdminCampaignsPage() {
  const { campaigns, loading, error, createCampaign, updateCampaign, refetch } =
    useCampaigns()

  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [confirmLowerQuota, setConfirmLowerQuota] = React.useState<{ from: number; to: number } | null>(null)
  const [advancingId, setAdvancingId] = React.useState<string | null>(null)

  const [createForm, setCreateForm] = React.useState<CreateFormData>({
    name: "",
    description: "",
    purchase_start_date: "",
    purchase_end_date: "",
    start_delivery_date: "",
    target_quota: "",
  })

  const [editForm, setEditForm] = React.useState<Partial<CreateFormData>>({})

  function openEdit(campaign: Campaign) {
    setEditingCampaign(campaign)
    setEditForm({
      name: campaign.name,
      description: campaign.description ?? "",
      purchase_start_date: campaign.purchase_start_date,
      purchase_end_date: campaign.purchase_end_date,
      start_delivery_date: campaign.start_delivery_date ?? "",
      target_quota: campaign.target_quota?.toString() ?? "",
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createCampaign({
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        purchase_start_date: createForm.purchase_start_date,
        purchase_end_date: createForm.purchase_end_date,
        start_delivery_date: createForm.start_delivery_date || null,
        target_quota: parseQuota(createForm.target_quota),
      })
      toast.success("Campaign berhasil dibuat")
      setShowCreateDialog(false)
      setCreateForm({ name: "", description: "", purchase_start_date: "", purchase_end_date: "", start_delivery_date: "", target_quota: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat campaign")
    } finally {
      setSubmitting(false)
    }
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCampaign) return
    const oldQuota = editingCampaign.target_quota
    const newQuota = parseQuota(editForm.target_quota)
    if (oldQuota !== null && newQuota !== null && newQuota < oldQuota) {
      setConfirmLowerQuota({ from: oldQuota, to: newQuota })
      return
    }
    void saveEdit()
  }

  async function saveEdit() {
    if (!editingCampaign) return
    setSubmitting(true)
    try {
      await updateCampaign(editingCampaign.id, {
        name: editForm.name?.trim(),
        description: editForm.description?.trim() || null,
        purchase_start_date: editForm.purchase_start_date,
        purchase_end_date: editForm.purchase_end_date,
        start_delivery_date: editForm.start_delivery_date || null,
        target_quota: parseQuota(editForm.target_quota),
      })
      toast.success("Campaign berhasil diperbarui")
      setConfirmLowerQuota(null)
      setEditingCampaign(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui campaign")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdvanceStatus(campaign: Campaign) {
    const nextStatus = NEXT_STATUS[campaign.status]
    if (!nextStatus) return

    setAdvancingId(campaign.id)
    try {
      await updateCampaign(campaign.id, { status: nextStatus })
      toast.success(`Status campaign "${campaign.name}" diperbarui ke ${STATUS_CONFIG[nextStatus].label}`)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status campaign")
    } finally {
      setAdvancingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Manajemen Campaign</h1>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} campaign terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>+ Buat Campaign</Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">Gagal memuat campaign: {error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-3 text-muted-foreground">Belum ada campaign.</p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            Buat Campaign Pertama
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Campaign</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Mulai Order</TableHead>
                <TableHead>Tutup Order</TableHead>
                <TableHead>Mulai Pengiriman</TableHead>
                <TableHead>Target Kuota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="sticky right-0 bg-background">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {c.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(c.purchase_start_date)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(c.purchase_end_date)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {c.start_delivery_date ? formatDate(c.start_delivery_date) : "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {c.target_quota !== null ? `${c.target_quota} paket` : "Tanpa batas"}
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background">
                    <div className="flex gap-2">
                      {c.status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={advancingId === c.id}
                          onClick={() => handleAdvanceStatus(c)}
                        >
                          {NEXT_STATUS_LABEL[c.status] ?? "Lanjut"}
                        </Button>
                      )}
                      {(c.status === "draft" || c.status === "open_order") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Campaign Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nama Campaign</Label>
              <Input
                id="c-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Open Order Mei 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">
                Deskripsi <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Textarea
                id="c-desc"
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Informasi tambahan campaign ini"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="c-start">Tanggal Mulai Order</Label>
                <Input
                  id="c-start"
                  type="date"
                  value={createForm.purchase_start_date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, purchase_start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-end">Tutup Order</Label>
                <Input
                  id="c-end"
                  type="date"
                  value={createForm.purchase_end_date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, purchase_end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-delivery">
                Mulai Pengiriman <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="c-delivery"
                type="date"
                value={createForm.start_delivery_date}
                onChange={(e) => setCreateForm((p) => ({ ...p, start_delivery_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-quota">
                Target Kuota Paket Pempek <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="c-quota"
                type="number"
                min={0}
                value={createForm.target_quota ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, target_quota: e.target.value }))}
                placeholder="Kosongkan jika tanpa batas"
              />
              <p className="text-xs text-muted-foreground">
                Setelah kuota tercapai, pembeli tidak bisa memesan. Kuota masih bisa diubah selama campaign belum masuk Produksi.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Buat Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">Nama Campaign</Label>
              <Input
                id="e-name"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-desc">
                Deskripsi <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Textarea
                id="e-desc"
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="e-start">Tanggal Mulai Order</Label>
                <Input
                  id="e-start"
                  type="date"
                  value={editForm.purchase_start_date ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, purchase_start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-end">Tutup Order</Label>
                <Input
                  id="e-end"
                  type="date"
                  value={editForm.purchase_end_date ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, purchase_end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-delivery">
                Mulai Pengiriman <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="e-delivery"
                type="date"
                value={editForm.start_delivery_date ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, start_delivery_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-quota">
                Target Kuota Paket Pempek <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="e-quota"
                type="number"
                min={0}
                value={editForm.target_quota ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, target_quota: e.target.value }))}
                placeholder="Kosongkan jika tanpa batas"
              />
              <p className="text-xs text-muted-foreground">
                Setelah kuota tercapai, pembeli tidak bisa memesan. Kuota masih bisa diubah selama campaign belum masuk Produksi.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditingCampaign(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Confirm lowering quota */}
      <Dialog open={!!confirmLowerQuota} onOpenChange={(o) => !o && setConfirmLowerQuota(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kurangi target kuota?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Target kuota akan diturunkan dari <strong>{confirmLowerQuota?.from} paket</strong> menjadi{" "}
            <strong>{confirmLowerQuota?.to} paket</strong>. Apakah Anda yakin?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLowerQuota(null)}>
              Batal
            </Button>
            <Button disabled={submitting} onClick={() => void saveEdit()}>
              {submitting ? "Menyimpan..." : "Ya, Kurangi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
