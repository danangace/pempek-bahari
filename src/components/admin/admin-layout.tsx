import { Outlet, NavLink, useNavigate } from "react-router-dom"
import {
  DashboardSquare01Icon,
  Calendar01Icon,
  NoodlesIcon,
  ClipboardIcon,
  DeliveryBox01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useAdmin } from "@/context/admin-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  { to: "/admin/campaigns", label: "Campaign", icon: Calendar01Icon },
  { to: "/admin/pempek-types", label: "Jenis Pempek", icon: NoodlesIcon },
  { to: "/admin/production-plan", label: "Produksi", icon: ClipboardIcon },
  { to: "/admin/delivery-types", label: "Jenis Pengiriman", icon: DeliveryBox01Icon },
]

export function AdminLayout() {
  const { logout } = useAdmin()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/admin")
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="font-semibold tracking-tight">Admin</span>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <HugeiconsIcon icon={item.icon} className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Keluar"
            className="text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Logout01Icon} className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Page content — extra bottom padding on mobile so content clears the tab bar */}
      <div className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium leading-tight transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <HugeiconsIcon icon={item.icon} className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
