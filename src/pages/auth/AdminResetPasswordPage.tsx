import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function AdminResetPasswordPage() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const emailPre    = (location.state as any)?.email ?? ''
  const [email, setEmail]         = useState(emailPre)
  const [otp, setOtp]             = useState(['', '', '', '', '', ''])
  const [password, setPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputs.current[0]?.focus() }, [])

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return
    const next = [...otp]; next[i] = v.slice(-1); setOtp(next); setError('')
    if (v && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split('')); inputs.current[5]?.focus() }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6)          { setError('Please enter all 6 digits of the OTP.'); return }
    if (password.length < 8)          { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPw)       { setError('Passwords do not match.'); return }
    if (!email)                       { setError('Please enter your email address.'); return }
    setError(''); setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, otp: otpStr, new_password: password })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to reset password. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now sign in.</p>
          <button onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const strength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'medium' : 'strong'

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Book My Interview" className="h-10 w-10 rounded-xl object-cover" />
              <div>
                <h1 className="font-bold text-lg leading-none">Book My Interview</h1>
                <p className="text-xs text-muted-foreground">Admin Password Reset</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Link to="/forgot-password" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Enter OTP & New Password</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!emailPre && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
              <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => { inputs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors
                      ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 bg-white text-gray-900'}
                      focus:border-primary focus:ring-2 focus:ring-primary/20`}
                  />
                ))}
              </div>
              {otp.every(d => d) && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> OTP entered
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPw(e.target.value); setError('') }} placeholder="Min 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-1.5 flex gap-1 items-center">
                  {['weak','medium','strong'].map(l => (
                    <div key={l} className={`h-1 flex-1 rounded-full ${
                      strength === 'strong' ? 'bg-green-500' :
                      strength === 'medium' && l !== 'strong' ? 'bg-yellow-400' :
                      strength === 'weak' && l === 'weak' ? 'bg-red-400' : 'bg-gray-200'}`} />
                  ))}
                  <span className={`text-xs ml-1 ${strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-yellow-600' : 'text-red-500'}`}>{strength}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError('') }} placeholder="Re-enter password"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                  confirmPw && confirmPw !== password ? 'border-red-400' : 'border-gray-300'}`} />
              {confirmPw && confirmPw === password && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting…</> : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Didn't get OTP?{' '}
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">Resend →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
