import * as React from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAdmin } from "@/context/admin-context"
import { Navbar } from "@/components/layout/navbar"
import { CartBottomBar } from "@/components/layout/cart-bottom-bar"
import { Footer } from "@/components/layout/footer"
import { AdminLayout } from "@/components/admin/admin-layout"
import { HomePage } from "@/pages/home"
import { CartPage } from "@/pages/cart"
import { CheckoutPage } from "@/pages/checkout"
import { ConfirmationPage } from "@/pages/confirmation"
import { NotFoundPage } from "@/pages/not-found"
import { InvoicePage } from "@/pages/invoice"

function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <CartBottomBar />
    </div>
  )
}

function AdminGuard() {
  const { isAuthenticated } = useAdmin()
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin" replace />
}

const AdminLoginPage = React.lazy(() =>
  import("@/pages/admin/login").then((m) => ({ default: m.AdminLoginPage }))
)
const AdminDashboardPage = React.lazy(() =>
  import("@/pages/admin/dashboard").then((m) => ({ default: m.AdminDashboardPage }))
)
const AdminCampaignsPage = React.lazy(() =>
  import("@/pages/admin/campaigns").then((m) => ({ default: m.AdminCampaignsPage }))
)
const AdminPempekTypesPage = React.lazy(() =>
  import("@/pages/admin/pempek-types").then((m) => ({ default: m.AdminPempekTypesPage }))
)
const ProductionPlanPage = React.lazy(() =>
  import("@/pages/admin/production-plan").then((m) => ({ default: m.ProductionPlanPage }))
)
const AdminDeliveryTypesPage = React.lazy(() =>
  import("@/pages/admin/delivery-types").then((m) => ({ default: m.AdminDeliveryTypesPage }))
)

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
        <Route path="/invoice/:transactionId" element={<InvoicePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin login — no layout */}
      <Route path="/admin" element={<AdminLoginPage />} />

      {/* Protected admin routes */}
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/campaigns" element={<AdminCampaignsPage />} />
          <Route path="/admin/pempek-types" element={<AdminPempekTypesPage />} />
          <Route path="/admin/production-plan" element={<ProductionPlanPage />} />
          <Route path="/admin/delivery-types" element={<AdminDeliveryTypesPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <React.Suspense
        fallback={<div className="p-8 text-center text-sm text-muted-foreground">Memuat…</div>}
      >
        <AppRoutes />
      </React.Suspense>
    </BrowserRouter>
  )
}
