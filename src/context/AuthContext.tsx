import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { showSnackbar } from '../components/FeedbackHost'
import type { Role, User } from '../types'

type AuthValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; googleLogin: (idToken: string, role: 'homeowner' | 'tradesperson') => Promise<void>; register: (body: Record<string, unknown>) => Promise<void>; logout: () => void; refresh: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)

// Minimum time the branded splash stays visible on startup so a fast token
// check doesn't produce a one-frame flash — mirrors the app's 2s splash delay,
// shortened for the web where a long hold feels sluggish.
const MIN_SPLASH_MS = 1100

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('zentrofix_user') || 'null') } catch { return null } })
  const [loading, setLoading] = useState(true)
  // Every callback below is memoized with a stable (empty-dependency)
  // identity. Consumers like GoogleSignInButton re-run their setup effect
  // whenever the function they're given changes identity — without this,
  // every AuthProvider re-render created new functions and re-initialized
  // the Google SDK, which is what produced the repeated "initialize()
  // called multiple times" warnings and the flaky Google sign-in.
  const saveUser = useCallback((next: User) => { setUser(next); localStorage.setItem('zentrofix_user', JSON.stringify(next)) }, [])
  const logout = useCallback(() => { window.google?.accounts.id.disableAutoSelect(); localStorage.removeItem('zentrofix_access_token'); localStorage.removeItem('zentrofix_refresh_token'); localStorage.removeItem('zentrofix_user'); setUser(null) }, [])
  const login = useCallback(async (email: string, password: string) => { const session = await api.login(email, password); localStorage.setItem('zentrofix_access_token', session.accessToken); if (session.refreshToken) localStorage.setItem('zentrofix_refresh_token', session.refreshToken); saveUser(session.user) }, [saveUser])
  const googleLogin = useCallback(async (idToken: string, role: 'homeowner' | 'tradesperson') => { const session = await api.googleLogin(idToken, role === 'homeowner' ? 'user' : 'tradesperson'); localStorage.setItem('zentrofix_access_token', session.accessToken); if (session.refreshToken) localStorage.setItem('zentrofix_refresh_token', session.refreshToken); saveUser(session.user) }, [saveUser])
  const register = useCallback(async (body: Record<string, unknown>) => { await api.register(body) }, [])
  const refresh = useCallback(async () => { if (localStorage.getItem('zentrofix_access_token')) saveUser(await api.profile()) }, [saveUser])
  useEffect(() => {
    const startedAt = Date.now()
    // Resolve the session, but never lift the splash before MIN_SPLASH_MS.
    const settle = (action?: () => void) => {
      const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt))
      window.setTimeout(() => { action?.(); setLoading(false) }, remaining)
    }
    if (!localStorage.getItem('zentrofix_access_token')) { settle(); return }
    // Silent so a dead token found on cold load doesn't fire a raw error
    // snackbar — it just quietly drops back to guest browsing, same as
    // anyone else with no session.
    api.profile(true)
      .then(profile => settle(() => saveUser(profile)))
      .catch(() => settle(() => logout()))
  }, [saveUser, logout])
  // Any API call that comes back 401 while we held a token announces this
  // event — sign out and fall back to guest browsing (Protected sends
  // unauthenticated visitors to the public home page, never a login wall),
  // with a snackbar explaining why they're back at the home screen.
  useEffect(() => {
    const expire = () => {
      if (!localStorage.getItem('zentrofix_access_token') && !localStorage.getItem('zentrofix_user')) return
      logout()
      showSnackbar('Your session has expired. Please sign in again.', 'info')
    }
    window.addEventListener('zentrofix:session-expired', expire)
    return () => window.removeEventListener('zentrofix:session-expired', expire)
  }, [logout])
  return <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refresh }}>{children}</AuthContext.Provider>
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
export const isHomeowner = (role?: Role) => role === 'homeowner' || role === 'user'
