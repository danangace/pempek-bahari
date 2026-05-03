import { useParams, Link } from "react-router-dom"
import { useInvoice } from "@/hooks/use-invoice"
import { getImageUrl } from "@/lib/storage"
import { formatPrice, shortId } from "@/lib/utils"
import { computeOrderItemUnitPrice } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function InvoicePage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const { invoice, loading, error } = useInvoice(transactionId)

  function handleCopyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link invoice berhasil disalin!")
    }).catch(() => {
      toast.error("Gagal menyalin link")
    })
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-3 h-24 w-full rounded-lg" />
        <Skeleton className="mb-3 h-40 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </main>
    )
  }

  if (error || !invoice) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Invoice tidak ditemukan.</p>
        <Button asChild className="mt-4">
          <Link to="/">Kembali ke Menu</Link>
        </Button>
      </main>
    )
  }

  const order = invoice.orders
  const subtotal = order.total_amount
  const deliveryCost = invoice.delivery_cost
  const discount = invoice.discount
  const cashAdvance = invoice.cash_advance
  const grandTotal = subtotal - (discount ?? 0) + (deliveryCost ?? 0)
  const remaining = cashAdvance != null && cashAdvance > 0 ? grandTotal - cashAdvance : null

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Invoice
          </p>
          <h1 className="text-xl font-bold">Pempek Bahari</h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">#{shortId(invoice.id)}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(invoice.created_at).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Customer info */}
      <div className="mb-4 rounded-lg border p-4 text-sm">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kepada
        </p>
        <p className="font-semibold">{order.customer_name}</p>
        <p className="text-muted-foreground">{order.whatsapp_number}</p>
        <p className="text-muted-foreground">{order.address}</p>
        {order.note && (
          <p className="mt-1 text-xs italic text-muted-foreground">
            Catatan: {order.note}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="mb-4 space-y-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img
              src={getImageUrl(item.products?.image_path)}
              alt={item.product_name}
              className="h-14 w-14 shrink-0 rounded-md bg-muted object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/placeholder-product.png"
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity}× {formatPrice(computeOrderItemUnitPrice(item))}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {formatPrice(computeOrderItemUnitPrice(item) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <Separator className="mb-4" />

      {/* Totals */}
      <div className="mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount != null && discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Diskon</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ongkos Kirim</span>
          {deliveryCost !== null ? (
            <span>{formatPrice(deliveryCost)}</span>
          ) : (
            <span className="italic text-muted-foreground text-xs">
              Belum ditentukan
            </span>
          )}
        </div>
        {invoice.delivery_types && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Jenis Pengiriman</span>
            <span>{invoice.delivery_types.name}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          {deliveryCost !== null ? (
            <span>{formatPrice(grandTotal)}</span>
          ) : (
            <span className="italic text-sm font-normal text-muted-foreground">
              Menyusul
            </span>
          )}
        </div>
        {remaining !== null && deliveryCost !== null && (
          <>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Pembayaran DP</span>
              <span>−{formatPrice(cashAdvance!)}</span>
            </div>
            <div className="flex justify-between font-semibold text-amber-600 dark:text-amber-400">
              <span>Sisa Pembayaran</span>
              <span>{formatPrice(remaining)}</span>
            </div>
          </>
        )}
      </div>

      {/* Bank transfer info — only show when unpaid and bank account is set */}
      {!invoice.is_paid && invoice.bank_accounts && (
        <div className="mb-4 rounded-lg border p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transfer ke Rekening
          </p>
          <p className="font-semibold">{invoice.bank_accounts.bank_name}</p>
          <p className="font-mono text-base font-bold tracking-wider">
            {invoice.bank_accounts.account_number}
          </p>
          <p className="text-muted-foreground">a.n. {invoice.bank_accounts.name}</p>
        </div>
      )}

      {/* Payment status */}
      <div
        className={`rounded-lg p-4 text-center ${
          invoice.is_paid
            ? "bg-green-50 dark:bg-green-950/40"
            : "bg-amber-50 dark:bg-amber-950/40"
        }`}
      >
        {invoice.is_paid ? (
          <>
            <Badge className="mb-1.5 bg-green-600 text-white hover:bg-green-600">
              ✓ LUNAS
            </Badge>
            {invoice.paid_at && (
              <p className="text-xs text-muted-foreground">
                Dibayar pada{" "}
                {new Date(invoice.paid_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </>
        ) : (
          <>
            <Badge
              variant="outline"
              className="mb-1.5 border-amber-500 text-amber-600 dark:text-amber-400"
            >
              ⏳ BELUM LUNAS
            </Badge>
            <p className="text-xs text-muted-foreground">
              Admin akan mengkonfirmasi setelah pembayaran diterima.
            </p>
          </>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        📌 Silahkan simpan URL halaman ini atau screenshot sebagai bukti pembayaran.
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={handleCopyUrl}
      >
        🔗 Salin Link Invoice
      </Button>

      <Button
        variant="ghost"
        className="mt-2 w-full"
        asChild
      >
        <Link to={`/confirmation/${order.id}`}>
          📋 Lihat Konfirmasi Pesanan
        </Link>
      </Button>
    </main>
  )
}
