import { BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const sourceData = [
  { name: 'Walk-in',  value: 42 }, { name: 'Naukri', value: 28 },
  { name: 'Referral', value: 15 }, { name: 'LinkedIn', value: 10 }, { name: 'Campus', value: 5 },
]
const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

const monthData = [
  { month: 'Jan', applied: 120, joined: 18 }, { month: 'Feb', applied: 98,  joined: 14 },
  { month: 'Mar', applied: 145, joined: 22 }, { month: 'Apr', applied: 132, joined: 19 },
  { month: 'May', applied: 160, joined: 28 }, { month: 'Jun', applied: 89,  joined: 15 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Time to Hire (avg)',     value: '6.2 days' },
          { label: 'Offer Acceptance Rate',  value: '74%' },
          { label: 'Cost per Hire',          value: '₹1,240' },
          { label: '90-Day Retention',       value: '82%' },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Monthly Hiring Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="applied" fill="#6366f1" radius={[4,4,0,0]} name="Applied" />
              <Bar dataKey="joined" fill="#10b981" radius={[4,4,0,0]} name="Joined" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Source Mix</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
