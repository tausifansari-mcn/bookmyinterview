import { useEffect, useState } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  Search, Medal, Star, X, Loader2,
  Mail, Phone, Globe, FileText, BookOpen, User, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface Candidate {
  id: string
  rank: number
  full_name: string
  email: string
  experience_years: number | null
  ai_score: number | null
  assessment_avg: number
  experience_score: number
  overall_score: number
  profile_photo_url: string | null
  current_designation: string | null
  current_company: string | null
  applied_jobs: string | null
  current_stage: string | null
}

function safeUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : ''
  } catch { return '' }
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 20
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const dash = (pct / 100) * c
  return (
    <svg width="52" height="52" className="shrink-0 -rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" fill="currentColor" fontSize="10" fontWeight="700"
        transform="rotate(90, 26, 26)">
        {Math.round(pct)}
      </text>
    </svg>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0"
      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
      <Medal className="h-4 w-4 text-white" />
    </div>
  )
  if (rank === 2) return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0"
      style={{ background: 'linear-gradient(135deg, #94a3b8, #64748b)', boxShadow: '0 2px 8px rgba(100,116,139,0.3)' }}>
      <span className="text-white text-[11px] font-bold">#2</span>
    </div>
  )
  if (rank === 3) return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0"
      style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}>
      <span className="text-white text-[11px] font-bold">#3</span>
    </div>
  )
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 shrink-0">
      <span className="text-zinc-500 text-[11px] font-bold">#{rank}</span>
    </div>
  )
}

const STAGE_COLORS: Record<string, string> = {
  'Application Received': 'bg-blue-50 text-blue-600',
  'Shortlisted':          'bg-amber-50 text-amber-600',
  'Interview Scheduled':  'bg-purple-50 text-purple-600',
  'Offer Made':           'bg-green-50 text-green-600',
  'Rejected':             'bg-red-50 text-red-500',
}

export default function ClientCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [total, setTotal]           = useState(0)

  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [detail, setDetail]               = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    clientApi.get(`/candidates?${params}`)
      .then(r => {
        setCandidates(r.data.data.candidates ?? [])
        setTotal(r.data.data.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  function openDetail(id: string) {
    setSelectedId(id)
    setDetail(null)
    setLoadingDetail(true)
    clientApi.get(`/candidates/${id}`)
      .then(r => setDetail(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }

  return (
    <>
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Candidates</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {total > 0 ? `${total} candidates ranked by AI match + assessment scores` : 'AI-ranked talent pool'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span>AI Match (40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
          <span>Assessment (40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span>Experience (20%)</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Star className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">No candidates yet</p>
          <p className="text-zinc-400 text-[13px] mt-1">Candidates will appear here once they apply for your jobs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(c => (
            <button key={c.id} onClick={() => openDetail(c.id)}
              className={cn(
                'w-full text-left bg-white dark:bg-zinc-900 rounded-xl border shadow-sm p-5 transition-all hover:shadow-md hover:scale-[1.005]',
                c.rank === 1 ? 'border-amber-200 dark:border-zinc-800 ring-1 ring-amber-100' :
                c.rank === 2 ? 'border-zinc-200 dark:border-zinc-800' :
                c.rank === 3 ? 'border-orange-100' : 'border-zinc-100 dark:border-zinc-800',
              )}>
              <div className="flex items-start gap-4">
                <div className="pt-0.5 shrink-0">
                  <RankBadge rank={c.rank} />
                </div>
                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 ring-2 ring-zinc-100">
                  {c.profile_photo_url ? (
                    <img src={c.profile_photo_url} alt={c.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: c.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {getInitials(c.full_name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{c.full_name}</p>
                    {c.current_stage && (
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        STAGE_COLORS[c.current_stage] ?? 'bg-zinc-100 text-zinc-500'
                      )}>
                        {c.current_stage}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{c.email}</p>
                  {(c.current_designation || c.current_company) && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {[c.current_designation, c.current_company].filter(Boolean).join(' at ')}
                    </p>
                  )}
                  {c.experience_years != null && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{c.experience_years} yrs experience</p>
                  )}
                  {c.applied_jobs && (
                    <p className="text-[11px] text-zinc-400 mt-1 truncate">Applied for: {c.applied_jobs}</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="hidden sm:flex flex-col gap-1.5 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="h-1.5 w-12 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${c.ai_score ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 w-6 text-right">{Math.round(c.ai_score ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="h-1.5 w-12 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${c.assessment_avg}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 w-6 text-right">{Math.round(c.assessment_avg)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="h-1.5 w-12 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${c.experience_score}%` }} />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 w-6 text-right">{Math.round(c.experience_score)}</span>
                    </div>
                  </div>
                  <ScoreRing
                    score={c.overall_score}
                    color={c.rank === 1 ? '#f59e0b' : c.rank === 2 ? '#94a3b8' : c.rank === 3 ? '#f97316' : '#6366f1'}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>

    {/* ── Candidate Detail Slide-Over ── */}
    {selectedId && (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col">

          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-white">Candidate Profile</p>
            <button onClick={() => setSelectedId(null)}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center flex-1 text-zinc-400 text-[13px]">
              Failed to load candidate profile
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Avatar + name */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-white text-[22px] font-bold"
                  style={{ background: detail.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  {detail.profile_photo_url
                    ? <img src={detail.profile_photo_url} alt={detail.full_name} className="h-full w-full object-cover" />
                    : (detail.full_name?.[0]?.toUpperCase() ?? <User className="h-6 w-6" />)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white">{detail.full_name}</h3>
                  {detail.current_designation && (
                    <p className="text-[13px] text-zinc-600">
                      {detail.current_designation}{detail.current_company ? ` @ ${detail.current_company}` : ''}
                    </p>
                  )}
                  {detail.current_location && (
                    <p className="text-[12px] text-zinc-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{detail.current_location}
                    </p>
                  )}
                  {detail.total_experience_years != null && (
                    <p className="text-[12px] font-medium text-amber-600 mt-0.5">{detail.total_experience_years} yrs experience</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-3">
                {detail.email && (
                  <a href={`mailto:${detail.email}`}
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-indigo-600 transition-colors">
                    <Mail className="h-3.5 w-3.5" />{detail.email}
                  </a>
                )}
                {detail.mobile && (
                  <a href={`tel:${detail.mobile}`}
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-indigo-600 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{detail.mobile}
                  </a>
                )}
                {safeUrl(detail.linkedin_url) && (
                  <a href={safeUrl(detail.linkedin_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-indigo-600 transition-colors">
                    <Globe className="h-3.5 w-3.5" />LinkedIn
                  </a>
                )}
                {safeUrl(detail.github_url) && (
                  <a href={safeUrl(detail.github_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-indigo-600 transition-colors">
                    <BookOpen className="h-3.5 w-3.5" />GitHub
                  </a>
                )}
              </div>

              {/* Resume */}
              {safeUrl(detail.resume_url) && (
                <a href={safeUrl(detail.resume_url)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                  <FileText className="h-4 w-4" />View Resume
                </a>
              )}

              {/* Voice / Video intro */}
              {safeUrl(detail.voice_intro_url) && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Intro Recording</p>
                  {/\.(mp4|webm|ogg|mov)(\?|$)/i.test(detail.voice_intro_url) ? (
                    <video controls src={safeUrl(detail.voice_intro_url)} className="w-full rounded-xl max-h-56 bg-black" />
                  ) : (
                    <audio controls src={safeUrl(detail.voice_intro_url)} className="w-full" />
                  )}
                  {detail.voice_intro_duration && (
                    <p className="text-[11px] text-zinc-400 mt-1">{Math.round(detail.voice_intro_duration)}s</p>
                  )}
                </div>
              )}

              {/* Skills */}
              {(detail.skills as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(detail.skills as any[]).map((s: any, i: number) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-indigo-50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {s.skill_name}
                        {s.skill_level && <span className="text-[10px] text-indigo-400">· {s.skill_level}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional summary */}
              {detail.professional_summary && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Professional Summary</p>
                  <p className="text-[13px] text-zinc-700 leading-relaxed">{detail.professional_summary}</p>
                </div>
              )}

              {/* Work experience */}
              {(detail.experience as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Work Experience</p>
                  <div className="space-y-3">
                    {(detail.experience as any[]).map((ex: any, i: number) => (
                      <div key={i} className="border-l-2 border-indigo-200 pl-4">
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{ex.designation}</p>
                        <p className="text-[12px] text-zinc-600">{ex.company_name}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {ex.joining_date ? new Date(ex.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                          {' – '}
                          {ex.is_current ? 'Present' : (ex.relieving_date ? new Date(ex.relieving_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '')}
                        </p>
                        {ex.roles_responsibilities && (
                          <p className="text-[12px] text-zinc-600 mt-1 leading-relaxed">{ex.roles_responsibilities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {(detail.education as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Education</p>
                  <div className="space-y-2">
                    {(detail.education as any[]).map((ed: any, i: number) => (
                      <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{ed.degree}{ed.specialization ? ` — ${ed.specialization}` : ''}</p>
                        <p className="text-[12px] text-zinc-600">{ed.institute}</p>
                        {(ed.passing_year || ed.percentage) && (
                          <p className="text-[11px] text-zinc-400 mt-0.5">{ed.passing_year}{ed.percentage ? ` · ${ed.percentage}%` : ''}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessments */}
              {(detail.assessments as any[] ?? []).filter((a: any) => a.status === 'completed').length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Assessment Results</p>
                  <div className="space-y-2">
                    {(detail.assessments as any[]).filter((a: any) => a.status === 'completed').map((a: any, i: number) => (
                      <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{a.assessment_title}</p>
                          {a.job_title && <p className="text-[11px] text-zinc-400">{a.job_title}</p>}
                          {a.time_taken_secs != null && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {Math.round(a.time_taken_secs / 60)} min · {a.scored_marks}/{a.total_marks} marks
                            </p>
                          )}
                        </div>
                        {a.percentage != null && (
                          <span className={cn('shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full', a.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                            {Math.round(a.percentage)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    )}
    </>
  )
}
