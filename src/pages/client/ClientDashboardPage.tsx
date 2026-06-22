import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientApi } from '@/lib/clientApi'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { motion } from 'motion/react'
import {
  Briefcase, Users, FileText, CalendarCheck, Plus, ArrowRight, Loader2,
  CheckCircle2, XCircle, TrendingUp, Target, Sparkles, Building2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface DashData {
  active_jobs: number
  total_candidates: number
  total_applications: number
  this_week_applications: number
  interviews_scheduled: number
  offers_sent: number
  shortlisted: number
  hired_count: number
  rejected_count: number
  applications_trend: Array<{ week: string; applications: number }>
  top_jobs: Array<{ id: string; title: string; status: string; application_count: number }>
  stage_breakdown: Array<{ stage: string; count: number }>
}

const ACCENT_MAP: Record<string, { from: string; to: string; bg: string; text: string; ring: string }> = {
  indigo:  { from: '#6366f1', to: '#4f46e5', bg: '#eef2ff', text: '#4f46e5', ring: '#c7d2fe' },
  purple:  { from: '#8b5cf6', to: '#7c3aed', bg: '#f5f3ff', text: '#7c3aed', ring: '#ddd6fe' },
  amber:   { from: '#f59e0b', to: '#d97706', bg: '#fffbeb', text: '#b45309', ring: '#fde68a' },
  green:   { from: '#10b981', to: '#059669', bg: '#ecfdf5', text: '#065f46', ring: '#a7f3d0' },
  red:     { from: '#ef4444', to: '#dc2626', bg: '#fef2f2', text: '#991b1b', ring: '#fca5a5' },
}

function StatCard({
  label, value, icon: Icon, accent, sub,
}: {
  label: string; value: number | string; icon: React.ElementType; accent: string; sub?: string
}) {
  const c = ACCENT_MAP[accent] ?? ACCENT_MAP.indigo
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-4 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all"
      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
          <Icon className="h-5 w-5" style={{ color: c.from }} />
        </div>
        {sub && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
            +{sub} this week
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-black text-zinc-900 leading-none">{value}</p>
        <p className="text-[12px] text-zinc-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

export default function ClientDashboardPage() {
  const { client, tenant }    = useClientAuth()
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    clientApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const companyName = tenant?.company_name ?? client?.full_name ?? 'there'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-5">

      {/* ── Hero Welcome Banner ── */}
      <motion.div {...fadeUp(0)}
        className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)' }}>
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-5 translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <p className="text-indigo-300 text-[12px] font-semibold">{greeting},</p>
            </div>
            <h1 className="text-[22px] sm:text-[28px] font-black leading-tight text-white mb-1 truncate">{companyName}!</h1>
            <p className="text-[12px] sm:text-[13px] text-zinc-400 leading-relaxed max-w-sm">
              {data.interviews_scheduled > 0
                ? `${data.interviews_scheduled} interview${data.interviews_scheduled !== 1 ? 's' : ''} scheduled. Your hiring pipeline is active.`
                : data.active_jobs > 0
                ? `${data.active_jobs} job${data.active_jobs !== 1 ? 's' : ''} live. Candidates are applying!`
                : 'Welcome to your hiring dashboard. Post your first job to get started.'}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/client/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                <Plus className="h-3.5 w-3.5" /> Post a Job
              </Link>
              <Link to="/client/applications"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                View Pipeline <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Key number callout */}
          <div className="hidden sm:flex flex-col items-center shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
              <p className="text-[32px] font-black text-indigo-300 leading-none">{data.total_applications}</p>
              <p className="text-[11px] text-zinc-400 mt-1">Total<br/>Applicants</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
        {[
          { label: 'Open Jobs',    value: data.active_jobs,          icon: Briefcase,     accent: 'indigo' },
          { label: 'Candidates',   value: data.total_candidates,     icon: Users,         accent: 'purple' },
          { label: 'Applications', value: data.total_applications,   icon: FileText,      accent: 'amber',
            sub: data.this_week_applications > 0 ? String(data.this_week_applications) : undefined },
          { label: 'Interviews',   value: data.interviews_scheduled, icon: CalendarCheck, accent: 'indigo' },
          { label: 'Hired',        value: data.hired_count ?? 0,     icon: CheckCircle2,  accent: 'green' },
          { label: 'Rejected',     value: data.rejected_count ?? 0,  icon: XCircle,       accent: 'red'   },
        ].map(s => (
          <motion.div key={s.label}
            variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts ── */}
      <motion.div {...fadeUp(0.2)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-md transition-shadow"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900">Applications Trend</h2>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">Weekly application volume</p>
            </div>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.applications_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-md transition-shadow"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-zinc-900">Pipeline by Stage</h2>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">Candidate distribution</p>
            </div>
            <Target className="h-4 w-4 text-violet-400" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.stage_breakdown} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: '#a1a1aa' }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="count" name="Candidates" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Bottom Grid: Top Jobs + Quick Actions ── */}
      <motion.div {...fadeUp(0.3)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </div>
              <h2 className="text-[14px] font-bold text-zinc-900">Top Jobs</h2>
            </div>
            <Link to="/client/jobs" className="flex items-center gap-1 text-[12px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {data.top_jobs.map((job, i) => (
              <motion.div key={job.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.3 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50/80 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {(job.title?.[0] ?? 'J').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 truncate">{job.title}</p>
                    <div className="mt-0.5"><StatusBadge status={job.status} /></div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[16px] font-black text-zinc-900">{job.application_count}</p>
                  <p className="text-[10px] text-zinc-400">applicants</p>
                </div>
              </motion.div>
            ))}
            {data.top_jobs.length === 0 && (
              <div className="px-5 py-10 text-center">
                <Building2 className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-[13px] text-zinc-400">No jobs posted yet</p>
                <Link to="/client/jobs" className="mt-2 inline-block text-[12.5px] font-semibold text-indigo-500">Post your first job →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-md transition-shadow"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <h2 className="text-[14px] font-bold text-zinc-900">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {([
              { label: 'Post a New Job',      to: '/client/jobs',         icon: Briefcase,     color: '#6366f1', bg: '#eef2ff' },
              { label: 'Review Pipeline',     to: '/client/applications', icon: FileText,      color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Browse Candidates',   to: '/client/candidates',   icon: Users,         color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Manage Assessments',  to: '/client/assessments',  icon: CalendarCheck, color: '#10b981', bg: '#ecfdf5' },
            ] as const).map((a, i) => (
              <motion.div key={a.to}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07, duration: 0.3 }}>
                <Link to={a.to}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/50 hover:-translate-y-0.5 hover:shadow-sm transition-all group">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors" style={{ background: a.bg }}>
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  </div>
                  <span className="text-[13px] font-semibold text-zinc-700 group-hover:text-indigo-700 transition-colors flex-1">{a.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
