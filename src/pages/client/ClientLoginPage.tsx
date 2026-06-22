import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { Loader2, Eye, EyeOff, Zap, Users, BarChart3, ClipboardCheck } from 'lucide-react'

const BENEFITS = [
  { icon: Zap,           title: 'Post jobs in minutes',       sub: 'Go live with a single click'            },
  { icon: Users,         title: 'AI-ranked candidates',       sub: 'Best fits surfaced automatically'        },
  { icon: BarChart3,     title: 'Complete hiring analytics',  sub: 'Track every stage of your pipeline'     },
  { icon: ClipboardCheck,title: 'Assessment builder',         sub: 'Evaluate candidates with smart tests'   },
]

export default function ClientLoginPage() {
  const { login }  = useClientAuth()
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
      const { onboarding_completed } = await login(email, password)
      if (!onboarding_completed) {
        navigate('/client/onboarding')
      } else {
        navigate('/client/dashboard')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-[48%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #78350f 0%, #92400e 40%, #b45309 100%)' }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] right-[-60px] h-[320px] w-[320px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #fcd34d, transparent)' }} />
          <div className="absolute bottom-[-80px] left-[-80px] h-[280px] w-[280px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
          <svg className="absolute inset-0 opacity-5" width="100%" height="100%">
            <defs>
              <pattern id="pgrid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pgrid2)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <img src="/logo.png" alt="Book My Interview" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-bold text-[14px] leading-none">BookMyInterview</p>
              <p className="text-amber-300/60 text-[11px] mt-0.5">HR Client Portal</p>
            </div>
          </div>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold text-amber-300 mb-5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Trusted by 500+ companies
            </div>
            <h1 className="text-[36px] font-bold text-white leading-tight mb-4">
              Hire smarter,<br />
              <span style={{ background: 'linear-gradient(135deg, #fcd34d, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                not harder.
              </span>
            </h1>
            <p className="text-amber-200/70 text-[15px] leading-relaxed max-w-sm">
              Your complete recruitment platform. From job posting to offer letter, all in one place.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {BENEFITS.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(252,211,77,0.15)', border: '1px solid rgba(252,211,77,0.25)' }}>
                  <Icon className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-none">{title}</p>
                  <p className="text-amber-300/60 text-[11.5px] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-amber-100/80 text-[13px] italic leading-relaxed mb-3">
              "Reduced time-to-hire by 40%. The AI ranking alone is worth every rupee."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                RK
              </div>
              <div>
                <p className="text-white text-[12px] font-semibold leading-none">Ramesh Kumar</p>
                <p className="text-amber-400/60 text-[11px] mt-0.5">HR Director, TechCorp India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <img src="/logo.png" alt="Book My Interview" className="h-8 w-8 rounded-xl object-cover" />
            <p className="font-bold text-[14px] text-slate-900">BookMyInterview</p>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-slate-900 leading-tight">Welcome back!</h2>
            <p className="text-slate-500 mt-1.5 text-[14px]">Sign in to your HR portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Work Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="hr@company.com" className="field"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password
              </label>
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

            <button type="submit" disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-semibold text-[14px] text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: loading ? 'none' : '0 4px 14px rgba(245,158,11,0.4)' }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-[12px] text-slate-400">
              First time?{' '}
              <span className="text-slate-600">Contact your BMI account manager to get access.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
