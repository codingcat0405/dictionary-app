/**
 * Single source of truth for reading the LAN backend URL configured in the Footer's
 * server IP dialog, and for turning a backend-relative path into a fully-qualified URL.
 *
 * Replaces 7 duplicated `localStorage.getItem('backendUrl') || 'http://localhost:3000'`
 * blocks that were copy-pasted with slightly different shapes across the app.
 */

export const DEFAULT_BACKEND_URL = 'http://localhost:3000'

/**
 * Raw stored value, or `null` if the user has never configured a server IP.
 * Used where "unset" and "using the default" must be told apart (e.g. the Footer's
 * server-config dialog, which shows "Not configured" instead of the localhost default).
 */
export const getStoredBackendUrl = (): string | null => {
  return localStorage.getItem('backendUrl')
}

/** Reads the configured backend base URL (no trailing `/api`), falling back to localhost. */
export const getBackendBaseUrl = (): string => {
  return getStoredBackendUrl() || DEFAULT_BACKEND_URL
}

/**
 * Resolves a backend asset path (e.g. an uploaded image/audio/document URL) to a
 * fully-qualified URL. Passes absolute URLs (already starting with `http`) through
 * unchanged — some records store a full URL rather than a backend-relative path.
 */
export const resolveAssetUrl = (path?: string | null): string => {
  if (!path) return ''
  if (path.startsWith('http')) {
    return path
  }
  const backendUrl = getBackendBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${backendUrl}${normalizedPath}`
}
