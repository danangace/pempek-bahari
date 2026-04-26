import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase()
}

/** Normalises an Indonesian phone number and returns a wa.me URL.
 *  - Strips non-digit characters
 *  - Replaces a leading "0" with "62" (country code)
 *  - Numbers already starting with "62" are left as-is
 */
export function waLink(phoneNumber: string, message?: string): string {
  const digits = phoneNumber.replace(/\D/g, "")
  const normalised = digits.startsWith("0")
    ? "62" + digits.slice(1)
    : digits
  const base = `https://wa.me/${normalised}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
