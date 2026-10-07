import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Alamat yang kamu buka tidak ada atau sudah dipindahkan.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Kembali ke menu</Link>
      </Button>
    </main>
  )
}
