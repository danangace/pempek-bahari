import * as React from "react"
import { useDeliveryTypes } from "@/hooks/use-delivery-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import type { DeliveryTypeOption } from "@/types"

interface DeliveryTypeForm {
  name: string
}

export function AdminDeliveryTypesPage() {
  const { deliveryTypes, loading, createDeliveryType, updateDeliveryType } = useDeliveryTypes()
  const [showCreate, setShowCreate] = React.useState(false)
  const [editing, setEditing] = React.useState<DeliveryTypeOption | null>(null)
  const [form, setForm] = React.useState<DeliveryTypeForm>({ name: "" })
  const [submitting, setSubmitting] = React.useState(false)

  function openCreate() {
    setForm({ name: "" })
    setShowCreate(true)
  }

  function openEdit(dt: DeliveryTypeOption) {
    setEditing(dt)
    setForm({ name: dt.name })
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createDeliveryType(form.name)
      toast.success("Jenis pengiriman berhasil ditambahkan")
      setShowCreate(false)
    } catch {
      toast.error("Gagal menambahkan jenis pengiriman")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !form.name.trim()) return
    setSubmitting(true)
    try {
      await updateDeliveryType(editing.id, { name: form.name.trim() })
      toast.success("Jenis pengiriman berhasil diperbarui")
      setEditing(null)
    } catch {
      toast.error("Gagal memperbarui jenis pengiriman")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(dt: DeliveryTypeOption) {
    try {
      await updateDeliveryType(dt.id, { is_active: !dt.is_active })
      toast.success(dt.is_active ? "Dinonaktifkan" : "Diaktifkan")
    } catch {
      toast.error("Gagal mengubah status")
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Jenis Pengiriman</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar jenis pengiriman yang dapat dipilih per transaksi
          </p>
        </div>
        <Button onClick={openCreate}>+ Tambah</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : deliveryTypes.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Belum ada jenis pengiriman
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryTypes.map((dt) => (
                <TableRow key={dt.id}>
                  <TableCell className="font-medium">{dt.name}</TableCell>
                  <TableCell>
                    {dt.is_active ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(dt)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={dt.is_active ? "destructive" : "outline"}
                        onClick={() => void handleToggleActive(dt)}
                      >
                        {dt.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Jenis Pengiriman</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dt-name">Nama</Label>
              <Input
                id="dt-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="cth. GrabExpress"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting || !form.name.trim()}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) setEditing(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Jenis Pengiriman</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dt-edit-name">Nama</Label>
              <Input
                id="dt-edit-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting || !form.name.trim()}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
