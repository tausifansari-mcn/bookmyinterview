import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Users, Briefcase, Calendar, TrendingUp, Sparkles, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const stats = [
  { label: 'Active Jobs',       icon: Briefcase,   value: '24',  change: '+3 this week',  color: 'text-blue-600',  bg: 'bg-blue-50' },
  { label: 'Total Candidates',  icon: Users,        value: '1,284', change: '+89 this week', color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Interviews Today',  icon: Calendar,     value: '18',  change: '4 pending',     color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Offers Sent',       icon: TrendingUp,   value: '7',   change: '2 accepted',    color: 'text-green-600', bg: 'bg-green-50' },
]

const funnelData = [
  { stage: 'Applied', count: 320 },
  { stage: 'Screened', count: 180 },
  { stage: 'Interview', count: 95 },
  { stage: 'Offer', count: 28 },
  { stage: 'Joined', count: 18 },
]

const trendData = [
  { week: 'W1', applications: 65, joined: 8 },
  { week: 'W2', applications: 82, joined: 12 },
  { week: 'W3', applications: 74, joined: 9 },
  { week: 'W4', applications: 99, joined: 15 },
]

const recentActivity = [
  { type: 'shortlisted', name: 'Rahul Sharma',   job: 'Sr. Customer Care Exec',   time: '10 min ago',  icon: CheckCircle2, color: 'text-green-500' },
  { type: 'rejected',    name: 'Priya Mehta',    job: 'Team Leader',               time: '25 min ago',  icon: XCircle,      color: 'text-red-500' },
  { type: 'interview',   name: 'Amit Verma',     job: 'Quality Analyst',           time: '1 hr ago',    icon: Calendar,     color: 'text-blue-500' },
  { type: 'applied',     name: 'Sneha Patel',    job: 'Process Manager',           time: '2 hr ago',    icon: Users,        color: 'text-violet-500' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your hiring pipeline at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <span className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.change}</p>
          </div>
        ))}
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 rounded-xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6" />
          <div>
            <p className="font-semibold">AI Screening Available</p>
            <p className="text-sm text-white/80">14 new applications waiting for AI match scoring</p>
          </div>
        </div>
        <button className="bg-white text-primary font-medium text-sm px-4 py-2 rounded-lg hover:bg-white/90">
          Run AI Screen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Hiring Funnel (This Month)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" width={70} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(243,75%,59%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Application Trend (Last 4 Weeks)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="hsl(243,75%,59%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="joined" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
              <a.icon className={`h-4 w-4 ${a.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.job}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {a.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
