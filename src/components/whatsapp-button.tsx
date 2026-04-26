import type { OrderWithItems } from "@/types"
import { computeOrderItemUnitPrice } from "@/types"
import { Button } from "@/components/ui/button"
import { formatPrice, waLink } from "@/lib/utils"

interface WhatsAppButtonProps {
  order: OrderWithItems
  transactionId?: string | null
  className?: string
}

function buildWhatsAppMessage(
  order: OrderWithItems,
  transactionId?: string | null
): string {
  const shortId = order.id.slice(0, 8).toUpperCase()
  const itemLines = order.order_items
    .map(
      (item) =>
        `- ${item.product_name} x${item.quantity} = ${formatPrice(computeOrderItemUnitPrice(item) * item.quantity)}`
    )
    .join("\n")

  const invoiceLine = transactionId
    ? `\nLink Invoice: ${window.location.origin}/invoice/${transactionId}`
    : ""

  return [
    `Halo, saya ingin konfirmasi pesanan saya:`,
    ``,
    `Order ID: #${shortId}`,
    `Nama: ${order.customer_name}`,
    ``,
    `Pesanan:`,
    itemLines,
    ``,
    `Subtotal (belum ongkir): ${formatPrice(order.total_amount)}`,
    `Alamat: ${order.address}`,
    order.note ? `Catatan: ${order.note}` : "",
    invoiceLine,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
}

export function WhatsAppButton({ order, transactionId, className }: WhatsAppButtonProps) {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string

  function handleClick() {
    const message = buildWhatsAppMessage(order, transactionId)
    const url = waLink(waNumber, message)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Button onClick={handleClick} className={className} size="lg">
      Konfirmasi Pesanan via WhatsApp
    </Button>
  )
}
