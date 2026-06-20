import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Building2, Users, Briefcase, FileText, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'

interface DashData {
  total_clients: number
  total_candidates: number
  total_jobs: number
  total_applications: number
  active_jobs: number
  clients_this_month: number
  monthly_trend: Array<{ month: string; clients: number; jobs: number }>
  top_clients: Array<{
    id: string; company_name: string; logo_url: string | null
    subscription_status: string; jobs: number; candidates: number; applications: number
  }>
}

export default function SuperAdminDashboardPage() {
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    superAdminApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-6">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Platform overview across all clients</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"      value={data.total_clients}      icon={Building2} accent="indigo"
          trend={{ value: data.clients_this_month, label: 'this month' }} />
        <StatCard label="Total Candidates"   value={data.total_candidates}   icon={Users}     accent="purple" />
        <StatCard label="Active Jobs"        value={data.active_jobs}        icon={Briefcase} accent="green"  />
        <StatCard label="Total Applications" value={data.total_applications} icon={FileText}  accent="amber"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Monthly Growth</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.monthly_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="clients" name="New Clients" stroke="#6366f1" fill="url(#clientGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="jobs"    name="New Jobs"    stroke="#10b981" fill="url(#jobGrad)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Top Clients by Applications</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top_clients.slice(0, 6)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="company_name" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">All Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jobs</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Candidates</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {data.top_clients.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                        {c.logo_url
                          ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                          : <Building2 className="h-3.5 w-3.5 text-indigo-400" />}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-white">{c.company_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.subscription_status} /></td>
                  <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.jobs}</td>
                  <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.candidates}</td>
                  <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-white">{c.applications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
