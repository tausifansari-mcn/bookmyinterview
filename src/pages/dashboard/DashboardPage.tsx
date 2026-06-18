import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Users, Briefcase, Calendar, TrendingUp, Clock, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

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

interface FunnelItem { stage: string; count: number }
interface TrendItem  { week: string; applications: number; shortlisted: number }
interface ActivityItem {
  type: string; candidate_name: string; job_title: string; action_at: string
}

const STAGE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [funnel, setFunnel] = useState<FunnelItem[]>([])
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

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
    { label: 'Active Jobs',       icon: Briefcase,      value: stats.active_jobs,         sub: `${stats.total_applications} total applications`,  color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Total Candidates',  icon: Users,           value: stats.total_candidates,    sub: `+${stats.applications_this_week} this week`,      color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Interviews Today',  icon: Calendar,        value: stats.interviews_today,    sub: `${stats.interviews_pending} pending`,             color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Offers Sent',       icon: TrendingUp,      value: stats.offers_sent,         sub: `${stats.offers_accepted} accepted`,               color: 'text-green-600',  bg: 'bg-green-50' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your hiring pipeline at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-4 animate-pulse h-24" />
            ))
          : statCards.map(s => (
              <div key={s.label} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <span className={`p-1.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </span>
                </div>
                <p className="text-2xl font-bold">{s.value?.toLocaleString() ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
            ))}
      </div>

      {/* Quick Actions Banner */}
      {stats && (stats.pending_assessments > 0 || stats.shortlisted > 0) && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6" />
            <div>
              <p className="font-semibold">Action Required</p>
              <p className="text-sm text-white/80">
                {stats.pending_assessments > 0 && `${stats.pending_assessments} assessments pending review`}
                {stats.pending_assessments > 0 && stats.shortlisted > 0 && ' · '}
                {stats.shortlisted > 0 && `${stats.shortlisted} candidates shortlisted for interview`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Hiring Funnel (This Month)</h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-muted rounded" />
          ) : funnel.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [v, 'Candidates']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnel.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No pipeline data yet
            </div>
          )}
        </div>

        {/* Application Trend */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Application Trend (Last 4 Weeks)</h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-muted rounded" />
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="shortlisted" name="Shortlisted" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No trend data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activity.map((a, i) => {
              const Icon = a.type === 'shortlisted' ? CheckCircle2
                : a.type === 'rejected'    ? XCircle
                : a.type === 'interview'   ? Calendar
                : Users
              const color = a.type === 'shortlisted' ? 'text-green-500'
                : a.type === 'rejected'   ? 'text-red-500'
                : a.type === 'interview'  ? 'text-blue-500'
                : 'text-violet-500'
              const ts = new Date(a.action_at)
              const diff = Date.now() - ts.getTime()
              const ago = diff < 3600000 ? `${Math.floor(diff / 60000)} min ago`
                : diff < 86400000 ? `${Math.floor(diff / 3600000)} hr ago`
                : ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.candidate_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.job_title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {ago}
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
