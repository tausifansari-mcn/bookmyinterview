import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { Loader2, Eye, EyeOff, Briefcase, TrendingUp, Star } from 'lucide-react'

const BENEFITS = [
  { icon: Briefcase,   title: '10,000+ Active Jobs',  sub: 'Across 500+ companies in India'     },
  { icon: TrendingUp,  title: 'AI Match Score',        sub: 'Get ranked for roles you fit best'  },
  { icon: Star,        title: 'Track Everything',      sub: 'Real-time status on every application' },
]

export default function PortalLoginPage() {
  const { login } = useCandidateAuth()
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
      navigate('/portal/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[48%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)' }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] right-[-60px] h-[320px] w-[320px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
          <div className="absolute bottom-[-80px] left-[-80px] h-[280px] w-[280px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <svg className="absolute inset-0 opacity-5" width="100%" height="100%">
            <defs>
              <pattern id="pgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pgrid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-bold text-[14px] leading-none">BookMyInterview</p>
              <p className="text-indigo-300/60 text-[11px] mt-0.5">Candidate Portal</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold text-indigo-300 mb-5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              🚀 Trusted by 50,000+ professionals
            </div>
            <h1 className="text-[36px] font-bold text-white leading-tight mb-4">
              Your dream career<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                starts here.
              </span>
            </h1>
            <p className="text-indigo-200/70 text-[15px] leading-relaxed max-w-sm">
              Discover roles matched to your skills. Apply in minutes. Track every step of your journey.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-12">
            {BENEFITS.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.25)' }}>
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-none">{title}</p>
                  <p className="text-indigo-300/60 text-[11.5px] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-indigo-100/80 text-[13px] italic leading-relaxed mb-3">
              "Found my dream job in just 2 weeks! The AI matching is incredibly accurate."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                PS
              </div>
              <div>
                <p className="text-white text-[12px] font-semibold leading-none">Priya Sharma</p>
                <p className="text-indigo-400/60 text-[11px] mt-0.5">Software Engineer, Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-8 w-8 rounded-xl object-cover" />
            <p className="font-bold text-[14px] text-slate-900">BookMyInterview</p>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Welcome back!</h2>
            <p className="text-slate-500 mt-1.5 text-[14px]">Sign in to your candidate account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com" className="field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                <Link to="/portal/forgot-password" className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" className="field pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-[10px] font-bold">!</span>
                </div>
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <p className="text-center text-[13px] text-slate-500">
              New candidate?{' '}
              <Link to="/portal/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Create free account →
              </Link>
            </p>
            <p className="text-center text-[12px] text-slate-400">
              Are you a recruiter?{' '}
              <Link to="/login" className="text-slate-500 hover:text-slate-700">Recruiter Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
