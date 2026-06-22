import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  Shield, User, KeyRound, Loader2, Eye, EyeOff, CheckCircle2,
  Bell, MessageSquare, Users, Star, Building2,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return '—'
  const diff = Date.now() - ts
  if (diff < 0) return 'just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getInitialsColor(name: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']
  const safe = name || 'A'
  const idx = safe.charCodeAt(0) % colors.length
  return colors[idx]
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  company_name: string
  logo_url: string | null
  industry: string
  city: string
  total_jobs: number
  active_jobs: number
  total_applications: number
  onboarding_completed: boolean
  is_active: boolean
}

interface FeedbackItem {
  id: string
  candidate_name: string | null
  candidate_email: string | null
  feedback_type: 'bug' | 'suggestion' | 'complaint' | 'praise' | 'other'
  message: string
  sentiment: 'positive' | 'negative' | 'neutral'
  rating: number | null
  page_context: string | null
  created_at: string
}

interface SentimentCounts {
  positive: number
  neutral: number
  negative: number
}

// ─── sub-components ──────────────────────────────────────────────────────────

function AvatarCircle({ name, logoUrl, size = 48 }: { name: string; logoUrl?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const bg = getInitialsColor(name || 'A')
  const initials = (name || 'N/A').charAt(0).toUpperCase()
  const style = { width: size, height: size, minWidth: size }

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{ ...style, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div style={{ ...style, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</span>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-slate-600'}`}
        />
      ))}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const map = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    neutral:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    negative: 'text-red-400 bg-red-500/10 border-red-500/20',
  }
  const emoji = { positive: '😊', neutral: '😐', negative: '😞' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${map[sentiment]}`}>
      {emoji[sentiment]} {sentiment}
    </span>
  )
}

function FeedbackTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300 uppercase tracking-wide">
      {type}
    </span>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SuperAdminSettingsPage() {
  const { admin } = useSuperAdminAuth()

  // ── password form state (unchanged) ────────────────────────────────────────
  const [currentPw, setCurrentPw]     = useState('')
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)

  // ── stats ───────────────────────────────────────────────────────────────────
  const [statsLoading, setStatsLoading] = useState(true)
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [totalNotifs, setTotalNotifs]   = useState<number | null>(null)
  const [totalFeedback, setTotalFeedback] = useState<number | null>(null)

  // ── clients ─────────────────────────────────────────────────────────────────
  const [clients, setClients]           = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  // ── feedback ─────────────────────────────────────────────────────────────────
  const [feedback, setFeedback]               = useState<FeedbackItem[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [sentimentCounts, setSentimentCounts] = useState<SentimentCounts>({ positive: 0, neutral: 0, negative: 0 })
  const [sentimentFilter, setSentimentFilter] = useState<'' | 'positive' | 'neutral' | 'negative'>('')
  const [typeFilter, setTypeFilter]           = useState<'' | 'bug' | 'suggestion' | 'complaint' | 'praise' | 'other'>('')

  // ── data fetching ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true)
      try {
        const [c, n, f] = await Promise.all([
          superAdminApi.get('/clients?page=1&limit=1'),
          superAdminApi.get('/notifications?page=1&limit=1'),
          superAdminApi.get('/feedback?page=1&limit=1'),
        ])
        setTotalClients(c.data?.data?.total ?? null)
        setTotalNotifs(n.data?.data?.total ?? null)
        setTotalFeedback(f.data?.data?.total ?? null)
      } catch { /* non-fatal */ }
      finally { setStatsLoading(false) }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchClients() {
      setClientsLoading(true)
      try {
        const res = await superAdminApi.get('/clients?page=1&limit=12')
        setClients(res.data?.data?.clients ?? [])
      } catch { setClients([]) }
      finally { setClientsLoading(false) }
    }
    fetchClients()
  }, [])

  const fetchFeedback = useCallback(async () => {
    setFeedbackLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '15' })
      if (sentimentFilter) params.set('sentiment', sentimentFilter)
      if (typeFilter)      params.set('type', typeFilter)
      const res = await superAdminApi.get(`/feedback?${params.toString()}`)
      setFeedback(res.data?.data?.feedback ?? [])
      if (res.data?.data?.sentiment_counts) {
        setSentimentCounts(res.data.data.sentiment_counts)
      }
    } catch {
      setFeedback([])
      setSentimentCounts({ positive: 0, neutral: 0, negative: 0 })
    }
    finally { setFeedbackLoading(false) }
  }, [sentimentFilter, typeFilter])

  useEffect(() => { fetchFeedback() }, [fetchFeedback])

  // ── handlers ──────────────────────────────────────────────────────────────────

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false)
    if (newPw.length < 8) { setError('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await superAdminApi.post('/change-password', { current_password: currentPw, new_password: newPw })
      setSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  // ── shared styles ─────────────────────────────────────────────────────────────

  const inputCls  = 'w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[14px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
  const labelCls  = 'block text-[11px] font-semibold text-zinc-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide'
  const cardCls   = 'rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6'
  const titleCls  = 'text-[15px] font-bold text-zinc-900 dark:text-white flex items-center gap-2'

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Page Header + Stats ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-white">Settings &amp; Overview</h1>
        <p className="text-[13px] text-zinc-500 dark:text-slate-400 mt-0.5">Platform-wide controls and insights</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { icon: <Users className="h-4 w-4 text-indigo-400" />, label: 'Total Clients',       value: totalClients },
            { icon: <Bell  className="h-4 w-4 text-violet-400" />, label: 'Total Notifications', value: totalNotifs },
            { icon: <MessageSquare className="h-4 w-4 text-emerald-400" />, label: 'Total Feedback', value: totalFeedback },
          ].map(chip => (
            <div key={chip.label}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
              {chip.icon}
              <span className="text-[20px] font-bold text-zinc-900 dark:text-white leading-none">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400 dark:text-slate-500" /> : (chip.value ?? '—')}
              </span>
              <span className="text-[12px] text-zinc-500 dark:text-slate-400">{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admin Profile Card ────────────────────────────────────────────── */}
      <div className={cardCls}>
        <h2 className={titleCls + ' mb-4'}>
          <User className="h-4 w-4 text-indigo-400" /> Admin Profile
        </h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Shield className="h-7 w-7 text-white" />
            </div>
            {/* gradient strip accent */}
            <div
              className="absolute -left-1 top-2 bottom-2 w-1 rounded-full"
              style={{ background: 'linear-gradient(to bottom, #6366f1, #ec4899)' }}
            />
          </div>
          <div>
            <p className="text-[18px] font-bold text-zinc-900 dark:text-white leading-tight">{admin?.full_name ?? 'Super Admin'}</p>
            <p className="text-[13px] text-zinc-500 dark:text-slate-400 mt-0.5">{admin?.email}</p>
            <span className="inline-flex items-center mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 gap-1">
              <Shield className="h-2.5 w-2.5" /> Platform Administrator
            </span>
          </div>
        </div>
      </div>

      {/* ── Active Clients ────────────────────────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={titleCls}>
            <Building2 className="h-4 w-4 text-indigo-400" /> Active Clients
          </h2>
          <Link
            to="/super-admin/clients"
            className="flex items-center gap-1 text-[12px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium"
          >
            View All →
          </Link>
        </div>

        {clientsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10" />
                <div className="w-14 h-2 rounded bg-zinc-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-[13px] text-zinc-400 dark:text-slate-500 text-center py-6">No clients yet</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-1 scrollbar-thin">
            {clients.map(c => (
              <div key={c.id} className="flex flex-col items-center gap-2 shrink-0 w-14">
                <AvatarCircle name={c.company_name} logoUrl={c.logo_url} size={48} />
                <span className="text-[10px] text-zinc-500 dark:text-slate-400 text-center leading-tight w-full truncate">
                  {c.company_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Candidate Feedback ────────────────────────────────────────────── */}
      <div className={cardCls}>
        <h2 className={titleCls + ' mb-4'}>
          <MessageSquare className="h-4 w-4 text-indigo-400" /> Candidate Feedback
        </h2>

        {/* Sentiment overview chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'positive', label: 'Positive', emoji: '😊', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { key: 'neutral',  label: 'Neutral',  emoji: '😐', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { key: 'negative', label: 'Negative', emoji: '😞', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
          ].map(s => (
            <div key={s.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold ${s.cls}`}>
              {s.emoji}
              <span>{s.label}</span>
              <span className="font-bold">{sentimentCounts[s.key as keyof SentimentCounts]}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {(['', 'positive', 'neutral', 'negative'] as const).map(v => (
              <button
                key={v}
                onClick={() => setSentimentFilter(v)}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                  sentimentFilter === v
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10'
                }`}
              >
                {v === '' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
            className="ml-auto px-3 py-1 rounded-lg text-[12px] font-medium bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="bug">Bug Report</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
            <option value="praise">Praise</option>
            <option value="other">Other</option>
          </select>
        </div>

        {feedbackLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5 p-4 space-y-2">
                <div className="flex gap-2">
                  <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-2.5 w-16 rounded bg-zinc-200 dark:bg-white/10" />
                </div>
                <div className="h-2 w-full rounded bg-zinc-200 dark:bg-white/10" />
                <div className="h-2 w-4/5 rounded bg-zinc-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <p className="text-[13px] text-zinc-400 dark:text-slate-500 text-center py-8">No feedback found</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {f.candidate_name || 'Anonymous'}
                  </span>
                  <FeedbackTypeBadge type={f.feedback_type} />
                  <SentimentBadge sentiment={f.sentiment} />
                  {f.rating != null && (
                    <StarRating rating={f.rating} />
                  )}
                  <span className="ml-auto text-[11px] text-zinc-400 dark:text-slate-500">{timeAgo(f.created_at)}</span>
                </div>
                <p className="text-[13px] text-zinc-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {f.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <div className={cardCls}>
        <h2 className="text-[14px] font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-400" /> Change Password
        </h2>
        <p className="text-[12px] text-zinc-400 dark:text-slate-500 mb-5">Use a strong password with at least 8 characters.</p>

        {success && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-400 font-medium">Password changed successfully!</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password *</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required
                placeholder="Enter current password"
                className={inputCls + ' pr-11'}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>New Password *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                placeholder="Min 8 characters"
                className={inputCls + ' pr-11'}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Confirm New Password *</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              placeholder="Re-enter new password"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <span className="text-red-400 text-[10px] font-bold mt-0.5 shrink-0">!</span>
              <p className="text-[13px] text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
            style={{
              background: loading ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.4)',
            }}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing…</>
              : <><KeyRound className="h-4 w-4" /> Change Password</>}
          </button>
        </form>
      </div>

    </div>
  )
}
