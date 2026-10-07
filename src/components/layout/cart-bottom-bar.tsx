import { Link, useLocation } from "react-router-dom"
import { ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

/** Mobile-only sticky cart summary. Desktop uses the cart icon in the navbar. */
export function CartBottomBar() {
  const { totalItems, totalPrice } = useCart()
  const { pathname } = useLocation()

  if (totalItems === 0 || pathname === "/cart" || pathname === "/checkout") {
    return null
  }

  return (
    <>
      {/* Spacer so the fixed bar never covers the footer */}
      <div className="h-20 md:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-semibold">{formatPrice(totalPrice)}</p>
          </div>
          <Button asChild>
            <Link to="/cart">
              <HugeiconsIcon icon={ShoppingCart02Icon} className="size-4" />
              {totalItems} item
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
