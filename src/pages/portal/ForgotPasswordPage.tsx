import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const navigate        = useNavigate()
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/portal/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">OTP Sent!</h2>
            <p className="text-sm text-gray-500 mb-1">
              We've sent a 6-digit OTP to
            </p>
            <p className="text-sm font-semibold text-indigo-600 mb-4">{email}</p>
            <p className="text-xs text-gray-400 mb-6">
              Check your inbox (and spam folder). The OTP is valid for <strong>10 minutes</strong>.
            </p>
            <button
              onClick={() => navigate(`/portal/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Enter OTP & Reset Password
            </button>
            <button
              onClick={() => setSent(false)}
              className="w-full mt-3 rounded-lg border border-gray-300 text-gray-700 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-bold text-gray-900">Book My Interview</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/portal/login" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 leading-tight">Forgot Password?</h2>
              <p className="text-sm text-gray-500">Enter your email to receive an OTP</p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 mb-6">
            <Mail className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700">
              We'll send a <strong>6-digit OTP</strong> to your registered email address. Use it to set a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP…</> : 'Send OTP'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/portal/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
