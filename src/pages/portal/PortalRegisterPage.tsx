import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { Sparkles, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function PortalRegisterPage() {
  const { register } = useCandidateAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
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

  const passwordStrength = form.password.length === 0 ? null
    : form.password.length < 6 ? 'weak'
    : form.password.length < 10 ? 'medium'
    : 'strong'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Book My Interview</span>
          </div>
          <p className="text-gray-500 text-sm">Create your candidate account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Get started</h2>
          <p className="text-sm text-gray-500 mb-6">Fill in your details to create your profile</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                required placeholder="Rahul Kumar"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                required placeholder="rahul@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))}
                required maxLength={10} placeholder="9876543210"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text" value={form.current_location} onChange={e => set('current_location', e.target.value)}
                  placeholder="Pune, Maharashtra"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (yrs)</label>
                <input
                  type="number" value={form.experience_years} onChange={e => set('experience_years', e.target.value)}
                  placeholder="2.5" min="0" max="50" step="0.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} required
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="mt-1.5 flex gap-1">
                  {['weak','medium','strong'].map(level => (
                    <div key={level} className={`h-1 flex-1 rounded-full ${
                      passwordStrength === 'strong' ? 'bg-green-500' :
                      passwordStrength === 'medium' && level !== 'strong' ? 'bg-yellow-400' :
                      passwordStrength === 'weak' && level === 'weak' ? 'bg-red-400' : 'bg-gray-200'
                    }`} />
                  ))}
                  <span className={`text-xs ml-1 ${
                    passwordStrength === 'strong' ? 'text-green-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-500'
                  }`}>{passwordStrength}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : <><CheckCircle2 className="h-4 w-4" />Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/portal/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
