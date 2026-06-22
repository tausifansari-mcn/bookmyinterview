import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import {
  Users, Briefcase, Calendar, TrendingUp, Clock,
  CheckCircle2, XCircle, ClipboardCheck, ArrowUpRight,
  Sparkles, Activity,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'

interface DashboardStats {
  active_jobs: number
  total_candidates: number
  total_applications: number
  applications_this_week: number
  interviews_today: number
  interviews_pending: number
  offers_sent: number
  offers_accepted: number
  pending_assessments: number
  shortlisted: number
}
interface FunnelItem  { stage: string; count: number }
interface TrendItem   { week: string; applications: number; shortlisted: number }
interface ActivityItem { type: string; candidate_name: string; job_title: string; action_at: string }

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff']

function StatCard({
  label, value, sub, icon: Icon, gradient, iconBg, badge, badgeColor, to,
}: {
  label: string; value: number | string; sub: string
  icon: any; gradient: string; iconBg: string; badge?: string
  badgeColor?: string; to: string
}) {
  return (
    <Link to={to} className="block">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden
                      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
        {/* Corner decoration */}
        <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-[0.07]"
          style={{ background: gradient }} />

        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: gradient.match(/#[0-9a-f]+/i)?.[0] ?? '#6366f1' }} />
          </div>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badgeColor + '18', color: badgeColor }}>
              {badge}
            </span>
          )}
        </div>

        <p className="text-3xl font-bold text-slate-900 leading-none mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-[13px] font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>

        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-slate-100 mb-4" />
      <div className="h-8 w-16 bg-slate-100 rounded-lg mb-2" />
      <div className="h-4 w-24 bg-slate-100 rounded" />
      <div className="h-3 w-32 bg-slate-50 rounded mt-1" />
    </div>
  )
}

const CustomTooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    fontSize: 12,
    padding: '10px 14px',
  },
  cursor: { fill: 'rgba(99,102,241,0.04)' },
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null)
  const [funnel,   setFunnel]   = useState<FunnelItem[]>([])
  const [trend,    setTrend]    = useState<TrendItem[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/funnel'),
      api.get('/dashboard/trend'),
      api.get('/dashboard/activity'),
    ]).then(([s, f, t, a]) => {
      setStats(s.data.data)
      setFunnel(f.data.data)
      setTrend(t.data.data)
      setActivity(a.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    {
      label: 'Active Jobs',
      value: stats.active_jobs,
      sub:   `${stats.total_applications} total applications`,
      icon:  Briefcase,
      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      iconBg:   '#eff6ff',
      badge: `+${stats.applications_this_week} this week`,
      badgeColor: '#3b82f6',
      to: '/jobs',
    },
    {
      label: 'Candidates',
      value: stats.total_candidates,
      sub:   `${stats.shortlisted} shortlisted`,
      icon:  Users,
      gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      iconBg:   '#f5f3ff',
      badge: `${stats.shortlisted} ready`,
      badgeColor: '#8b5cf6',
      to: '/candidates',
    },
    {
      label: 'Interviews Today',
      value: stats.interviews_today,
      sub:   `${stats.interviews_pending} pending`,
      icon:  Calendar,
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
      iconBg:   '#fffbeb',
      badge: `${stats.interviews_pending} pending`,
      badgeColor: '#f59e0b',
      to: '/interviews',
    },
    {
      label: 'Offers Sent',
      value: stats.offers_sent,
      sub:   `${stats.offers_accepted} accepted`,
      icon:  TrendingUp,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      iconBg:   '#ecfdf5',
      badge: `${stats.offers_accepted} accepted`,
      badgeColor: '#10b981',
      to: '/offers',
    },
  ] : []

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Action banner ── */}
      {stats && (stats.pending_assessments > 0 || stats.shortlisted > 0) && (
        <div className="rounded-2xl p-5 text-white flex items-center justify-between gap-4 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)' }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-[15px]">Action required</p>
              <p className="text-white/70 text-[13px] mt-0.5">
                {stats.pending_assessments > 0 && `${stats.pending_assessments} assessments pending review`}
                {stats.pending_assessments > 0 && stats.shortlisted > 0 && ' · '}
                {stats.shortlisted > 0 && `${stats.shortlisted} candidates shortlisted for interview`}
              </p>
            </div>
          </div>
          <Link to="/assessments"
            className="relative z-10 shrink-0 text-[13px] font-semibold px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors whitespace-nowrap">
            Review now →
          </Link>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Application Trend — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">Application Trend</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Last 4 weeks</p>
            </div>
            <Activity className="h-4 w-4 text-slate-300" />
          </div>
          {loading ? (
            <div className="h-52 animate-pulse bg-slate-50 rounded-xl" />
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...CustomTooltipStyle} />
                <Line type="monotone" dataKey="applications" name="Applications"
                  stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="shortlisted" name="Shortlisted"
                  stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Activity className="h-8 w-8 text-slate-200" />
              No trend data yet
            </div>
          )}
        </div>

        {/* Hiring Funnel — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">Pipeline</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">This month</p>
            </div>
          </div>
          {loading ? (
            <div className="h-52 animate-pulse bg-slate-50 rounded-xl" />
          ) : funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: -4 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" width={88} tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={CustomTooltipStyle.contentStyle}
                  cursor={{ fill: 'rgba(99,102,241,0.04)' }}
                  formatter={(v: any) => [v, 'Candidates']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              No pipeline data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Latest hiring events</p>
          </div>
          <Link to="/applications" className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-50 rounded animate-pulse" />
                </div>
                <div className="h-3 w-12 bg-slate-50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
        ) : (
          <div className="space-y-1">
            {activity.map((a, i) => {
              const typeMap = {
                shortlisted: { icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5', label: 'Shortlisted' },
                rejected:    { icon: XCircle,      color: '#ef4444', bg: '#fef2f2', label: 'Rejected'    },
                interview:   { icon: Calendar,     color: '#6366f1', bg: '#eef2ff', label: 'Interview'   },
                applied:     { icon: Users,        color: '#8b5cf6', bg: '#f5f3ff', label: 'Applied'     },
              } as Record<string, any>
              const t = typeMap[a.type] ?? typeMap.applied
              const Icon = t.icon
              const ts   = new Date(a.action_at)
              const diff = Date.now() - ts.getTime()
              const ago  = diff < 3_600_000  ? `${Math.floor(diff / 60_000)} min ago`
                         : diff < 86_400_000 ? `${Math.floor(diff / 3_600_000)} hr ago`
                         : ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

              return (
                <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: t.bg }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 truncate">{a.candidate_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{a.job_title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: t.bg, color: t.color }}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{ago}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
