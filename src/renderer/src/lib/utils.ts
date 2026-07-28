import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class lists, letting later classes win over conflicting earlier ones.
 * Standard shadcn/ui helper — used by every component under `components/ui/*`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Derives 1-2 letter avatar initials from a full name (e.g. "Nguyen Van A" -> "NA").
 * Falls back to "?" for an empty/undefined name. Shared by Header.tsx and admin-sidebar.tsx.
 */
export function getInitials(fullName?: string): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

/** Can this mime type be rendered inline via an iframe (no internet/converter needed)? */
export function isPreviewableMimeType(mimeType: string): boolean {
  return mimeType.includes('pdf') || mimeType.includes('text/plain')
}
