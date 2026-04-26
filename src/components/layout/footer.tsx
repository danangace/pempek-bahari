import { waLink } from "@/lib/utils"

export function Footer() {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string

  return (
    <footer className="mt-auto border-t border-border bg-background py-6">
      <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Pempek Bahari</p>
        {waNumber && (
          <a
            href={waLink(waNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block hover:text-foreground hover:underline"
          >
            Hubungi kami via WhatsApp
          </a>
        )}
        <p className="mt-2">
          &copy; {new Date().getFullYear()} Pempek Bahari. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
