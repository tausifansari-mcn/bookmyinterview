import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  Search, Users, Star, Briefcase, ChevronLeft, ChevronRight,
  X, Loader2, Mail, Phone, Globe, FileText, Video, MapPin, BookOpen
} from 'lucide-react'

interface Candidate {
  id: string
  full_name: string
  email: string
  experience_years: number | null
  ai_score: number | null
  profile_completion: number | null
  current_designation: string | null
  profile_photo_url: string | null
  created_at: string
  tenant_name: string
  applications_count: number
}

const SCORE_COLOR = (s: number | null) => {
  if (!s) return 'text-zinc-400'
  if (s >= 75) return 'text-emerald-600'
  if (s >= 50) return 'text-amber-600'
  return 'text-red-500'
}

function safeUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : ''
  } catch { return '' }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function SuperAdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const limit = 20

  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [detail, setDetail]                 = useState<any>(null)
  const [loadingDetail, setLoadingDetail]   = useState(false)

  function load(p = page) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (search) params.set('search', search)
    superAdminApi.get(`/candidates?${params}`)
      .then(r => { setCandidates(r.data.data.candidates ?? []); setTotal(r.data.data.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1) }, [search])
  useEffect(() => { load() }, [page])

  function openDetail(id: string) {
    setSelectedId(id)
    setDetail(null)
    setLoadingDetail(true)
    superAdminApi.get(`/candidates/${id}`)
      .then(r => setDetail(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">All Candidates</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">{total.toLocaleString()} candidates across all clients</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[14px] bg-white dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-400 text-[14px]">No candidates found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                    {['Candidate', 'Company', 'Designation', 'Experience', 'AI Score', 'Applications', 'Joined'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} onClick={() => openDetail(c.id)}
                      className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-indigo-50/40 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {c.profile_photo_url ? (
                            <img src={c.profile_photo_url} alt={c.full_name}
                              className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              {getInitials(c.full_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-zinc-800 dark:text-white truncate">{c.full_name}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {c.tenant_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-zinc-600 dark:text-zinc-300 max-w-[160px] truncate">
                        {c.current_designation ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {c.experience_years != null ? `${c.experience_years} yrs` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Star className={`h-3.5 w-3.5 ${SCORE_COLOR(c.ai_score)}`} />
                          <span className={`text-[13px] font-semibold ${SCORE_COLOR(c.ai_score)}`}>
                            {c.ai_score != null ? `${c.ai_score}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{c.applications_count}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-zinc-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-50 dark:border-zinc-800">
                <p className="text-[12px] text-zinc-400">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={e => { e.stopPropagation(); setPage(p => p - 1) }} disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[13px] text-zinc-600 px-2 font-medium">{page} / {totalPages}</span>
                  <button onClick={e => { e.stopPropagation(); setPage(p => p + 1) }} disabled={page === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* ── Candidate Detail Slide-Over ── */}
    {selectedId && (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[15px] font-bold text-zinc-900 dark:text-white">Candidate Profile</p>
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
                  style={{ background: detail.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {detail.profile_photo_url
                    ? <img src={detail.profile_photo_url} alt={detail.full_name} className="h-full w-full object-cover" />
                    : detail.full_name?.[0]?.toUpperCase()
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
                    <p className="text-[12px] font-medium text-indigo-600 mt-0.5">{detail.total_experience_years} yrs experience</p>
                  )}
                  {detail.ai_score != null && (
                    <p className="text-[12px] font-medium text-amber-600 mt-0.5 flex items-center gap-1">
                      <Star className="h-3 w-3" />{detail.ai_score}% AI Score
                    </p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-2">
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
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> Intro Recording
                  </p>
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

              {/* Experience */}
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
            </div>
          )}
        </div>
      </>
    )}
    </>
  )
}
