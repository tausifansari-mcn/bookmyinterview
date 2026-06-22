import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { portalApi } from '@/lib/portalApi'

interface Candidate {
  id: string
  email: string
  full_name: string
  mobile: string
  candidate_code: string
  tenant_id: string
  profile_photo_url: string | null
}

interface CandidateAuthContextType {
  candidate: Candidate | null
  loading: boolean
  login:          (email: string, password: string) => Promise<void>
  register:       (data: RegisterData) => Promise<void>
  logout:         () => void
  updateCandidate: (patch: Partial<Candidate>) => void
}

interface RegisterData {
  full_name: string
  email: string
  mobile: string
  password: string
  current_location?: string
  experience_years?: number
}

const CandidateAuthContext = createContext<CandidateAuthContextType | null>(null)

export function CandidateAuthProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('bmi_candidate_token')
    if (!token) { setLoading(false); return }
    portalApi.get('/me')
      .then(r => setCandidate(r.data.data))
      .catch(() => localStorage.removeItem('bmi_candidate_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { data } = await portalApi.post('/login', { email, password })
    localStorage.setItem('bmi_candidate_token', data.data.token)
    setCandidate(data.data.candidate)
  }

  async function register(formData: RegisterData) {
    const { data } = await portalApi.post('/register', formData)
    localStorage.setItem('bmi_candidate_token', data.data.token)
    setCandidate(data.data.candidate)
  }

  function logout() {
    localStorage.removeItem('bmi_candidate_token')
    setCandidate(null)
  }

  function updateCandidate(patch: Partial<Candidate>) {
    setCandidate(prev => prev ? { ...prev, ...patch } : null)
  }

  return (
    <CandidateAuthContext.Provider value={{ candidate, loading, login, register, logout, updateCandidate }}>
      {children}
    </CandidateAuthContext.Provider>
  )
}

export function useCandidateAuth() {
  const ctx = useContext(CandidateAuthContext)
  if (!ctx) throw new Error('useCandidateAuth must be used within CandidateAuthProvider')
  return ctx
}

export function candidateApiHeaders() {
  const token = localStorage.getItem('bmi_candidate_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
