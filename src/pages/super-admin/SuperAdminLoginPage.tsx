import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const { login }  = useSuperAdminAuth()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      navigate('/super-admin/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Book My Interview" className="h-14 w-14 rounded-2xl mx-auto mb-4 object-cover shadow-lg" />
          <h1 className="text-[24px] font-bold text-white">Super Admin Console</h1>
          <p className="text-slate-400 text-[14px] mt-1">BookMyInterview Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="superadmin@bookmyinterview.in"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-[14px] text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-slate-500 mt-6">
          Restricted access — BMI team only
        </p>
      </div>
    </div>
  )
}
