import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  'AI-powered candidate screening',
  'Automated interview scheduling',
  'Smart assessment & scoring',
  'Real-time hiring analytics',
]

export default function LoginPage() {
  const { login }  = useAuth()
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
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex w-[48%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] h-[360px] w-[360px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] h-[280px] w-[280px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 opacity-5" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <img src="/logo.png" alt="Book My Interview" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-bold text-[15px] leading-none">BookMyInterview</p>
              <p className="text-indigo-300/60 text-[11px] mt-0.5">AI Hiring OS</p>
            </div>
          </div>

          {/* Main message */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Hire smarter,<br />
              <span className="gradient-text">10× faster.</span>
            </h1>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-sm">
              The complete AI hiring platform for modern HR teams. Screen, schedule, assess, and hire — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3 mb-12">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-[13.5px]">{f}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-slate-300 text-[13px] italic leading-relaxed mb-3">
              "BookMyInterview cut our time-to-hire from 6 weeks to 10 days. The AI screening is remarkable."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                RA
              </div>
              <div>
                <p className="text-white text-[12px] font-medium leading-none">Rohan Arora</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Head of Talent, TechCorp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/logo.png" alt="Book My Interview" className="h-9 w-9 rounded-xl object-cover" />
            <p className="font-bold text-[15px] text-slate-900">BookMyInterview</p>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Welcome back</h2>
            <p className="text-slate-500 mt-1.5 text-[14px]">Sign in to your workspace to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@company.com"
                className="field"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wide">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="field pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-[10px] font-bold">!</span>
                </div>
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-[13px] text-slate-500">
              Are you a candidate?{' '}
              <Link to="/portal/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Go to Candidate Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
