import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { CartProvider } from "@/context/cart-context.tsx"
import { AdminProvider } from "@/context/admin-context.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <AdminProvider>
        <CartProvider>
          <App />
          <Toaster richColors position="top-center" duration={1000} />
        </CartProvider>
      </AdminProvider>
    </ThemeProvider>
  </StrictMode>
)
