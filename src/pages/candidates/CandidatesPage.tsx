import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Upload, Sparkles, User } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

const candidates = [
  { id: '1', name: 'Rahul Sharma',   email: 'rahul@gmail.com',  mobile: '9876543210', source: 'walk_in',  ai_score: 82, experience: 2.5, location: 'Mumbai',    stage: 'HR Round', applied: '2026-06-14' },
  { id: '2', name: 'Priya Mehta',    email: 'priya@gmail.com',  mobile: '9876543211', source: 'naukri',   ai_score: 75, experience: 1.5, location: 'Pune',      stage: 'Applied',  applied: '2026-06-15' },
  { id: '3', name: 'Amit Kumar',     email: 'amit@gmail.com',   mobile: '9876543212', source: 'referral', ai_score: 91, experience: 3,   location: 'Delhi',     stage: 'Ops Round', applied: '2026-06-13' },
  { id: '4', name: 'Sneha Patel',    email: 'sneha@gmail.com',  mobile: '9876543213', source: 'linkedin', ai_score: 68, experience: 0.5, location: 'Bangalore', stage: 'Applied',  applied: '2026-06-16' },
  { id: '5', name: 'Vikram Singh',   email: 'vikram@gmail.com', mobile: '9876543214', source: 'campus',   ai_score: 88, experience: 4,   location: 'Mumbai',    stage: 'Offer',    applied: '2026-06-10' },
]

const scoreColor = (score: number) =>
  score >= 80 ? 'text-green-700 bg-green-50' : score >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'

export default function CandidatesPage() {
  const [search, setSearch] = useState('')
  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm">{candidates.length} in talent pool</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm border px-3 py-2 rounded-lg hover:bg-accent">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90">
            <User className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or mobile…" className="flex-1 text-sm bg-transparent outline-none" />
        </div>
        <button className="flex items-center gap-1.5 text-sm border px-3 py-2 rounded-lg hover:bg-accent">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              {['Candidate', 'Contact', 'Experience', 'Stage', 'AI Score', 'Source', 'Applied', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                      {getInitials(c.name)}
                    </div>
                    <Link to={`/candidates/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{c.mobile}</p>
                  <p className="text-xs">{c.email}</p>
                </td>
                <td className="px-4 py-3">{c.experience} yrs · {c.location}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{c.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full w-fit font-semibold ${scoreColor(c.ai_score)}`}>
                    <Sparkles className="h-3 w-3" />{c.ai_score}%
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{c.source.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.applied)}</td>
                <td className="px-4 py-3">
                  <Link to={`/candidates/${c.id}`} className="text-xs text-primary font-medium hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
