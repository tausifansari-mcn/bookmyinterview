import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Sparkles, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const email             = params.get('email') ?? ''
  const [otp, setOtp]     = useState(['', '', '', '', '', ''])
  const [password, setPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputs.current[0]?.focus() }, [])

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setError('')
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length !== 6) { setError('Please enter all 6 digits of the OTP.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }

    setError('')
    setLoading(true)
    try {
      await api.post('/portal/reset-password', { email, otp: otpStr, new_password: password })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">Invalid link. Please start the forgot password process again.</p>
          <Link to="/portal/forgot-password" className="text-indigo-600 font-medium hover:underline">Go back</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your password has been updated successfully. You can now login with your new password.
          </p>
          <button
            onClick={() => navigate('/portal/login')}
            className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const otpFilled = otp.every(d => d !== '')
  const passwordStrength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'medium' : 'strong'

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
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/portal/forgot-password" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Enter OTP & New Password</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6 ml-8">
            OTP sent to <span className="font-medium text-gray-700">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Enter 6-digit OTP</label>
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-12 h-12 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors
                      ${digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-900'}
                      focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                  />
                ))}
              </div>
              {otpFilled && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> OTP entered
                </p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPw(e.target.value); setError('') }}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="mt-1.5 flex gap-1 items-center">
                  {['weak','medium','strong'].map(level => (
                    <div key={level} className={`h-1 flex-1 rounded-full ${
                      passwordStrength === 'strong' ? 'bg-green-500' :
                      passwordStrength === 'medium' && level !== 'strong' ? 'bg-yellow-400' :
                      passwordStrength === 'weak' && level === 'weak' ? 'bg-red-400' : 'bg-gray-200'
                    }`} />
                  ))}
                  <span className={`text-xs ml-1 ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-500'}`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password" value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError('') }}
                placeholder="Re-enter password"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
                  confirmPw && confirmPw !== password ? 'border-red-400' : 'border-gray-300'
                }`}
              />
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
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting…</> : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Didn't receive OTP?{' '}
            <Link to="/portal/forgot-password" className="text-indigo-600 hover:underline font-medium">Resend</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
