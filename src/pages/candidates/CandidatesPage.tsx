import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Search, User } from 'lucide-react'

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
  if (photo) return <img src={photo} className="h-8 w-8 rounded-full object-cover" alt={name} />
  const i = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-primary">{i}</span>
    </div>
  )
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/candidates', { params: { search: search || undefined, limit: 50 } })
      setCandidates(data.data)
      setTotal(data.total ?? data.data.length)
    } catch { setCandidates([]) } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm">{total} in talent pool</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile..."
            className="flex-1 text-sm bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              {['Candidate','Contact','Experience','Designation','Profile','Source','Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td>
                  ))}
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2" />No candidates found
              </td></tr>
            ) : candidates.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.full_name} photo={c.profile_photo_url} />
                    <div>
                      <Link to={`/candidates/${c.id}`} className="font-medium hover:text-primary">{c.full_name}</Link>
                      <p className="text-xs text-muted-foreground">{c.candidate_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{c.mobile}</p>
                  <p className="text-xs">{c.email}</p>
                </td>
                <td className="px-4 py-3">{c.experience_years != null ? `${c.experience_years} yrs` : '—'} · {c.current_location ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.current_designation ?? '—'}</td>
                <td className="px-4 py-3">
                  {c.profile_completion != null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                        <div className="h-1.5 bg-primary rounded-full" style={{ width: `${c.profile_completion}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.profile_completion}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{(c.source ?? 'direct').replace('_', ' ')}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
