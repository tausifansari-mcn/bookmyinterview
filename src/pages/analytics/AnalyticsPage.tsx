import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Overview {
  time_to_hire: number | null
  offer_acceptance_rate: number
  hired_this_month: number
  total_applications: number
}
interface TrendItem  { month: string; applied: number; joined: number }
interface SourceItem { name: string; value: number }
interface FunnelItem { stage: string; count: number }

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e0e7ff', '#f0f4ff', '#f8f9ff']

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [trend,    setTrend]    = useState<TrendItem[]>([])
  const [sources,  setSources]  = useState<SourceItem[]>([])
  const [funnel,   setFunnel]   = useState<FunnelItem[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/trend'),
      api.get('/analytics/sources'),
      api.get('/analytics/funnel'),
    ]).then(([ov, tr, sr, fn]) => {
      setOverview(ov.data.data)
      setTrend(tr.data.data)
      setSources(sr.data.data)
      setFunnel(fn.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const kpiCards = overview ? [
    {
      label: 'Time to Hire (avg)',
      value: overview.time_to_hire != null ? `${overview.time_to_hire} days` : '—',
    },
    {
      label: 'Offer Acceptance Rate',
      value: `${overview.offer_acceptance_rate}%`,
    },
    {
      label: 'Hired This Month',
      value: String(overview.hired_this_month),
    },
    {
      label: 'Total Applications',
      value: overview.total_applications.toLocaleString(),
    },
  ] : []

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-4 h-20 animate-pulse" />
            ))
          : kpiCards.map(s => (
              <div key={s.label} className="bg-card border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Hiring Trend */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Monthly Hiring Trend</h2>
          {loading ? (
            <div className="h-52 animate-pulse bg-muted rounded" />
          ) : trend.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No trend data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="applied" fill="#6366f1" radius={[4,4,0,0]} name="Applied" />
                <Bar dataKey="joined"  fill="#10b981" radius={[4,4,0,0]} name="Joined" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Candidate Source Mix */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Candidate Source Mix</h2>
          {loading ? (
            <div className="h-52 animate-pulse bg-muted rounded" />
          ) : sources.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No source data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sources} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pipeline Funnel */}
      {!loading && funnel.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Hiring Pipeline Funnel</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" width={160} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [v, 'Candidates']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
