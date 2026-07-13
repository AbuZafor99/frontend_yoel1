import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Role, User } from '../types'

type AuthValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; googleLogin: (idToken: string, role: 'homeowner' | 'tradesperson') => Promise<void>; register: (body: Record<string, unknown>) => Promise<void>; logout: () => void; refresh: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('zentrofix_user') || 'null') } catch { return null } })
  const [loading, setLoading] = useState(true)
  useEffect(() => { if (!localStorage.getItem('zentrofix_access_token')) setLoading(false); else api.profile().then(saveUser).catch(() => logout()).finally(() => setLoading(false)) }, [])
  const saveUser = (next: User) => { setUser(next); localStorage.setItem('zentrofix_user', JSON.stringify(next)) }
  const login = async (email: string, password: string) => { const session = await api.login(email, password); localStorage.setItem('zentrofix_access_token', session.accessToken); if (session.refreshToken) localStorage.setItem('zentrofix_refresh_token', session.refreshToken); saveUser(session.user) }
  const googleLogin = async (idToken: string, role: 'homeowner' | 'tradesperson') => { const session = await api.googleLogin(idToken, role === 'homeowner' ? 'user' : 'tradesperson'); localStorage.setItem('zentrofix_access_token', session.accessToken); if (session.refreshToken) localStorage.setItem('zentrofix_refresh_token', session.refreshToken); saveUser(session.user) }
  const register = async (body: Record<string, unknown>) => { await api.register(body) }
  const logout = () => { window.google?.accounts.id.disableAutoSelect(); localStorage.removeItem('zentrofix_access_token'); localStorage.removeItem('zentrofix_refresh_token'); localStorage.removeItem('zentrofix_user'); setUser(null) }
  const refresh = async () => { if (localStorage.getItem('zentrofix_access_token')) saveUser(await api.profile()) }
  return <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refresh }}>{children}</AuthContext.Provider>
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context }
export const isHomeowner = (role?: Role) => role === 'homeowner' || role === 'user'
