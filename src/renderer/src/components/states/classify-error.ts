export type ErrorStateVariant = 'offline' | 'generic'

/**
 * Classifies an unknown error into `offline` (network unreachable — no `response`
 * on an axios error, i.e. ECONNREFUSED/timeout on this LAN-only backend) vs
 * `generic` (server responded but with an error status, or a non-axios error).
 *
 * Kept as a standalone helper (not inside `error-state.tsx`) so that file only
 * exports the `ErrorState` component — required for Fast Refresh (`react-refresh/
 * only-export-components`) — while still being reused verbatim by Phase 03's admin
 * tables per the phase spec's "next to `ErrorState`" instruction.
 *
 * Never surfaces the raw error to the UI — callers only ever get back a variant
 * name, per the security note in the phase spec (no raw axios error objects /
 * stack traces / internal URLs shown to students).
 */
export const classifyError = (error: unknown): ErrorStateVariant => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as { response?: unknown }
    if (!axiosError.response) {
      return 'offline'
    }
  }
  return 'generic'
}
