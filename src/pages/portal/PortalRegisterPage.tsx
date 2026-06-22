import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'

export default function PortalRegisterPage() {
  const { register } = useCandidateAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '', password: '',
    current_location: '', experience_years: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!/^\d{10}$/.test(form.mobile)) { setError('Enter a valid 10-digit mobile number'); return }
    setLoading(true)
    try {
      await register({
        full_name: form.full_name,
        email:     form.email,
        mobile:    form.mobile,
        password:  form.password,
        current_location: form.current_location || undefined,
        experience_years: form.experience_years ? parseFloat(form.experience_years) : undefined,
      })
      navigate('/portal/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = form.password.length === 0 ? null
    : form.password.length < 6  ? 'weak'
    : form.password.length < 10 ? 'medium'
    : 'strong'

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[46%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)' }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-60px] h-[300px] w-[300px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
          <div className="absolute bottom-[80px] right-[-60px] h-[260px] w-[260px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <svg className="absolute inset-0 opacity-5" width="100%" height="100%">
            <defs>
              <pattern id="rgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rgrid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="text-white font-bold text-[14px] leading-none">BookMyInterview</p>
              <p className="text-indigo-300/60 text-[11px] mt-0.5">Candidate Portal</p>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-[34px] font-bold text-white leading-tight mb-4">
              Build your profile,<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                land your dream job.
              </span>
            </h1>
            <p className="text-indigo-200/70 text-[14px] leading-relaxed max-w-sm">
              Create your free profile in under 2 minutes. AI matches you with the right companies automatically.
            </p>
          </div>

          <div className="space-y-3 mb-12">
            {[
              '✅ Free forever — no credit card',
              '🤖 AI-powered job matching',
              '📊 Track all applications in one place',
              '🎥 Video intro to stand out',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <p className="text-indigo-100/80 text-[13.5px]">{item}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-[13px]">★</span>
              ))}
            </div>
            <p className="text-indigo-100/80 text-[13px] italic leading-relaxed mb-2.5">
              "The profile feature helped me get noticed by 3 companies in one week!"
            </p>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                AK
              </div>
              <div>
                <p className="text-white text-[11.5px] font-semibold leading-none">Arjun Kumar</p>
                <p className="text-indigo-400/60 text-[10.5px] mt-0.5">Product Manager, Mumbai</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-8 w-8 rounded-xl object-cover" />
            <p className="font-bold text-[14px] text-slate-900">BookMyInterview</p>
          </div>

          <div className="mb-7">
            <h2 className="text-[26px] font-bold text-slate-900 leading-tight">Create your account</h2>
            <p className="text-slate-500 mt-1.5 text-[14px]">Join 50,000+ professionals on BookMyInterview.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                required placeholder="Rahul Kumar" className="field"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                required placeholder="rahul@example.com" className="field"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))}
                required maxLength={10} placeholder="9876543210" className="field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Location</label>
                <input
                  type="text" value={form.current_location} onChange={e => set('current_location', e.target.value)}
                  placeholder="Pune, Maharashtra" className="field"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Exp (yrs)</label>
                <input
                  type="number" value={form.experience_years} onChange={e => set('experience_years', e.target.value)}
                  placeholder="2.5" min="0" max="50" step="0.5" className="field"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} required
                  placeholder="Min 6 characters" className="field pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {['weak','medium','strong'].map(level => (
                      <div key={level} className="h-1 flex-1 rounded-full transition-all" style={{
                        background: pwStrength === 'strong' ? '#10b981'
                          : pwStrength === 'medium' && level !== 'strong' ? '#f59e0b'
                          : pwStrength === 'weak' && level === 'weak' ? '#ef4444'
                          : '#e2e8f0',
                      }} />
                    ))}
                  </div>
                  <span className={`text-[11px] font-medium ${
                    pwStrength === 'strong' ? 'text-emerald-600' :
                    pwStrength === 'medium' ? 'text-amber-600' : 'text-red-500'}`}>
                    {pwStrength}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-600 text-[10px] font-bold">!</span>
                </div>
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : <><CheckCircle2 className="h-4 w-4" /> Create Account <ArrowRight className="h-4 w-4 ml-1" /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/portal/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
