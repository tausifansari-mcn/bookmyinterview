import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { FileText, Briefcase, Users, Building2, Trophy, TrendingUp } from 'lucide-react'

interface Analytics {
  totals: {
    applications: number
    jobs: number
    candidates: number
    tenants: number
    offers: number
    hired: number
  }
  app_trend: { month: string; applications: number; jobs: number; candidates: number }[]
  top_tenants: { id: string; company_name: string; subscription_status: string; jobs: number; applications: number; candidates: number }[]
  plan_breakdown: { plan: string; count: number }[]
}

const PLAN_COLORS: Record<string, string> = {
  starter:    '#6366f1',
  growth:     '#f59e0b',
  enterprise: '#10b981',
  white_label:'#8b5cf6',
}

const STATUS_CLS: Record<string, string> = {
  trial:     'bg-amber-50 text-amber-600',
  active:    'bg-emerald-50 text-emerald-600',
  suspended: 'bg-red-50 text-red-500',
  expired:   'bg-slate-100 text-slate-400',
}

export default function SuperAdminAnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superAdminApi.get('/analytics')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Total Applications', value: data?.totals.applications, icon: FileText,  color: '#6366f1', bg: '#eef2ff' },
    { label: 'Total Jobs',         value: data?.totals.jobs,         icon: Briefcase, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Total Candidates',   value: data?.totals.candidates,   icon: Users,     color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Active Clients',     value: data?.totals.tenants,      icon: Building2, color: '#10b981', bg: '#d1fae5' },
    { label: 'Offers Made',        value: data?.totals.offers,       icon: Trophy,    color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Hired',              value: data?.totals.hired,        icon: TrendingUp,color: '#ec4899', bg: '#fce7f3' },
  ]

  const Skeleton = ({ h = 'h-48' }: { h?: string }) => (
    <div className={`${h} bg-slate-50 rounded-xl animate-pulse`} />
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Aggregated metrics across all clients</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: k.bg }}>
              <k.icon style={{ width: 16, height: 16, color: k.color }} />
            </div>
            <p className="text-[24px] font-bold text-slate-900 leading-none">
              {loading ? '—' : (k.value ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-[14px] font-bold text-slate-900 mb-4">12-Month Platform Trend</h2>
        {loading ? <Skeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.app_trend ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {[['apps', '#6366f1'], ['jobs', '#f59e0b'], ['cands', '#10b981']].map(([id, c]) => (
                  <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#g-apps)" strokeWidth={2} />
              <Area type="monotone" dataKey="jobs"         name="Jobs"         stroke="#f59e0b" fill="url(#g-jobs)" strokeWidth={2} />
              <Area type="monotone" dataKey="candidates"   name="Candidates"   stroke="#10b981" fill="url(#g-cands)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Top tenants bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Top Clients by Activity</h2>
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.top_tenants ?? []} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="company_name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[0,4,4,0]} />
                <Bar dataKey="jobs"         name="Jobs"         fill="#f59e0b" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan breakdown pie */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Plan Distribution</h2>
          {loading ? <Skeleton /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.plan_breakdown ?? []} dataKey="count" nameKey="plan"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {(data?.plan_breakdown ?? []).map(entry => (
                      <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {(data?.plan_breakdown ?? []).map(p => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: PLAN_COLORS[p.plan] ?? '#94a3b8' }} />
                      <span className="text-[12px] text-slate-600 capitalize">{p.plan}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-800">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top tenants table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="text-[14px] font-bold text-slate-900">Client Performance Table</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse"/>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Company','Plan','Jobs','Candidates','Applications'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.top_tenants ?? []).map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {t.company_name[0]?.toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-slate-800">{t.company_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[t.subscription_status] ?? ''}`}>
                        {t.subscription_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{t.jobs}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{t.candidates}</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-700">{t.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
