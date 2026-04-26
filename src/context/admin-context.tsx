/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

interface AdminContextValue {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AdminContext = React.createContext<AdminContextValue | undefined>(
  undefined
)

const ADMIN_SESSION_KEY = "pempek_admin_auth"

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"
  })

  const login = React.useCallback((password: string): boolean => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string
    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true")
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = React.useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAuthenticated(false)
  }, [])

  const value = React.useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout]
  )

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  )
}

export function useAdmin(): AdminContextValue {
  const context = React.useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
