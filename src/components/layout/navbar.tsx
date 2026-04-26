import { Link } from "react-router-dom"
import { ShoppingCart02Icon, Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCart } from "@/context/cart-context"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/lib/storage"

export function Navbar() {
  const { totalItems } = useCart()
  const { theme, setTheme } = useTheme()

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={getImageUrl("logo.webp")}
            alt="Pempek Bahari"
            className="h-9 w-9 rounded-md object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = "none"
            }}
          />
          <span className="font-medium text-foreground">Pempek Bahari</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <HugeiconsIcon
              icon={theme === "dark" ? Sun01Icon : Moon01Icon}
              className="size-5"
            />
          </Button>

          <Link to="/cart" className="relative p-2">
            <HugeiconsIcon
              icon={ShoppingCart02Icon}
              className="size-6 text-foreground"
            />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {totalItems > 99 ? "99+" : totalItems}
              </Badge>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
