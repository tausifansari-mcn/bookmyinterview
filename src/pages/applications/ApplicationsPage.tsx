import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  Users, Briefcase, CheckCircle2, XCircle, Calendar, FileText, Search, RefreshCw, X, ClipboardList,
} from 'lucide-react'

interface Application {
  id: string
  current_stage_name: string
  applied_at: string
  notes: string | null
  full_name: string
  email: string
  mobile: string
  current_designation: string | null
  experience_years: number | null
  current_location: string | null
  profile_photo_url: string | null
  resume_url: string | null
  skills_summary: string | null
  job_title: string
  job_code: string
  total_score: number | null
  recommendation: string | null
  profile_score: number | null
  education_score: number | null
  experience_score: number | null
  skill_score: number | null
  resume_score: number | null
  assessment_score: number | null
  assessment_status: string | null
  assessment_pct: number | null
  assessment_passed: number | null
}

const REC_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  highly_recommended: { label: 'Highly Recommended', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  recommended:        { label: 'Recommended',        color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  review_required:    { label: 'Review Required',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  not_recommended:    { label: 'Not Recommended',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
}

const STAGES = ['All','Application Received','Assessment Pending','Shortlisted','Interview Scheduled','Selected','Offer Sent','Joined','Rejected','On Hold']

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ?? 0
  return (
    <div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  )
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) return <img src={photo} className="h-10 w-10 rounded-full object-cover shrink-0" alt={name} />
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-primary">{initials}</span>
    </div>
  )
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('All')
  const [recFilter, setRecFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('')
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState<{ id: string; title: string; job_code: string }[]>([])
  const [interviewModal, setInterviewModal] = useState<Application | null>(null)
  const [interviewForm, setInterviewForm] = useState({
    round_name: 'HR Round', interview_type: 'hr', mode: 'online', scheduled_at: '', meeting_link: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [actionDropdown, setActionDropdown] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (stageFilter !== 'All') params.stage = stageFilter
      if (recFilter !== 'all') params.recommendation = recFilter
      if (jobFilter) params.job_id = jobFilter
      const { data } = await api.get('/applications', { params })
      let rows = data.data as Application[]
      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter(a => a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q))
      }
      setApps(rows)
      setTotal(data.total ?? rows.length)
    } catch { setApps([]) } finally { setLoading(false) }
  }, [stageFilter, recFilter, jobFilter, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.get('/jobs').then(({ data }) => setJobs(data.data)).catch(() => {}) }, [])

  async function moveStage(id: string, stage: string) {
    try {
      await api.patch(`/applications/${id}/stage`, { stage })
      setApps(prev => prev.map(a => a.id === id ? { ...a, current_stage_name: stage } : a))
      setActionDropdown(null)
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Failed') }
  }

  async function scheduleInterview() {
    if (!interviewModal || !interviewForm.scheduled_at) return
    setSubmitting(true)
    try {
      await api.post(`/applications/${interviewModal.id}/interview`, interviewForm)
      setApps(prev => prev.map(a => a.id === interviewModal.id ? { ...a, current_stage_name: 'Interview Scheduled' } : a))
      setInterviewModal(null)
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Failed') } finally { setSubmitting(false) }
  }

  async function sendAssessment(id: string) {
    try {
      const { data } = await api.post(`/assessments/invite/${id}`)
      alert(data.message)
      load()
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Failed to send assessment invite') }
  }

  async function reEvaluate(id: string) {
    try {
      const { data } = await api.post(`/applications/${id}/re-evaluate`)
      const ev = data.data
      if (!ev) return
      setApps(prev => prev.map(a => a.id === id ? {
        ...a,
        total_score: ev.total_score, recommendation: ev.recommendation,
        profile_score: ev.profile_score, education_score: ev.education_score,
        experience_score: ev.experience_score, skill_score: ev.skill_score,
        resume_score: ev.resume_score,
      } : a))
    } catch { alert('Re-evaluation failed') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-muted-foreground text-sm">{total} total applicants</p>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Search candidate or job..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={recFilter} onChange={e => setRecFilter(e.target.value)}>
          <option value="all">All Recommendations</option>
          <option value="highly_recommended">Highly Recommended</option>
          <option value="recommended">Recommended</option>
          <option value="review_required">Review Required</option>
          <option value="not_recommended">Not Recommended</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
          <option value="">All Jobs</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.job_code} — {j.title}</option>)}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : apps.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => {
            const rec = app.recommendation ? REC_CONFIG[app.recommendation] : null
            const score = app.total_score ?? 0
            return (
              <div key={app.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={app.full_name} photo={app.profile_photo_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold">{app.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.current_designation ?? 'Not specified'} · {app.experience_years ?? '?'} yrs · {app.current_location ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rec && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${rec.color} ${rec.bg} ${rec.border}`}>
                            {rec.label}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {app.current_stage_name}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      <Briefcase className="inline h-3 w-3 mr-1" />
                      {app.job_title} ({app.job_code}) · Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Overall Match</span>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold" style={{ color: score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {score > 0 ? `${score.toFixed(0)}%` : '—'}
                            </span>
                            <button onClick={() => reEvaluate(app.id)} className="text-muted-foreground hover:text-primary" title="Re-evaluate">
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {score > 0 && (
                          <div className="space-y-1.5">
                            <ScoreBar label="Profile (25%)"     value={app.profile_score} />
                            <ScoreBar label="Education (15%)"   value={app.education_score} />
                            <ScoreBar label="Experience (20%)"  value={app.experience_score} />
                            <ScoreBar label="Skills (20%)"      value={app.skill_score} />
                            <ScoreBar label="Resume (10%)"      value={app.resume_score} />
                            <ScoreBar label="Assessment (10%)"  value={app.assessment_score} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {app.assessment_status && (
                          <div className={`rounded-lg p-3 text-sm ${
                            app.assessment_status === 'completed'
                              ? app.assessment_passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                              : 'bg-amber-50 border border-amber-200'
                          }`}>
                            <p className="font-medium text-xs mb-0.5">Assessment</p>
                            <p className={app.assessment_status === 'completed' ? (app.assessment_passed ? 'text-emerald-700' : 'text-red-700') : 'text-amber-700'}>
                              {app.assessment_status === 'completed'
                                ? `${app.assessment_pct?.toFixed(0)}% — ${app.assessment_passed ? 'Passed' : 'Failed'}`
                                : app.assessment_status === 'started' ? 'In Progress'
                                : app.assessment_status === 'invited' ? 'Awaiting Candidate'
                                : 'Expired'}
                            </p>
                          </div>
                        )}
                        {app.skills_summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            <span className="font-medium">Skills: </span>{app.skills_summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                  {app.resume_url && (
                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors">
                      <FileText className="h-3 w-3" />Resume
                    </a>
                  )}
                  <button
                    onClick={() => sendAssessment(app.id)}
                    disabled={
                      app.assessment_status === 'completed' ||
                      app.assessment_status === 'invited' ||
                      app.assessment_status === 'started' ||
                      app.current_stage_name === 'Rejected'
                    }
                    title={
                      app.assessment_status === 'completed' ? 'Assessment already completed' :
                      app.assessment_status === 'invited'   ? 'Invite already sent — awaiting candidate' :
                      app.assessment_status === 'started'   ? 'Candidate has started the assessment' :
                      'Send assessment invite to candidate'
                    }
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors">
                    <ClipboardList className="h-3 w-3" />
                    {app.assessment_status === 'expired' ? 'Resend Assessment' : 'Invite for Assessment'}
                  </button>
                  <button
                    onClick={() => moveStage(app.id, 'Shortlisted')}
                    disabled={app.current_stage_name === 'Shortlisted'}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                    <CheckCircle2 className="h-3 w-3" />Shortlist
                  </button>
                  <button
                    onClick={() => setInterviewModal(app)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    <Calendar className="h-3 w-3" />Schedule Interview
                  </button>
                  <button
                    onClick={() => moveStage(app.id, 'Rejected')}
                    disabled={app.current_stage_name === 'Rejected'}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
                    <XCircle className="h-3 w-3" />Reject
                  </button>

                  <div className="relative ml-auto">
                    <button
                      onClick={() => setActionDropdown(actionDropdown === app.id ? null : app.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors">
                      Move Stage ▾
                    </button>
                    {actionDropdown === app.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-48 py-1">
                        {STAGES.filter(s => s !== 'All' && s !== app.current_stage_name).map(s => (
                          <button key={s} onClick={() => moveStage(app.id, s)}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Interview Modal */}
      {interviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Schedule Interview</h2>
              <button onClick={() => setInterviewModal(null)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              For <strong>{interviewModal.full_name}</strong> — {interviewModal.job_title}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Round Name</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={interviewForm.round_name} onChange={e => setInterviewForm(f => ({ ...f, round_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={interviewForm.interview_type} onChange={e => setInterviewForm(f => ({ ...f, interview_type: e.target.value }))}>
                    <option value="hr">HR</option>
                    <option value="technical">Technical</option>
                    <option value="managerial">Managerial</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Mode</label>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={interviewForm.mode} onChange={e => setInterviewForm(f => ({ ...f, mode: e.target.value }))}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date & Time *</label>
                <input type="datetime-local" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={interviewForm.scheduled_at} onChange={e => setInterviewForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              {interviewForm.mode === 'online' && (
                <div>
                  <label className="text-sm font-medium">Meeting Link</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="https://meet.google.com/..." value={interviewForm.meeting_link} onChange={e => setInterviewForm(f => ({ ...f, meeting_link: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setInterviewModal(null)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={scheduleInterview} disabled={submitting || !interviewForm.scheduled_at} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {submitting ? 'Scheduling...' : 'Schedule & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
