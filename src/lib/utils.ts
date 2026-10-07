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
/**
 * Normalises an Indonesian mobile number to "62xxxxxxxxxx".
 * Accepts 08…, 628…, +628… with spaces or dashes. Returns null if the
 * format is not a plausible Indonesian mobile number.
 */
export function normalizeWhatsappNumber(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "")
  if (!/^\d+$/.test(digits)) return null
  const normalised = digits.startsWith("0") ? "62" + digits.slice(1) : digits
  return /^628\d{8,11}$/.test(normalised) ? normalised : null
}

export function waLink(phoneNumber: string, message?: string): string {
  const digits = phoneNumber.replace(/\D/g, "")
  const normalised = digits.startsWith("0")
    ? "62" + digits.slice(1)
    : digits
  const base = `https://wa.me/${normalised}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
