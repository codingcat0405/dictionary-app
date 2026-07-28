import { useSyncExternalStore } from 'react'
import { ACCESS_TOKEN_KEY } from '@renderer/constants'

export interface AuthUser {
  id?: number | string
  username?: string
  fullName?: string
  role?: string
  [key: string]: unknown
}

export interface AuthPayload {
  token: string
  user: AuthUser
}

const AUTH_CHANGED_EVENT = 'auth-changed'

/**
 * Safe parse of the stored auth payload. Malformed/absent values are treated as
 * logged-out instead of throwing — the previous unguarded `JSON.parse` in Header.tsx
 * and AdminPage.tsx could white-screen the app on a corrupted localStorage value.
 */
export const readAuth = (): AuthPayload | null => {
  const raw = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'user' in parsed) {
      return parsed as AuthPayload
    }
    return null
  } catch {
    return null
  }
}

/** Persists the auth payload and notifies all `useAuth()` subscribers synchronously. */
export const saveAuth = (payload: AuthPayload): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

/** Clears the auth payload and notifies all `useAuth()` subscribers synchronously. */
export const clearAuth = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

const subscribe = (callback: () => void): (() => void) => {
  window.addEventListener(AUTH_CHANGED_EVENT, callback)
  window.addEventListener('storage', callback) // cross-tab/window sync, cheap to include
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

// useSyncExternalStore requires a referentially-stable snapshot when nothing changed;
// cache the parsed result keyed off the raw string so repeated renders don't re-parse
// or return a new object identity when the underlying value hasn't actually changed.
let cachedRaw: string | null = null
let cachedAuth: AuthPayload | null = null
const getSnapshot = (): AuthPayload | null => {
  const raw = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedAuth = readAuth()
  }
  return cachedAuth
}

export interface UseAuthResult {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  logout: () => void
}

/**
 * Synchronous auth read via `useSyncExternalStore` — route guards can check
 * `isAdmin` during render (no `useEffect` delay), which avoids the admin-panel
 * flash-then-redirect bug. Re-renders automatically on login/logout/cross-tab change.
 */
export const useAuth = (): UseAuthResult => {
  const auth = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    user: auth?.user ?? null,
    isAuthenticated: !!auth,
    isAdmin: auth?.user?.role === 'admin',
    logout: clearAuth
  }
}
