import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAdmin } from "@/context/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminLoginPage() {
  const { login, isAuthenticated } = useAdmin()
  const navigate = useNavigate()
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true })
    }
  }, [isAuthenticated, navigate])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const success = login(password)
    if (!success) {
      setError("Password salah. Silakan coba lagi.")
      setPassword("")
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                placeholder="Masukkan password"
                autoFocus
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
