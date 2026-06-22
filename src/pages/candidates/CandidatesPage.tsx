import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Search, Users, ArrowUpRight } from 'lucide-react'

interface Candidate {
  id: string
  candidate_code: string
  full_name: string
  email: string
  mobile: string
  experience_years: number | null
  current_location: string | null
  current_designation: string | null
  profile_photo_url: string | null
  source: string | null
  profile_completion: number | null
  created_at: string
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) return (
    <img src={photo} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" alt={name} />
  )
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
      {initials}
    </div>
  )
}

const SOURCE_BADGE: Record<string, string> = {
  linkedin:  'badge badge-blue',
  naukri:    'badge badge-amber',
  referral:  'badge badge-green',
  direct:    'badge badge-gray',
  portal:    'badge badge-indigo',
  other:     'badge badge-gray',
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium text-slate-500">{pct}%</span>
    </div>
  )
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/candidates', {
        params: { search: search || undefined, limit: 50 },
      })
      setCandidates(data.data)
      setTotal(data.total ?? data.data.length)
    } catch { setCandidates([]) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-sub">{total.toLocaleString()} in talent pool</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md
                      focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-500/10 transition-all">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm bmi-table">
          <thead>
            <tr>
              {['Candidate', 'Contact', 'Role & Location', 'Profile', 'Source', 'Joined', ''].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? 140 : 80 }} /></td>
                  ))}
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No candidates found</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {search ? 'Try a different search term' : 'Candidates will appear here when they register'}
                  </p>
                </td>
              </tr>
            ) : candidates.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.full_name} photo={c.profile_photo_url} />
                    <div className="min-w-0">
                      <Link to={`/candidates/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate block text-[13px]">
                        {c.full_name}
                      </Link>
                      <p className="text-[11px] text-slate-400">{c.candidate_code}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <p className="text-[13px] text-slate-700">{c.mobile}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{c.email}</p>
                </td>
                <td>
                  <p className="text-[13px] text-slate-700">{c.current_designation ?? '—'}</p>
                  <p className="text-[11px] text-slate-400">{c.current_location ?? '—'} {c.experience_years != null && `· ${c.experience_years} yrs`}</p>
                </td>
                <td>
                  {c.profile_completion != null
                    ? <CompletionBar pct={c.profile_completion} />
                    : <span className="text-slate-300">—</span>}
                </td>
                <td>
                  <span className={SOURCE_BADGE[c.source ?? 'direct'] ?? 'badge badge-gray'}>
                    {(c.source ?? 'direct').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="text-[12px] text-slate-400 whitespace-nowrap">
                  {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <Link to={`/candidates/${c.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    View <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
