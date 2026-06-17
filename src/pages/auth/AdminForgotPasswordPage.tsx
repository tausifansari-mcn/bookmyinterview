import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Sparkles, Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function AdminForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-sm text-gray-500 mb-2">
            If <span className="font-medium text-gray-700">{email}</span> is a registered admin account, you'll receive an OTP shortly.
          </p>
          <p className="text-xs text-gray-400 mb-6">OTP is valid for 10 minutes. Check your spam folder if not received.</p>
          <Link
            to="/admin-reset-password"
            state={{ email }}
            className="block w-full rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
          >
            Enter OTP & Reset Password →
          </Link>
          <Link to="/login" className="block mt-3 text-sm text-gray-500 hover:text-gray-700">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none">Book My Interview</h1>
                <p className="text-xs text-muted-foreground">Admin Password Reset</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Link to="/login" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Forgot Password</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-7">Enter your admin email to receive a reset OTP.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Admin Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@company.com"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP…</> : 'Send Reset OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
