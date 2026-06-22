import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'

interface AdminUser {
  id: string
  email: string
  full_name: string
}

interface SuperAdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | null>(null)

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin]     = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('bmi_admin_token')
    if (!token) { setLoading(false); return }
    superAdminApi.get('/me')
      .then(r => setAdmin(r.data.data))
      .catch(() => localStorage.removeItem('bmi_admin_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const { data } = await superAdminApi.post('/login', { email, password })
    localStorage.setItem('bmi_admin_token', data.data.token)
    setAdmin(data.data.admin)
  }

  function logout() {
    localStorage.removeItem('bmi_admin_token')
    setAdmin(null)
  }

  return (
    <SuperAdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext)
  if (!ctx) throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider')
  return ctx
}
