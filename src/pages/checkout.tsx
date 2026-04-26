import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/context/cart-context"
import { useActiveCampaign } from "@/hooks/use-active-campaign"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { CheckoutFormData } from "@/types"
import { computeCartItemUnitPrice } from "@/types"

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const { campaign, loading: campaignLoading } = useActiveCampaign()
  const [loading, setLoading] = React.useState(false)
  const submittedRef = React.useRef(false)

  const [form, setForm] = React.useState<CheckoutFormData>({
    customer_name: "",
    whatsapp_number: "",
    address: "",
    note: "",
  })

  // Redirect to home if cart is empty — but NOT after a successful submit
  React.useEffect(() => {
    if (items.length === 0 && !submittedRef.current) navigate("/")
  }, [items.length, navigate])

  if (items.length === 0 && !submittedRef.current) return null

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!campaign) {
      toast.error("Pemesanan sedang tidak dibuka. Silakan cek kembali nanti.")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.rpc("create_order_with_items", {
        p_customer_name: form.customer_name.trim(),
        p_whatsapp_number: form.whatsapp_number.trim(),
        p_address: form.address.trim(),
        p_note: form.note.trim() || null,
        p_total_amount: totalPrice,
        p_campaign_id: campaign.id,
        p_items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          compositions: item.custom_compositions
            ? item.custom_compositions.map((c) => ({
                pempek_type_id: c.pempek_type_id,
                quantity: c.quantity,
                price_at_order: c.price_per_piece,
              }))
            : (item.product.compositions ?? []).map((c) => ({
                pempek_type_id: c.pempek_type_id,
                quantity: c.quantity,
                price_at_order: c.price,
              })),
        })),
      })

      if (error || !data) {
        throw new Error(error?.message ?? "Gagal membuat pesanan")
      }

      const { order_id, transaction_id } = data as {
        order_id: string
        transaction_id: string
      }

      submittedRef.current = true
      clearCart()
      navigate(`/confirmation/${order_id}`, {
        state: { transactionId: transaction_id },
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nama Lengkap</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">Nomor WhatsApp</Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              value={form.whatsapp_number}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              type="tel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              Catatan <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Textarea
              id="note"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Contoh: tanpa pedas, kirim sore"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || campaignLoading || !campaign}
          >
            {loading ? "Memproses..." : "Pesan Sekarang"}
          </Button>
        </form>

        {/* Order summary sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.product.name} ×{item.quantity}
                  </span>
                  <span>{formatPrice(computeCartItemUnitPrice(item) * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                *Belum termasuk ongkos kirim
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
