import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, GraduationCap, Star,
  Award, FileText, User, Calendar, RefreshCw, CheckCircle2, Clock,
} from 'lucide-react'

interface Education {
  id: string; qualification: string; degree: string; specialization: string | null
  institute: string; passing_year: number | null; percentage: number | null; cgpa: number | null
}
interface Experience {
  id: string; company_name: string; designation: string
  joining_date: string; relieving_date: string | null; is_current: number
  roles_responsibilities: string | null
}
interface Skill {
  id: string; skill_name: string; experience_years: number | null; skill_level: string
}
interface Certification {
  id: string; certification_name: string; issuing_organization: string | null
  issue_date: string | null; expiry_date: string | null
}
interface Application {
  id: string; job_title: string; job_code: string
  current_stage_name: string; status: string; applied_at: string
  total_score: number | null; recommendation: string | null
  profile_score: number | null; education_score: number | null
  experience_score: number | null; skill_score: number | null
  resume_score: number | null; assessment_score: number | null
  assessment_status: string | null; assessment_pct: number | null; assessment_passed: number | null
}
interface Candidate {
  id: string; candidate_code: string; full_name: string; email: string; mobile: string
  gender: string | null; date_of_birth: string | null
  current_location: string | null; current_company: string | null
  current_designation: string | null; experience_years: number | null
  total_experience_years: number | null; notice_period_days: number | null
  current_ctc: number | null; expected_ctc: number | null
  profile_photo_url: string | null; resume_url: string | null
  skills_summary: string | null; professional_summary: string | null
  profile_completion: number | null; source: string | null; created_at: string
  linkedin_url: string | null; github_url: string | null
  education?: Education[]; experience?: Experience[]; skills?: Skill[]
  certifications?: Certification[]; applications?: Application[]
}

const REC_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  highly_recommended: { label: 'Highly Recommended', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  recommended:        { label: 'Recommended',        color: 'text-blue-700',    bg: 'bg-blue-50' },
  review_required:    { label: 'Review Required',    color: 'text-amber-700',   bg: 'bg-amber-50' },
  not_recommended:    { label: 'Not Recommended',    color: 'text-red-700',     bg: 'bg-red-50' },
}

const SKILL_LEVEL_COLOR: Record<string, string> = {
  beginner:     'bg-gray-100 text-gray-600',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced:     'bg-indigo-50 text-indigo-700',
  expert:       'bg-violet-50 text-violet-700',
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = Number(value ?? 0)
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#ef4444' }} />
      </div>
    </div>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function formatCTC(val: number | null) {
  if (!val) return null
  return val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${(val / 1000).toFixed(0)}K`
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reEvalId, setReEvalId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/candidates/${id}`)
      .then(({ data }) => setCandidate(data.data))
      .catch((err) => {
        const status = err?.response?.status
        const msg    = err?.response?.data?.message ?? err?.message ?? 'Unknown error'
        setError(`Failed to load candidate (${status ?? 'network error'}: ${msg})`)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function reEvaluate(appId: string) {
    setReEvalId(appId)
    try {
      const { data } = await api.post(`/applications/${appId}/re-evaluate`)
      if (data.data && candidate) {
        setCandidate(prev => prev ? {
          ...prev,
          applications: (prev.applications ?? []).map(a => a.id === appId ? { ...a, ...data.data } : a)
        } : prev)
      }
    } catch { /* silent */ } finally { setReEvalId(null) }
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/candidates" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1,2,3].map(i => <div key={i} className="bg-card border rounded-xl h-64 animate-pulse" />)}
      </div>
    </div>
  )

  if (error || !candidate) return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/candidates" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-bold">Candidate Not Found</h1>
      </div>
      <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
        <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>{error || 'Candidate not found'}</p>
        <Link to="/candidates" className="text-primary text-sm mt-2 inline-block hover:underline">Back to candidates</Link>
      </div>
    </div>
  )

  const initials = candidate.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const exp = candidate.total_experience_years ?? candidate.experience_years

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/candidates" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-xl font-bold">{candidate.full_name}</h1>
          <p className="text-xs text-muted-foreground">{candidate.candidate_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Profile ── */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center gap-2">
              {candidate.profile_photo_url
                ? <img src={candidate.profile_photo_url} className="h-20 w-20 rounded-full object-cover" alt={candidate.full_name} />
                : <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{initials}</div>
              }
              <div>
                <h2 className="font-bold text-lg">{candidate.full_name}</h2>
                {candidate.current_designation && <p className="text-sm text-muted-foreground">{candidate.current_designation}</p>}
                {candidate.current_company && <p className="text-xs text-muted-foreground">{candidate.current_company}</p>}
              </div>
              {candidate.profile_completion != null && (
                <div className="w-full">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Profile completion</span><span>{candidate.profile_completion}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-1.5 bg-primary rounded-full" style={{ width: `${candidate.profile_completion}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-2 text-sm border-t pt-3">
              {candidate.mobile && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" /><span>{candidate.mobile}</span>
                </div>
              )}
              {candidate.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{candidate.email}</span>
                </div>
              )}
              {candidate.current_location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /><span>{candidate.current_location}</span>
                </div>
              )}
              {exp != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" /><span>{exp} yrs experience</span>
                </div>
              )}
              {candidate.notice_period_days != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" /><span>{candidate.notice_period_days}d notice period</span>
                </div>
              )}
            </div>

            {/* CTC */}
            {(candidate.current_ctc || candidate.expected_ctc) && (
              <div className="grid grid-cols-2 gap-2 border-t pt-3 text-center">
                {candidate.current_ctc && (
                  <div><p className="text-xs text-muted-foreground">Current CTC</p><p className="font-semibold text-sm">{formatCTC(candidate.current_ctc)}</p></div>
                )}
                {candidate.expected_ctc && (
                  <div><p className="text-xs text-muted-foreground">Expected CTC</p><p className="font-semibold text-sm">{formatCTC(candidate.expected_ctc)}</p></div>
                )}
              </div>
            )}

            {/* Links */}
            {(candidate.resume_url || candidate.linkedin_url || candidate.github_url) && (
              <div className="border-t pt-3 flex flex-wrap gap-2">
                {candidate.resume_url && (
                  <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-lg hover:bg-muted">
                    <FileText className="h-3 w-3" />Resume
                  </a>
                )}
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 border rounded-lg hover:bg-muted">LinkedIn</a>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 border rounded-lg hover:bg-muted">GitHub</a>
                )}
              </div>
            )}

            {/* Source + joined */}
            <div className="border-t pt-3 text-xs text-muted-foreground flex justify-between">
              <span>Source: <span className="capitalize">{(candidate.source ?? 'direct').replace('_', ' ')}</span></span>
              <span>Joined {new Date(candidate.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Skills */}
          {(candidate.skills ?? []).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills ?? []).map(s => (
                  <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_LEVEL_COLOR[s.skill_level] ?? 'bg-muted text-muted-foreground'}`}>
                    {s.skill_name}{s.experience_years ? ` (${s.experience_years}y)` : ''}
                  </span>
                ))}
              </div>
              {candidate.skills_summary && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{candidate.skills_summary}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Middle: Experience + Education ── */}
        <div className="space-y-4">
          {/* Professional summary */}
          {candidate.professional_summary && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{candidate.professional_summary}</p>
            </div>
          )}

          {/* Experience */}
          {(candidate.experience ?? []).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-500" />Experience</h3>
              <div className="space-y-4">
                {(candidate.experience ?? []).map(e => (
                  <div key={e.id} className="relative pl-4 border-l-2 border-muted">
                    <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="font-medium text-sm">{e.designation}</p>
                    <p className="text-sm text-muted-foreground">{e.company_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(e.joining_date)} — {e.is_current ? 'Present' : formatDate(e.relieving_date)}
                    </p>
                    {e.roles_responsibilities && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{e.roles_responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {(candidate.education ?? []).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-500" />Education</h3>
              <div className="space-y-3">
                {(candidate.education ?? []).map(e => (
                  <div key={e.id} className="relative pl-4 border-l-2 border-muted">
                    <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-violet-400" />
                    <p className="font-medium text-sm">{e.degree}{e.specialization ? ` — ${e.specialization}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{e.institute}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.passing_year ?? '—'}
                      {e.percentage ? ` · ${e.percentage}%` : ''}
                      {e.cgpa ? ` · CGPA ${e.cgpa}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {(candidate.certifications ?? []).length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" />Certifications</h3>
              <div className="space-y-2">
                {(candidate.certifications ?? []).map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{c.certification_name}</p>
                      {c.issuing_organization && <p className="text-xs text-muted-foreground">{c.issuing_organization}</p>}
                      {c.issue_date && <p className="text-xs text-muted-foreground">{formatDate(c.issue_date)}{c.expiry_date ? ` — ${formatDate(c.expiry_date)}` : ''}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Applications + Scores ── */}
        <div className="space-y-4">
          {(candidate.applications ?? []).length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No applications yet</p>
            </div>
          ) : (
            (candidate.applications ?? []).map(app => {
              const rec = app.recommendation ? REC_CONFIG[app.recommendation] : null
              const score = Number(app.total_score ?? 0)
              return (
                <div key={app.id} className="bg-card border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{app.job_title}</p>
                      <p className="text-xs text-muted-foreground">{app.job_code}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {rec && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rec.color} ${rec.bg}`}>{rec.label}</span>
                      )}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{app.current_stage_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {score > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold"
                          style={{ color: score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {score.toFixed(0)}%
                        </span>
                        <button onClick={() => reEvaluate(app.id)} disabled={reEvalId === app.id}
                          className="text-muted-foreground hover:text-primary disabled:opacity-40" title="Re-evaluate">
                          <RefreshCw className={`h-3 w-3 ${reEvalId === app.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {score > 0 && (
                    <div className="space-y-1.5 mb-3">
                      <ScoreBar label="Profile (25%)"    value={app.profile_score} />
                      <ScoreBar label="Education (15%)"  value={app.education_score} />
                      <ScoreBar label="Experience (20%)" value={app.experience_score} />
                      <ScoreBar label="Skills (20%)"     value={app.skill_score} />
                      <ScoreBar label="Resume (10%)"     value={app.resume_score} />
                      <ScoreBar label="Assessment (10%)" value={app.assessment_score} />
                    </div>
                  )}

                  {app.assessment_status && (
                    <div className={`rounded-lg px-3 py-2 text-xs ${
                      app.assessment_status === 'completed'
                        ? app.assessment_passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      Assessment:{' '}
                      {app.assessment_status === 'completed'
                        ? `${app.assessment_pct != null ? Number(app.assessment_pct).toFixed(0) : 0}% — ${app.assessment_passed ? 'Passed' : 'Failed'}`
                        : app.assessment_status === 'invited' ? 'Invite sent — awaiting candidate'
                        : app.assessment_status === 'started' ? 'In progress'
                        : 'Expired'}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
