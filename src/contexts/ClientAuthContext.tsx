import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { clientApi } from '@/lib/clientApi'

interface ClientUser {
  id: string
  email: string
  full_name: string
  role: string
  tenant_id: string
  tenant_name: string
  logo_url: string | null
  avatar_url: string | null
}

interface ClientTenant {
  id: string
  company_name: string
  logo_url: string | null
  onboarding_completed: boolean
  industry: string | null
  subscription_status: string
}

interface ClientAuthContextType {
  client: ClientUser | null
  tenant: ClientTenant | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ onboarding_completed: boolean }>
  logout: () => void
  updateTenant: (patch: Partial<ClientTenant>) => void
  updateClient: (patch: Partial<ClientUser>) => void
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null)

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient]   = useState<ClientUser | null>(null)
  const [tenant, setTenant]   = useState<ClientTenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('bmi_client_token')
    if (!token) { setLoading(false); return }
    clientApi.get('/me')
      .then(r => {
        const d = r.data.data
        setClient({
          id: d.id, email: d.email, full_name: d.full_name, role: d.role,
          tenant_id: d.tenant_id, tenant_name: d.company_name,
          logo_url: d.logo_url ?? null, avatar_url: d.avatar_url ?? null,
        })
        setTenant({
          id: d.tenant_id, company_name: d.company_name, logo_url: d.logo_url ?? null,
          onboarding_completed: !!d.onboarding_completed, industry: d.industry ?? null,
          subscription_status: d.subscription_status ?? 'trial',
        })
      })
      .catch(() => localStorage.removeItem('bmi_client_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<{ onboarding_completed: boolean }> {
    const { data } = await clientApi.post('/login', { email, password })
    localStorage.setItem('bmi_client_token', data.data.token)
    setClient(data.data.user)
    setTenant(data.data.tenant)
    return { onboarding_completed: data.data.onboarding_completed }
  }

  function logout() {
    localStorage.removeItem('bmi_client_token')
    setClient(null)
    setTenant(null)
  }

  function updateTenant(patch: Partial<ClientTenant>) {
    setTenant(prev => prev ? { ...prev, ...patch } : null)
  }

  function updateClient(patch: Partial<ClientUser>) {
    setClient(prev => prev ? { ...prev, ...patch } : null)
  }

  return (
    <ClientAuthContext.Provider value={{ client, tenant, loading, login, logout, updateTenant, updateClient }}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext)
  if (!ctx) throw new Error('useClientAuth must be used within ClientAuthProvider')
  return ctx
}
