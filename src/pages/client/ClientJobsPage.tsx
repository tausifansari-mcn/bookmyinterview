import { useEffect, useState, useRef } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  Loader2, Plus, Search, Upload, X, ChevronDown, Briefcase, FileText,
  ArrowLeft, User, Phone, Mail, Globe, BookOpen, Star, Trash2, Bot, Send,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Job {
  id: string
  title: string
  status: string
  job_type: string
  work_mode: string
  experience_min_years: number
  experience_max_years: number | null
  salary_min: number | null
  salary_max: number | null
  application_count: number
  created_at: string
}

interface JobForm {
  title: string
  description: string
  requirements: string
  job_type: string
  work_mode: string
  experience_min_years: number
  experience_max_years: string
  salary_min: string
  salary_max: string
  location_city: string
  skills_required: string
  assessment_id: string
}

interface AssessmentOption { id: string; title: string }

const EMPTY_FORM: JobForm = {
  title: '', description: '', requirements: '', job_type: 'full_time',
  work_mode: 'onsite', experience_min_years: 0, experience_max_years: '',
  salary_min: '', salary_max: '', location_city: '', skills_required: '',
  assessment_id: '',
}

const STATUS_COLORS: Record<string, string> = {
  open:    'bg-green-50 text-green-700',
  closed:  'bg-slate-100 text-slate-500',
  on_hold: 'bg-amber-50 text-amber-700',
}

const STAGE_COLORS: Record<string, string> = {
  Applied:   'bg-blue-50 text-blue-700',
  Screening: 'bg-purple-50 text-purple-700',
  Interview: 'bg-amber-50 text-amber-700',
  Offered:   'bg-green-50 text-green-700',
  Rejected:  'bg-red-50 text-red-700',
}

function safeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const lower = url.toLowerCase().trim()
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return undefined
  return url
}

function aiScoreColor(score: number | null | undefined): string {
  if (score == null) return 'bg-slate-100 text-slate-500'
  if (score >= 70)   return 'bg-green-50 text-green-700'
  if (score >= 50)   return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

function parseSkills(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts = (name ?? '').trim().split(' ')
  const letters = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  const cls = size === 'lg'
    ? 'h-16 w-16 rounded-2xl text-[22px]'
    : size === 'sm'
    ? 'h-9 w-9 rounded-xl text-[12px]'
    : 'h-11 w-11 rounded-xl text-[14px]'
  return (
    <div className={cn('flex items-center justify-center font-bold text-amber-700 shrink-0', cls)}
      style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}>
      {letters || <User className="h-5 w-5" />}
    </div>
  )
}

export default function ClientJobsPage() {
  // ── existing state ────────────────────────────────────────────────────────
  const [jobs, setJobs]         = useState<Job[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'upload' | 'ai'>('manual')
  const [form, setForm]         = useState<JobForm>(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedPreview, setExtractedPreview] = useState<any>(null)
  const [error, setError]       = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [assessments, setAssessments] = useState<AssessmentOption[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // ── AI bot chat state ────────────────────────────────────────────────────
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([])
  const [aiInput, setAiInput]       = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiExtracted, setAiExtracted] = useState<any>(null)
  const aiChatRef = useRef<HTMLDivElement>(null)

  // ── slide-over state ──────────────────────────────────────────────────────
  const [slideOverOpen, setSlideOverOpen]     = useState(false)
  const [selectedJobId, setSelectedJobId]     = useState<string | null>(null)
  const [jobDetail, setJobDetail]             = useState<any>(null)
  const [loadingDetail, setLoadingDetail]     = useState(false)
  const [slideTab, setSlideTab]               = useState<'info' | 'applications'>('info')

  const [appSearch, setAppSearch]             = useState('')
  const [appStage, setAppStage]               = useState('')
  const [applications, setApplications]       = useState<any[]>([])
  const [loadingApps, setLoadingApps]         = useState(false)

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [candidateDetail, setCandidateDetail] = useState<any>(null)
  const [loadingCandidate, setLoadingCandidate] = useState(false)
  const [slideError, setSlideError] = useState<string | null>(null)

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── existing data loading ─────────────────────────────────────────────────
  function loadJobs() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)       params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    clientApi.get(`/jobs?${params}`)
      .then(r => setJobs(r.data.data.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadJobs() }, [search, statusFilter])

  useEffect(() => {
    clientApi.get('/assessments')
      .then(r => setAssessments(r.data.data ?? []))
      .catch(() => {})
  }, [])

  // ── slide-over: load job detail when selectedJobId changes ────────────────
  useEffect(() => {
    if (!selectedJobId) return
    setLoadingDetail(true)
    setJobDetail(null)
    const controller = new AbortController()
    clientApi.get(`/jobs/${selectedJobId}`, { signal: controller.signal })
      .then(r => setJobDetail(r.data.data ?? r.data))
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setSlideError('Failed to load job details. Please try again.')
        }
      })
      .finally(() => setLoadingDetail(false))
    return () => controller.abort()
  }, [selectedJobId])

  // ── slide-over: load applications ────────────────────────────────────────
  useEffect(() => {
    if (!selectedJobId || slideTab !== 'applications') return
    setLoadingApps(true)
    const p = new URLSearchParams()
    if (appSearch) p.set('search', appSearch)
    if (appStage)  p.set('stage', appStage)
    p.set('page', '1')
    p.set('limit', '50')
    const controller = new AbortController()
    clientApi.get(`/jobs/${selectedJobId}/applications?${p}`, { signal: controller.signal })
      .then(r => setApplications(r.data.data?.applications ?? []))
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setSlideError('Failed to load applications. Please try again.')
        }
      })
      .finally(() => setLoadingApps(false))
    return () => controller.abort()
  }, [selectedJobId, slideTab, appSearch, appStage])

  // ── slide-over: load candidate detail ────────────────────────────────────
  useEffect(() => {
    if (!selectedCandidateId) return
    setLoadingCandidate(true)
    setCandidateDetail(null)
    const controller = new AbortController()
    clientApi.get(`/candidates/${selectedCandidateId}`, { signal: controller.signal })
      .then(r => setCandidateDetail(r.data.data ?? r.data))
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setSlideError('Failed to load candidate details. Please try again.')
        }
      })
      .finally(() => setLoadingCandidate(false))
    return () => controller.abort()
  }, [selectedCandidateId])

  // ── slide-over helpers ────────────────────────────────────────────────────
  function openJobSlideOver(jobId: string) {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
    setSelectedJobId(jobId)
    setSlideTab('info')
    setSlideOverOpen(true)
    setSelectedCandidateId(null)
    setCandidateDetail(null)
    setAppSearch('')
    setAppStage('')
    setApplications([])
    setSlideError(null)
  }

  function closeSlideOver() {
    setSlideOverOpen(false)
    closeTimerRef.current = setTimeout(() => {
      setSelectedJobId(null)
      setJobDetail(null)
      setApplications([])
      setSelectedCandidateId(null)
      setCandidateDetail(null)
      closeTimerRef.current = null
    }, 300)
  }

  // ── existing form helpers ─────────────────────────────────────────────────
  function set(key: keyof JobForm, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleExtract(file: File) {
    setExtracting(true)
    setExtractedPreview(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await clientApi.post('/jobs/extract', fd, {
        headers: { 'Content-Type': undefined },
      })
      setExtractedPreview({ ...data.data, _fileName: file.name })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not extract job details. Please fill manually.')
    } finally {
      setExtracting(false)
    }
  }

  function applyExtractedPreview() {
    if (!extractedPreview) return
    const ex = extractedPreview
    setForm({
      title:                ex.title ?? '',
      description:          ex.description ?? '',
      requirements:         ex.requirements ?? ex.responsibilities ?? '',
      job_type:             ex.job_type ?? 'full_time',
      work_mode:            ex.work_mode ?? 'onsite',
      experience_min_years: ex.experience_min_years ?? 0,
      experience_max_years: ex.experience_max_years != null ? String(ex.experience_max_years) : '',
      salary_min:           ex.salary_min != null ? String(Math.round(ex.salary_min / 100000)) : '',
      salary_max:           ex.salary_max != null ? String(Math.round(ex.salary_max / 100000)) : '',
      location_city:        ex.location_city ?? '',
      skills_required:      (ex.skills_required ?? []).join(', '),
      assessment_id:        '',
    })
    setExtractedPreview(null)
    setActiveTab('manual')
  }

  async function handleAiSend() {
    if (!aiInput.trim() || aiLoading) return
    const userMsg = { role: 'user', content: aiInput.trim() }
    const nextMsgs = [...aiMessages, userMsg]
    setAiMessages(nextMsgs)
    setAiInput('')
    setAiLoading(true)
    try {
      const { data } = await clientApi.post('/jobs/ai-chat', { messages: nextMsgs })
      const reply = data.data.reply ?? ''
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }])
      if (data.data.extracted?.complete) {
        setAiExtracted(data.data.extracted)
      }
      setTimeout(() => {
        aiChatRef.current?.scrollTo({ top: aiChatRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'AI chat failed. Please try again.'
      setAiMessages(prev => [...prev, { role: 'assistant', content: `❌ ${msg}` }])
    } finally {
      setAiLoading(false)
    }
  }

  function applyAiExtracted() {
    if (!aiExtracted) return
    const ex = aiExtracted
    setForm({
      title:                ex.title ?? '',
      description:          ex.description ?? '',
      requirements:         ex.requirements ?? '',
      job_type:             ex.job_type ?? 'full_time',
      work_mode:            ex.work_mode ?? 'onsite',
      experience_min_years: ex.experience_min_years ?? 0,
      experience_max_years: ex.experience_max_years != null ? String(ex.experience_max_years) : '',
      salary_min:           ex.salary_min != null ? String(Math.round(ex.salary_min / 100000)) : '',
      salary_max:           ex.salary_max != null ? String(Math.round(ex.salary_max / 100000)) : '',
      location_city:        ex.location_city ?? '',
      skills_required:      ex.skills_required ?? '',
      assessment_id:        '',
    })
    setAiMessages([])
    setAiExtracted(null)
    setActiveTab('manual')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const skills = form.skills_required
        ? form.skills_required.split(',').map(s => s.trim()).filter(Boolean)
        : []
      const { assessment_id, ...rest } = form
      const res = await clientApi.post('/jobs', {
        ...rest,
        experience_max_years: form.experience_max_years ? Number(form.experience_max_years) : undefined,
        salary_min: form.salary_min ? Number(form.salary_min) * 100000 : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) * 100000 : undefined,
        skills_required: skills,
      })
      if (assessment_id) {
        const jobId = res.data.data?.id
        if (jobId) {
          await clientApi.patch(`/assessments/${assessment_id}/assign`, { job_id: jobId }).catch(() => {})
        }
      }
      setShowModal(false)
      setForm(EMPTY_FORM)
      loadJobs()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create job')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(jobId: string, status: string) {
    const prev = jobs.find(j => j.id === jobId)?.status
    setJobs(jobs => jobs.map(j => j.id === jobId ? { ...j, status } : j))
    try {
      await clientApi.patch(`/jobs/${jobId}`, { status })
    } catch {
      if (prev !== undefined) setJobs(js => js.map(j => j.id === jobId ? { ...j, status: prev } : j))
    }
  }

  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

  async function handleDeleteJob(jobId: string, jobTitle: string) {
    if (!window.confirm(`Delete "${jobTitle}"?\n\nThis cannot be undone. Jobs with active applications cannot be deleted.`)) return
    setDeletingJobId(jobId)
    setDeleteError(null)
    try {
      await clientApi.delete(`/jobs/${jobId}`)
      setJobs(prev => prev.filter(j => j.id !== jobId))
      if (selectedJobId === jobId) closeSlideOver()
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message ?? 'Failed to delete job')
      setTimeout(() => setDeleteError(null), 5000)
    } finally {
      setDeletingJobId(null)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all'
  const labelCls = 'block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide'

  // ── slide-over: Info tab content ──────────────────────────────────────────
  function renderInfoTab() {
    if (loadingDetail) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
        </div>
      )
    }
    if (!jobDetail) return null

    const skills = parseSkills(jobDetail.skills_required)
    const salMin = jobDetail.salary_min != null ? Math.round(jobDetail.salary_min / 100000) : null
    const salMax = jobDetail.salary_max != null ? Math.round(jobDetail.salary_max / 100000) : null

    return (
      <div className="p-5 space-y-5">
        {/* Skills chips */}
        {skills.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills Required</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: string) => (
                <span key={s} className="px-3 py-1 rounded-full text-[12px] font-medium bg-amber-100 text-amber-800">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Job Type',   value: jobDetail.job_type?.replace(/_/g, ' ') },
            { label: 'Work Mode',  value: jobDetail.work_mode },
            { label: 'Experience', value: jobDetail.experience_min_years != null
                ? `${jobDetail.experience_min_years}${jobDetail.experience_max_years ? `–${jobDetail.experience_max_years}` : '+'} yrs`
                : null },
            { label: 'Salary',     value: salMin != null ? `${salMin}${salMax ? `–${salMax}` : '+'} LPA` : null },
            { label: 'Location',   value: jobDetail.location_city },
            { label: 'Posted',     value: jobDetail.posted_at
                ? new Date(jobDetail.posted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : jobDetail.created_at
                ? new Date(jobDetail.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : null },
            { label: 'Assessment', value: jobDetail.assessment_title ?? null },
            { label: 'Job Code',   value: jobDetail.job_code ?? null },
          ].filter(d => d.value).map(d => (
            <div key={d.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{d.label}</p>
              <p className="text-[13px] font-medium text-slate-800 mt-0.5 capitalize">{d.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {jobDetail.description && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">{jobDetail.description}</p>
          </div>
        )}

        {/* Requirements */}
        {jobDetail.requirements && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Requirements</p>
            <p className="text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">{jobDetail.requirements}</p>
          </div>
        )}
      </div>
    )
  }

  // ── slide-over: Applications tab content ──────────────────────────────────
  function renderApplicationsTab() {
    return (
      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={appSearch}
              onChange={e => setAppSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={appStage}
              onChange={e => setAppStage(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer"
            >
              <option value="">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offered">Offered</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingApps ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-[13px] font-medium">No applications yet</p>
            </div>
          ) : (
            applications.map((app: any) => (
              <button
                key={app.id}
                onClick={() => setSelectedCandidateId(app.candidate_id)}
                className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-amber-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  {safeUrl(app.profile_photo_url) ? (
                    <img src={safeUrl(app.profile_photo_url)} alt={app.full_name}
                      className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <Initials name={app.full_name} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{app.full_name}</p>
                    {(app.current_designation || app.current_company) && (
                      <p className="text-[12px] text-slate-500 truncate">
                        {[app.current_designation, app.current_company].filter(Boolean).join(' @ ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {app.experience_years != null && (
                        <span className="text-[11px] text-slate-400">{app.experience_years} yrs exp</span>
                      )}
                      {app.current_stage_name && (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STAGE_COLORS[app.current_stage_name] ?? 'bg-slate-100 text-slate-500')}>
                          {app.current_stage_name}
                        </span>
                      )}
                      {(app.ai_match_score != null || app.ai_score != null) && (
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5', aiScoreColor(app.ai_match_score ?? app.ai_score))}>
                          <Star className="h-2.5 w-2.5" />
                          {Math.round(app.ai_match_score ?? app.ai_score)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // ── slide-over: Candidate detail content ──────────────────────────────────
  function renderCandidateDetail() {
    if (loadingCandidate) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
        </div>
      )
    }
    if (!candidateDetail) return null

    const cd = candidateDetail
    const skills: any[] = cd.skills ?? []
    const education: any[] = cd.education ?? []
    const experience: any[] = cd.experience ?? []
    const assessmentsList: any[] = cd.assessments ?? []

    function formatDate(d: string | null | undefined) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    }

    return (
      <div className="overflow-y-auto flex-1 p-5 space-y-6">
        {/* Profile header */}
        <div className="flex items-start gap-4">
          {safeUrl(cd.profile_photo_url) ? (
            <img src={safeUrl(cd.profile_photo_url)} alt={cd.full_name}
              className="h-16 w-16 rounded-2xl object-cover shrink-0" />
          ) : (
            <Initials name={cd.full_name} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-slate-900">{cd.full_name}</h3>
            {cd.current_designation && (
              <p className="text-[13px] text-slate-600">{cd.current_designation}{cd.current_company ? ` @ ${cd.current_company}` : ''}</p>
            )}
            {cd.current_location && (
              <p className="text-[12px] text-slate-400 mt-0.5">{cd.current_location}</p>
            )}
            {cd.total_experience_years != null && (
              <p className="text-[12px] text-amber-600 font-medium mt-0.5">{cd.total_experience_years} yrs experience</p>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-3">
          {cd.email && (
            <a href={`mailto:${cd.email}`} className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-amber-600 transition-colors">
              <Mail className="h-3.5 w-3.5" />{cd.email}
            </a>
          )}
          {cd.mobile && (
            <a href={`tel:${cd.mobile}`} className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-amber-600 transition-colors">
              <Phone className="h-3.5 w-3.5" />{cd.mobile}
            </a>
          )}
          {safeUrl(cd.linkedin_url) && (
            <a href={safeUrl(cd.linkedin_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-amber-600 transition-colors">
              <Globe className="h-3.5 w-3.5" />LinkedIn
            </a>
          )}
          {safeUrl(cd.github_url) && (
            <a href={safeUrl(cd.github_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-amber-600 transition-colors">
              <BookOpen className="h-3.5 w-3.5" />GitHub
            </a>
          )}
          {safeUrl(cd.portfolio_url) && (
            <a href={safeUrl(cd.portfolio_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-amber-600 transition-colors">
              <Globe className="h-3.5 w-3.5" />Portfolio
            </a>
          )}
        </div>

        {/* Resume link */}
        {safeUrl(cd.resume_url) && (
          <a href={safeUrl(cd.resume_url)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
            <FileText className="h-4 w-4" />View Resume
          </a>
        )}

        {/* Voice intro */}
        {safeUrl(cd.voice_intro_url) && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Voice Introduction</p>
            <audio controls src={safeUrl(cd.voice_intro_url)} className="w-full mt-1" />
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any, i: number) => (
                <span key={`${s.skill_name ?? ''}-${i}`} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-800">
                  {s.skill_name}
                  {s.skill_level && <span className="text-[10px] text-amber-500">· {s.skill_level}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Professional summary */}
        {cd.professional_summary && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Professional Summary</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{cd.professional_summary}</p>
          </div>
        )}

        {/* Work experience */}
        {experience.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Work Experience</p>
            <div className="space-y-3">
              {experience.map((ex: any, i: number) => (
                <div key={`${ex.company_name ?? ''}-${ex.joining_date ?? ''}-${i}`} className="border-l-2 border-amber-200 pl-4">
                  <p className="text-[13px] font-semibold text-slate-900">{ex.designation}</p>
                  <p className="text-[12px] text-slate-600">{ex.company_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(ex.joining_date)} – {ex.is_current ? 'Present' : formatDate(ex.relieving_date)}
                  </p>
                  {ex.roles_responsibilities && (
                    <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{ex.roles_responsibilities}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Education</p>
            <div className="space-y-2">
              {education.map((ed: any, i: number) => (
                <div key={`${ed.institute ?? ''}-${ed.degree ?? ''}-${i}`} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[13px] font-semibold text-slate-900">{ed.degree}{ed.specialization ? ` — ${ed.specialization}` : ''}</p>
                  <p className="text-[12px] text-slate-600">{ed.institute}</p>
                  {(ed.passing_year || ed.percentage) && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ed.passing_year}{ed.percentage ? ` · ${ed.percentage}%` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessments */}
        {assessmentsList.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Assessments</p>
            <div className="space-y-2">
              {assessmentsList.filter((a: any) => a.status === 'completed' || a.completed_at).map((a: any, i: number) => (
                <div key={a.id ?? i} className="bg-slate-50 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{a.assessment_title}</p>
                    {a.job_title && <p className="text-[11px] text-slate-400">{a.job_title}</p>}
                    {a.time_taken_secs != null && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Time: {Math.round(a.time_taken_secs / 60)} min · {a.scored_marks}/{a.total_marks} marks
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
    )
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">Manage your open positions</p>
        </div>
        <button onClick={() => { setShowModal(true); setActiveTab('manual'); setForm(EMPTY_FORM); setError(''); setAiMessages([]); setAiExtracted(null); setAiInput('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
          <Plus className="h-4 w-4" /> Post New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all bg-white cursor-pointer">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="on_hold">On Hold</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
          <X className="h-4 w-4 shrink-0 text-red-500" />
          {deleteError}
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-5 w-48 bg-slate-100 rounded mb-3" />
              <div className="h-3 w-32 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <p className="text-slate-400 text-[13px] mt-1">Post your first job to start receiving applications</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            Post a Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              onClick={() => openJobSlideOver(job.id)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-slate-900 truncate">{job.title}</h3>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-500')}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-slate-400 flex-wrap">
                    <span className="capitalize">{job.job_type.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span className="capitalize">{job.work_mode}</span>
                    {job.experience_min_years != null && (
                      <>
                        <span>·</span>
                        <span>{job.experience_min_years}{job.experience_max_years ? `–${job.experience_max_years}` : '+'} yrs</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(job.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-amber-600 leading-none">{job.application_count}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">applicants</p>
                  </div>
                  <select value={job.status} onChange={e => handleStatusChange(job.id, e.target.value)}
                    className="text-[12px] border border-slate-200 rounded-xl px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer bg-white">
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                  <button
                    onClick={() => handleDeleteJob(job.id, job.title)}
                    disabled={deletingJobId === job.id}
                    title="Delete job"
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40">
                    {deletingJobId === job.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slide-over ───────────────────────────────────────────────────── */}
      {/* Backdrop */}
      {slideOverOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={closeSlideOver}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full sm:w-[680px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          slideOverOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {selectedCandidateId ? (
          /* ── Candidate detail header + body ─────────────────────────── */
          <>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <button
                onClick={() => { setSelectedCandidateId(null); setCandidateDetail(null) }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-amber-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Applications
              </button>
              <div className="flex-1" />
              <button
                onClick={closeSlideOver}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {slideError && (
              <div className="m-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-700">
                {slideError}
              </div>
            )}
            {renderCandidateDetail()}
          </>
        ) : (
          /* ── Job detail header + tabs + body ────────────────────────── */
          <>
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[16px] font-bold text-slate-900 truncate">
                    {jobDetail?.title ?? jobs.find(j => j.id === selectedJobId)?.title ?? ''}
                  </h2>
                  {(jobDetail?.status ?? jobs.find(j => j.id === selectedJobId)?.status) && (
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize',
                      STATUS_COLORS[jobDetail?.status ?? jobs.find(j => j.id === selectedJobId)?.status ?? ''] ?? 'bg-slate-100 text-slate-500'
                    )}>
                      {(jobDetail?.status ?? jobs.find(j => j.id === selectedJobId)?.status ?? '').replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeSlideOver}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-5 shrink-0">
              {(['info', 'applications'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSlideTab(tab)}
                  className={cn(
                    'px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px capitalize',
                    slideTab === tab
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600',
                  )}
                >
                  {tab === 'info' ? 'Info' : 'Applications'}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="flex-1 overflow-y-auto">
              {slideError && (
                <div className="m-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-700">
                  {slideError}
                </div>
              )}
              {slideTab === 'info' ? renderInfoTab() : renderApplicationsTab()}
            </div>
          </>
        )}
      </div>

      {/* ── Post New Job Modal (unchanged) ──────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[17px] font-bold text-slate-900">Post New Job</h2>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
              {[
                { id: 'manual', label: 'Manual Entry', icon: FileText },
                { id: 'upload', label: 'Upload JD',    icon: Upload   },
                { id: 'ai',     label: 'AI Bot',       icon: Bot      },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap shrink-0',
                    activeTab === id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600',
                  )}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* Upload JD tab */}
              {activeTab === 'upload' && (
                <div className="p-6">
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false)
                      const file = e.dataTransfer.files[0]
                      if (file) handleExtract(file)
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                      dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30',
                    )}>
                    {extracting ? (
                      <>
                        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                        <p className="text-[14px] font-medium text-slate-700">AI is parsing your JD…</p>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)' }}>
                          <Upload className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-[15px] font-semibold text-slate-800">Drop your JD here</p>
                          <p className="text-[13px] text-slate-400 mt-1">PDF, DOC, or DOCX · max 10 MB</p>
                        </div>
                        <p className="text-[12px] text-amber-600 font-medium">Click to browse files</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleExtract(f) }} />
                  </div>
                  {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}
                  {extractedPreview && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="text-[13px] font-bold text-emerald-800">JD Extracted Successfully!</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[12px]">
                        {extractedPreview.title && (
                          <div className="col-span-2 bg-white rounded-xl p-2.5 border border-emerald-100">
                            <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">Job Title</p>
                            <p className="text-slate-800 font-bold mt-0.5">{extractedPreview.title}</p>
                          </div>
                        )}
                        {extractedPreview.job_type && (
                          <div className="bg-white rounded-xl p-2.5 border border-emerald-100">
                            <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">Type</p>
                            <p className="text-slate-700 capitalize mt-0.5">{extractedPreview.job_type.replace('_', ' ')}</p>
                          </div>
                        )}
                        {extractedPreview.work_mode && (
                          <div className="bg-white rounded-xl p-2.5 border border-emerald-100">
                            <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">Mode</p>
                            <p className="text-slate-700 capitalize mt-0.5">{extractedPreview.work_mode}</p>
                          </div>
                        )}
                        {(extractedPreview.experience_min_years != null) && (
                          <div className="bg-white rounded-xl p-2.5 border border-emerald-100">
                            <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">Experience</p>
                            <p className="text-slate-700 mt-0.5">{extractedPreview.experience_min_years}{extractedPreview.experience_max_years ? `–${extractedPreview.experience_max_years}` : '+'} yrs</p>
                          </div>
                        )}
                        {extractedPreview.location_city && (
                          <div className="bg-white rounded-xl p-2.5 border border-emerald-100">
                            <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide">Location</p>
                            <p className="text-slate-700 capitalize mt-0.5">{extractedPreview.location_city}</p>
                          </div>
                        )}
                      </div>
                      {extractedPreview.skills_required?.length > 0 && (
                        <div className="bg-white rounded-xl p-2.5 border border-emerald-100">
                          <p className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wide mb-1.5">Skills Detected</p>
                          <div className="flex flex-wrap gap-1.5">
                            {extractedPreview.skills_required.slice(0, 10).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] text-emerald-700 font-medium">{s}</span>
                            ))}
                            {extractedPreview.skills_required.length > 10 && (
                              <span className="text-[11px] text-slate-400">+{extractedPreview.skills_required.length - 10} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setExtractedPreview(null)}
                          className="flex-1 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                          Try Again
                        </button>
                        <button onClick={applyExtractedPreview}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold text-white transition-colors"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                          <CheckCircle2 className="h-4 w-4" /> Apply to Form →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Bot tab */}
              {activeTab === 'ai' && (
                <div className="flex flex-col h-full p-5 gap-4" style={{ minHeight: 420 }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-amber-800">AI Job Creation Bot</p>
                      <p className="text-[11.5px] text-amber-600">Chat with AI to create your job posting. It'll ask you questions step by step.</p>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div ref={aiChatRef} className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 280 }}>
                    {aiMessages.length === 0 && (
                      <div className="text-center py-8">
                        <Bot className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-[13px] text-slate-400">
                          Say "Hi" to start or describe the role you're hiring for.
                        </p>
                      </div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                        }`}>
                          {msg.content.replace(/```json[\s\S]*?```/g, '✅ Job details collected!')}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                          <div className="flex gap-1 items-center">
                            {[0, 1, 2].map(i => (
                              <div key={i} className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extracted job preview */}
                  {aiExtracted && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-[12.5px] font-bold text-emerald-700">Job details ready!</p>
                      </div>
                      <p className="text-[12px] text-emerald-600 mb-3">
                        <strong>{aiExtracted.title}</strong> · {aiExtracted.job_type?.replace('_',' ')} · {aiExtracted.work_mode}
                      </p>
                      <button onClick={applyAiExtracted}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-colors">
                        Fill Form with AI Data →
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAiSend()}
                      placeholder="Type your reply…"
                      disabled={aiLoading}
                      className="flex-1 px-3.5 py-2.5 text-[13px] border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
                    />
                    <button onClick={handleAiSend} disabled={aiLoading || !aiInput.trim()}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors shrink-0">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Entry tab */}
              {activeTab === 'manual' && (
                <form id="job-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className={labelCls}>Job Title *</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                      required placeholder="e.g. Senior React Developer" className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Job Type</label>
                      <select value={form.job_type} onChange={e => set('job_type', e.target.value)} className={inputCls}>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Work Mode</label>
                      <select value={form.work_mode} onChange={e => set('work_mode', e.target.value)} className={inputCls}>
                        <option value="onsite">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Min Experience (yrs)</label>
                      <input type="number" min={0} value={form.experience_min_years}
                        onChange={e => set('experience_min_years', Number(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Max Experience (yrs)</label>
                      <input type="number" min={0} value={form.experience_max_years}
                        onChange={e => set('experience_max_years', e.target.value)}
                        placeholder="Optional" className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Min Salary (LPA)</label>
                      <input type="number" min={0} value={form.salary_min}
                        onChange={e => set('salary_min', e.target.value)} placeholder="e.g. 8" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Max Salary (LPA)</label>
                      <input type="number" min={0} value={form.salary_max}
                        onChange={e => set('salary_max', e.target.value)} placeholder="e.g. 15" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Location City</label>
                    <input value={form.location_city} onChange={e => set('location_city', e.target.value)}
                      placeholder="Bengaluru" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Required Skills (comma-separated)</label>
                    <input value={form.skills_required} onChange={e => set('skills_required', e.target.value)}
                      placeholder="React, TypeScript, Node.js" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Job Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                      rows={4} placeholder="Describe the role, responsibilities and what you're looking for…"
                      className={cn(inputCls, 'resize-none')} />
                  </div>

                  <div>
                    <label className={labelCls}>Requirements</label>
                    <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
                      rows={3} placeholder="List must-have qualifications and skills…"
                      className={cn(inputCls, 'resize-none')} />
                  </div>

                  {assessments.length > 0 && (
                    <div>
                      <label className={labelCls}>Assign Assessment (Optional)</label>
                      <select value={form.assessment_id} onChange={e => set('assessment_id', e.target.value)}
                        className={inputCls}>
                        <option value="">No assessment</option>
                        {assessments.map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">Candidates will be prompted to complete this after applying</p>
                    </div>
                  )}

                  {error && <p className="text-[13px] text-red-600">{error}</p>}
                </form>
              )}
            </div>

            {/* Footer */}
            {activeTab === 'manual' && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button form="job-form" type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                  style={{ background: saving ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: saving ? 'none' : '0 4px 12px rgba(245,158,11,0.3)' }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : 'Post Job'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
