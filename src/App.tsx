import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAdmin } from "@/context/admin-context"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { AdminLayout } from "@/components/admin/admin-layout"
import { HomePage } from "@/pages/home"
import { CartPage } from "@/pages/cart"
import { CheckoutPage } from "@/pages/checkout"
import { ConfirmationPage } from "@/pages/confirmation"
import { AdminLoginPage } from "@/pages/admin/login"
import { AdminDashboardPage } from "@/pages/admin/dashboard"
import { AdminCampaignsPage } from "@/pages/admin/campaigns"
import { AdminPempekTypesPage } from "@/pages/admin/pempek-types"
import { ProductionPlanPage } from "@/pages/admin/production-plan"
import { AdminDeliveryTypesPage } from "@/pages/admin/delivery-types"
import { InvoicePage } from "@/pages/invoice"

function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

function AdminGuard() {
  const { isAuthenticated } = useAdmin()
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin" replace />
}

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
      <AppRoutes />
    </BrowserRouter>
  )
}
