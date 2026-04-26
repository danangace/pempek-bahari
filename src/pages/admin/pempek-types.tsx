import * as React from "react"
import { usePempekTypes } from "@/hooks/use-pempek-types"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
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
import type { PempekType } from "@/types"

interface TypeForm {
  name: string
  price: string
}

export function AdminPempekTypesPage() {
  const { pempekTypes, loading, error, refetch } = usePempekTypes(false)
  const [showCreate, setShowCreate] = React.useState(false)
  const [editing, setEditing] = React.useState<PempekType | null>(null)
  const [form, setForm] = React.useState<TypeForm>({ name: "", price: "" })
  const [submitting, setSubmitting] = React.useState(false)

  function openCreate() {
    setForm({ name: "", price: "" })
    setShowCreate(true)
  }

  function openEdit(type: PempekType) {
    setEditing(type)
    setForm({ name: type.name, price: String(type.price) })
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error: err } = await supabase.from("pempek_types").insert({
        name: form.name.trim(),
        price: Number(form.price),
      })
      if (err) throw new Error(err.message)
      toast.success(`${form.name} berhasil ditambahkan`)
      setShowCreate(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSubmitting(true)
    try {
      const { error: err } = await supabase
        .from("pempek_types")
        .update({ name: form.name.trim(), price: Number(form.price) })
        .eq("id", editing.id)
      if (err) throw new Error(err.message)
      toast.success(`${form.name} diperbarui`)
      setEditing(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(type: PempekType) {
    const next = type.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    const { error: err } = await supabase
      .from("pempek_types")
      .update({ status: next })
      .eq("id", type.id)
    if (err) {
      toast.error("Gagal mengubah status")
    } else {
      toast.success(`${type.name} ${next === "ACTIVE" ? "diaktifkan" : "dinonaktifkan"}`)
      refetch()
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Jenis Pempek</h1>
          <p className="text-sm text-muted-foreground">
            Kelola harga dan jenis pempek
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}>+ Tambah</Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">Gagal memuat: {error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Harga / pcs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pempekTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Belum ada jenis pempek. Tambahkan yang pertama!
                  </TableCell>
                </TableRow>
              ) : (
                pempekTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{formatPrice(type.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          type.status === "ACTIVE"
                            ? "border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "border-0 bg-muted text-muted-foreground"
                        }
                      >
                        {type.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openEdit(type)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => void toggleStatus(type)}
                        >
                          {type.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jenis Pempek</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nama</Label>
              <Input
                id="c-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="cth. Lenjer, Adaan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-price">Harga per pcs (Rp)</Label>
              <Input
                id="c-price"
                name="price"
                type="number"
                min={0}
                value={form.price}
                onChange={handleFormChange}
                placeholder="5000"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jenis Pempek</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">Nama</Label>
              <Input
                id="e-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-price">Harga per pcs (Rp)</Label>
              <Input
                id="e-price"
                name="price"
                type="number"
                min={0}
                value={form.price}
                onChange={handleFormChange}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
