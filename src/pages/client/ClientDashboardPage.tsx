import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientApi } from '@/lib/clientApi'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Briefcase, Users, FileText, CalendarCheck, Plus, ArrowRight, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'

interface DashData {
  active_jobs: number
  total_candidates: number
  total_applications: number
  this_week_applications: number
  interviews_scheduled: number
  offers_sent: number
  shortlisted: number
  applications_trend: Array<{ week: string; applications: number }>
  top_jobs: Array<{ id: string; title: string; status: string; application_count: number }>
  stage_breakdown: Array<{ stage: string; count: number }>
}

export default function ClientDashboardPage() {
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    clientApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Your hiring activity at a glance</p>
        </div>
        <Link
          to="/client/jobs"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Jobs"        value={data.active_jobs}          icon={Briefcase}     accent="indigo" />
        <StatCard label="Total Candidates" value={data.total_candidates}     icon={Users}         accent="purple" />
        <StatCard label="Applications"     value={data.total_applications}   icon={FileText}      accent="amber"
          trend={{ value: data.this_week_applications, label: 'this week' }} />
        <StatCard label="Interviews"       value={data.interviews_scheduled} icon={CalendarCheck} accent="green"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Applications Over Time</h2>
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
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.stage_breakdown} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: '#a1a1aa' }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Top Jobs</h2>
            <Link to="/client/jobs" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {data.top_jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{job.title}</p>
                  <div className="mt-0.5"><StatusBadge status={job.status} /></div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{job.application_count}</p>
                  <p className="text-xs text-zinc-400">applicants</p>
                </div>
              </div>
            ))}
            {data.top_jobs.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">No jobs posted yet</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {([
              { label: 'Post a New Job',       to: '/client/jobs',         icon: Briefcase     },
              { label: 'Review Applications',  to: '/client/applications', icon: FileText      },
              { label: 'Browse Candidates',    to: '/client/candidates',   icon: Users         },
              { label: 'Manage Assessments',   to: '/client/assessments',  icon: CalendarCheck },
            ] as const).map(a => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
              >
                <a.icon className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{a.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-400 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
