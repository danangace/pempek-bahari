import * as React from "react"
import { useParams, useLocation, Link } from "react-router-dom"
import { useOrder } from "@/hooks/use-order"
import { WhatsAppButton } from "@/components/whatsapp-button"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatPrice, shortId } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { OrderStatus } from "@/types"
import { computeOrderItemUnitPrice } from "@/types"

export function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const { order, loading, error } = useOrder(orderId)

  // transactionId comes from navigation state; fallback-fetch if page was refreshed
  const [transactionId, setTransactionId] = React.useState<string | null>(
    (location.state as { transactionId?: string } | null)?.transactionId ?? null
  )

  React.useEffect(() => {
    if (transactionId || !orderId) return
    supabase
      .from("transactions")
      .select("id")
      .eq("order_id", orderId)
      .single()
      .then(({ data }) => {
        if (data) setTransactionId(data.id as string)
      })
  }, [orderId, transactionId])

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Pesanan tidak ditemukan.</p>
        <Button asChild className="mt-4">
          <Link to="/">Kembali ke Menu</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-3 text-xl font-semibold">Pesanan Berhasil!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order ID:{" "}
          <span className="font-mono font-medium text-foreground">
            #{shortId(order.id)}
          </span>
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Ringkasan Pesanan</CardTitle>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.product_name} ×{item.quantity}
              </span>
              <span>{formatPrice(computeOrderItemUnitPrice(item) * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            *Belum termasuk ongkos kirim
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail Pengiriman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Nama:</span>{" "}
            {order.customer_name}
          </p>
          <p>
            <span className="text-muted-foreground">WhatsApp:</span>{" "}
            {order.whatsapp_number}
          </p>
          <p>
            <span className="text-muted-foreground">Alamat:</span>{" "}
            {order.address}
          </p>
          {order.note && (
            <p>
              <span className="text-muted-foreground">Catatan:</span>{" "}
              {order.note}
            </p>
          )}
        </CardContent>
      </Card>

      <WhatsAppButton
        order={order}
        transactionId={transactionId}
        className="w-full"
      />

      {transactionId && (
        <Button variant="secondary" asChild className="mt-3 w-full">
          <Link to={`/invoice/${transactionId}`}>🧾 Lihat Invoice</Link>
        </Button>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Tombol di atas akan membuka WhatsApp untuk konfirmasi pesanan kamu. Admin
        akan mengirimkan invoice termasuk ongkos kirim setelah pesanan
        dikonfirmasi.
      </p>
    </main>
  )
}
