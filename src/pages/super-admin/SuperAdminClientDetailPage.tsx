import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  ArrowLeft, Building2, Briefcase, Users, FileText, Shield, Loader2,
  Search, CheckCircle2, X, MapPin, Globe, Phone, Calendar, BarChart3,
  ChevronDown, Lock, Unlock, AlertCircle, Mail, BookOpen, Video
} from 'lucide-react'
import { cn } from '@/lib/utils'

function safeUrl(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : ''
  } catch { return '' }
}

type Tab = 'overview' | 'jobs' | 'candidates' | 'permissions'

const DEFAULT_PERMISSIONS = {
  can_view_candidate_profile: true,
  can_view_candidate_contact: true,
  can_download_resume: true,
  can_send_interview_invite: true,
  can_post_jobs: true,
  can_create_assessments: true,
  can_view_analytics: true,
}

const PERMISSION_LABELS: Record<string, string> = {
  can_view_candidate_profile: 'View Candidate Profiles',
  can_view_candidate_contact: 'View Contact Details (email/phone)',
  can_download_resume: 'Download Resumes',
  can_send_interview_invite: 'Send Interview Invitations',
  can_post_jobs: 'Post New Jobs',
  can_create_assessments: 'Create Assessments',
  can_view_analytics: 'View Analytics & Reports',
}

const STATUS_STYLE: Record<string, string> = {
  open:    'bg-green-50 text-green-700 border-green-100',
  closed:  'bg-slate-100 text-slate-500 border-slate-200',
  on_hold: 'bg-amber-50 text-amber-700 border-amber-100',
}

const STAGE_COLORS: Record<string, string> = {
  'Application Received': 'bg-blue-50 text-blue-700',
  'Shortlisted':          'bg-indigo-50 text-indigo-700',
  'Interview Scheduled':  'bg-violet-50 text-violet-700',
  'Offer Made':           'bg-amber-50 text-amber-700',
  'Hired':                'bg-green-50 text-green-700',
  'Rejected':             'bg-red-50 text-red-600',
}

export default function SuperAdminClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  // Client data
  const [client, setClient]     = useState<any>(null)
  const [loadingClient, setLoadingClient] = useState(true)

  // Jobs tab
  const [jobs, setJobs]           = useState<any[]>([])
  const [jobSearch, setJobSearch]   = useState('')
  const [jobStatus, setJobStatus]   = useState('')
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobsTotal, setJobsTotal]   = useState(0)

  // Candidates tab
  const [candidates, setCandidates] = useState<any[]>([])
  const [candSearch, setCandSearch] = useState('')
  const [candStage, setCandStage]   = useState('')
  const [candSkill, setCandSkill]   = useState('')
  const [loadingCands, setLoadingCands] = useState(false)
  const [candsTotal, setCandsTotal] = useState(0)

  // Permissions tab
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS)
  const [savingPerms, setSavingPerms] = useState(false)
  const [permsSaved, setPermsSaved]   = useState(false)
  const [permsError, setPermsError]   = useState('')

  // Candidate detail panel
  const [selectedCandId, setSelectedCandId] = useState<string | null>(null)
  const [candDetail, setCandDetail]         = useState<any>(null)
  const [loadingCandDetail, setLoadingCandDetail] = useState(false)

  // Load client detail
  useEffect(() => {
    if (!id) return
    setLoadingClient(true)
    superAdminApi.get(`/clients/${id}`)
      .then(r => {
        const data = r.data.data
        setClient(data)
        const savedPerms = data.permissions
        if (savedPerms && typeof savedPerms === 'object') {
          setPermissions({ ...DEFAULT_PERMISSIONS, ...savedPerms })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClient(false))
  }, [id])

  // Load jobs when tab or filters change
  useEffect(() => {
    if (tab !== 'jobs' || !id) return
    setLoadingJobs(true)
    const params = new URLSearchParams({ limit: '50' })
    if (jobSearch) params.set('search', jobSearch)
    if (jobStatus) params.set('status', jobStatus)
    superAdminApi.get(`/clients/${id}/jobs?${params}`)
      .then(r => { setJobs(r.data.data.jobs ?? []); setJobsTotal(r.data.data.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoadingJobs(false))
  }, [tab, jobSearch, jobStatus, id])

  // Load candidates when tab or filters change
  useEffect(() => {
    if (tab !== 'candidates' || !id) return
    setLoadingCands(true)
    const params = new URLSearchParams({ limit: '50' })
    if (candSearch) params.set('search', candSearch)
    if (candStage)  params.set('stage', candStage)
    if (candSkill)  params.set('skill', candSkill)
    superAdminApi.get(`/clients/${id}/candidates?${params}`)
      .then(r => { setCandidates(r.data.data.candidates ?? []); setCandsTotal(r.data.data.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoadingCands(false))
  }, [tab, candSearch, candStage, candSkill, id])

  async function handleSavePermissions() {
    if (!id) return
    setSavingPerms(true); setPermsSaved(false); setPermsError('')
    try {
      await superAdminApi.patch(`/clients/${id}/permissions`, { permissions })
      setPermsSaved(true)
      setTimeout(() => setPermsSaved(false), 3000)
    } catch (err: any) {
      setPermsError(err?.response?.data?.message ?? 'Failed to save permissions')
    } finally {
      setSavingPerms(false)
    }
  }

  function openCandDetail(candId: string) {
    setSelectedCandId(candId)
    setCandDetail(null)
    setLoadingCandDetail(true)
    superAdminApi.get(`/candidates/${candId}`)
      .then(r => setCandDetail(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingCandDetail(false))
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview',     label: 'Overview',     icon: BarChart3 },
    { key: 'jobs',         label: 'Jobs',         icon: Briefcase },
    { key: 'candidates',   label: 'Candidates',   icon: Users     },
    { key: 'permissions',  label: 'Permissions',  icon: Shield    },
  ]

  if (loadingClient) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
    </div>
  )

  if (!client) return (
    <div className="text-center py-20">
      <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500">Client not found</p>
      <button onClick={() => navigate('/super-admin/clients')}
        className="mt-4 text-[13px] text-indigo-600 hover:underline">Back to clients</button>
    </div>
  )

  return (
    <>
    <div className="space-y-5">

      {/* Back + Header */}
      <div>
        <button onClick={() => navigate('/super-admin/clients')}
          className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-[20px]"
              style={{ background: client.logo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {client.logo_url
                ? <img src={client.logo_url} alt={client.company_name} className="h-full w-full object-cover" />
                : client.company_name?.[0]?.toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-bold text-slate-900">{client.company_name}</h1>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                  client.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                )}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 capitalize">
                  {client.plan ?? 'starter'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 capitalize">
                  {client.subscription_status}
                </span>
              </div>
              {client.company_tagline && (
                <p className="text-[13px] text-slate-500 mt-0.5 italic">"{client.company_tagline}"</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-[12px] text-slate-400 flex-wrap">
                {client.industry && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{client.industry}</span>}
                {client.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}{client.state ? `, ${client.state}` : ''}</span>}
                {client.website && <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors"><Globe className="h-3 w-3" />{client.website.replace(/^https?:\/\//, '')}</a>}
                {client.primary_contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.primary_contact_phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {new Date(client.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="hidden sm:flex items-center gap-4 shrink-0">
              {[
                { label: 'Jobs', value: client.jobs_count ?? 0 },
                { label: 'Active', value: client.active_jobs ?? 0 },
                { label: 'Applications', value: client.applications_count ?? 0 },
                { label: 'Users', value: client.users_count ?? 0 },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-[18px] font-bold text-indigo-600">{s.value}</p>
                  <p className="text-[10px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[13px] font-medium transition-all',
              tab === key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
            )}>
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Stats */}
          {[
            { label: 'Total Jobs',        value: client.jobs_count ?? 0,        color: 'text-indigo-600' },
            { label: 'Active Jobs',       value: client.active_jobs ?? 0,       color: 'text-green-600'  },
            { label: 'Total Applications',value: client.applications_count ?? 0,color: 'text-violet-600' },
            { label: 'Team Members',      value: client.users_count ?? 0,       color: 'text-amber-600'  },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={cn('text-[32px] font-bold mt-1', s.color)}>{s.value}</p>
            </div>
          ))}

          {/* Company info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:col-span-2">
            <p className="text-[13px] font-semibold text-slate-700 mb-3">Company Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Contact', value: client.primary_contact_name },
                { label: 'Phone', value: client.primary_contact_phone },
                { label: 'Company Size', value: client.company_size },
                { label: 'GST', value: client.gst_number },
                { label: 'CIN', value: client.cin_number },
                { label: 'Onboarding', value: client.onboarding_completed ? 'Completed' : 'Pending' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-[13px] font-medium text-slate-800 mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About company */}
          {client.about_company && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:col-span-3">
              <p className="text-[13px] font-semibold text-slate-700 mb-2">About Company</p>
              <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{client.about_company}</p>
            </div>
          )}
        </div>
      )}

      {/* ── JOBS TAB ─────────────────────────────────────────────── */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                placeholder="Search job titles…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
            </div>
            <div className="relative">
              <select value={jobStatus} onChange={e => setJobStatus(e.target.value)}
                className="appearance-none pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-[12px] text-slate-400">{jobsTotal} jobs found</p>

          {loadingJobs ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Briefcase className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No jobs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(j => (
                <div key={j.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-slate-900">{j.title}</p>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize', STATUS_STYLE[j.status] ?? STATUS_STYLE.closed)}>
                          {j.status?.replace('_', ' ')}
                        </span>
                        {j.job_type && <span className="text-[10px] text-slate-400 capitalize">{j.job_type.replace('_', ' ')}</span>}
                      </div>
                      {j.description && (
                        <p className="text-[12px] text-slate-400 mt-1 line-clamp-2">{j.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700">{j.applications_count ?? 0} applicants</span>
                        <span>·</span>
                        <span>Posted {new Date(j.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CANDIDATES TAB ───────────────────────────────────────── */}
      {tab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={candSearch} onChange={e => setCandSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
            </div>
            <input value={candSkill} onChange={e => setCandSkill(e.target.value)}
              placeholder="Filter by skill…"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
            <div className="relative">
              <select value={candStage} onChange={e => setCandStage(e.target.value)}
                className="appearance-none pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer">
                <option value="">All Stages</option>
                <option>Application Received</option>
                <option>Shortlisted</option>
                <option>Interview Scheduled</option>
                <option>Offer Made</option>
                <option>Hired</option>
                <option>Rejected</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-[12px] text-slate-400">{candsTotal} candidates applied</p>

          {loadingCands ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No candidates found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((c, idx) => (
                <button key={`${c.id}-${idx}`} onClick={() => openCandDetail(c.id)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white text-[13px] font-bold"
                      style={{ background: c.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {c.profile_photo_url
                        ? <img src={c.profile_photo_url} alt={c.full_name} className="h-full w-full object-cover" />
                        : c.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-slate-900">{c.full_name}</p>
                        {c.current_stage_name && (
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STAGE_COLORS[c.current_stage_name] ?? 'bg-slate-100 text-slate-500')}>
                            {c.current_stage_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-400 mt-0.5 truncate">{c.current_designation ?? c.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        {c.applied_job_title && <span className="text-indigo-600 font-medium truncate">→ {c.applied_job_title}</span>}
                        {c.current_location && <><span>·</span><span>{c.current_location}</span></>}
                        {c.experience_years != null && <><span>·</span><span>{c.experience_years}y exp</span></>}
                      </div>
                    </div>
                    {c.ai_score != null && (
                      <div className="text-center shrink-0">
                        <p className="text-[16px] font-bold text-indigo-600">{Math.round(c.ai_score)}%</p>
                        <p className="text-[9px] text-slate-400">AI Match</p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PERMISSIONS TAB ──────────────────────────────────────── */}
      {tab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900">Feature Permissions</p>
              <p className="text-[12px] text-slate-400">Control what {client.company_name} can do in their portal</p>
            </div>
          </div>

          {permsSaved && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-[13px] text-emerald-700 font-medium">Permissions saved successfully!</p>
            </div>
          )}
          {permsError && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-[13px] text-red-700 font-medium">{permsError}</p>
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
              const enabled = permissions[key] ?? true
              return (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center', enabled ? 'bg-green-50' : 'bg-slate-100')}>
                      {enabled
                        ? <Unlock className="h-4 w-4 text-green-600" />
                        : <Lock className="h-4 w-4 text-slate-400" />
                      }
                    </div>
                    <span className="text-[14px] font-medium text-slate-700">{label}</span>
                  </div>
                  <button onClick={() => setPermissions(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors duration-200',
                      enabled ? 'bg-green-500' : 'bg-slate-200',
                    )}>
                    <span className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                      enabled ? 'translate-x-5' : 'translate-x-0.5',
                    )} />
                  </button>
                </div>
              )
            })}
          </div>

          <button onClick={handleSavePermissions} disabled={savingPerms}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
            style={{ background: savingPerms ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            {savingPerms ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Shield className="h-4 w-4" /> Save Permissions</>}
          </button>
        </div>
      )}
    </div>

    {/* ── Candidate Detail Slide-Over ─────────────────────────────── */}
    {selectedCandId && (
      <>
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setSelectedCandId(null)} />
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-[15px] font-bold text-slate-900">Candidate Profile</p>
            <button onClick={() => setSelectedCandId(null)}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {loadingCandDetail ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            </div>
          ) : !candDetail ? (
            <div className="flex items-center justify-center flex-1 text-slate-400 text-[13px]">
              Failed to load candidate profile
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-white text-[22px] font-bold"
                  style={{ background: candDetail.profile_photo_url ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {candDetail.profile_photo_url
                    ? <img src={candDetail.profile_photo_url} alt={candDetail.full_name} className="h-full w-full object-cover" />
                    : candDetail.full_name?.[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-slate-900">{candDetail.full_name}</h3>
                  {candDetail.current_designation && (
                    <p className="text-[13px] text-slate-600">{candDetail.current_designation}{candDetail.current_company ? ` @ ${candDetail.current_company}` : ''}</p>
                  )}
                  {candDetail.current_location && (
                    <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{candDetail.current_location}</p>
                  )}
                  {candDetail.total_experience_years != null && (
                    <p className="text-[12px] font-medium text-indigo-600 mt-0.5">{candDetail.total_experience_years} yrs experience</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-2">
                {candDetail.email && (
                  <a href={`mailto:${candDetail.email}`}
                    className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail className="h-3.5 w-3.5" />{candDetail.email}
                  </a>
                )}
                {candDetail.mobile && (
                  <a href={`tel:${candDetail.mobile}`}
                    className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-indigo-600 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{candDetail.mobile}
                  </a>
                )}
                {safeUrl(candDetail.linkedin_url) && (
                  <a href={safeUrl(candDetail.linkedin_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-indigo-600 transition-colors">
                    <Globe className="h-3.5 w-3.5" />LinkedIn
                  </a>
                )}
                {safeUrl(candDetail.github_url) && (
                  <a href={safeUrl(candDetail.github_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-indigo-600 transition-colors">
                    <BookOpen className="h-3.5 w-3.5" />GitHub
                  </a>
                )}
              </div>

              {/* Resume */}
              {safeUrl(candDetail.resume_url) && (
                <a href={safeUrl(candDetail.resume_url)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                  <FileText className="h-4 w-4" />View Resume
                </a>
              )}

              {/* Gate Scores */}
              {(candDetail.profile_completion != null || candDetail.assessment_score != null || candDetail.intro_score != null) && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Gate Scores</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Profile', value: candDetail.profile_completion, threshold: 95 },
                      { label: 'Assessment', value: candDetail.assessment_score, threshold: 80 },
                      { label: 'Intro', value: candDetail.intro_score, threshold: 80 },
                    ].map(({ label, value, threshold }) => {
                      const v = Number(value ?? 0)
                      const passed = v >= threshold
                      return (
                        <div key={label} className={`rounded-xl p-2.5 text-center border ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <p className={`text-[18px] font-black leading-none ${passed ? 'text-emerald-600' : 'text-slate-400'}`}>{Math.round(v)}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                          <p className={`text-[9px] font-semibold mt-0.5 ${passed ? 'text-emerald-600' : 'text-slate-400'}`}>{passed ? 'PASSED' : `Need ${threshold}`}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Voice / Video intro */}
              {candDetail.voice_intro_url && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> Introduction Recording
                  </p>
                  {/\/video-/.test(candDetail.voice_intro_url) ? (
                    <video controls src={candDetail.voice_intro_url} className="w-full rounded-xl max-h-56 bg-black" />
                  ) : (
                    <audio controls src={candDetail.voice_intro_url} className="w-full mt-1" />
                  )}
                  {candDetail.voice_intro_duration && (
                    <p className="text-[11px] text-slate-400 mt-1">{Math.round(candDetail.voice_intro_duration)}s</p>
                  )}
                </div>
              )}

              {/* Intro Transcript */}
              {candDetail.intro_transcript && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Intro Transcript</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3">{candDetail.intro_transcript}</p>
                </div>
              )}

              {/* Intro Feedback */}
              {candDetail.intro_feedback && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">AI Feedback</p>
                  <p className="text-[12px] text-slate-600 leading-relaxed bg-indigo-50 rounded-xl p-3">{candDetail.intro_feedback}</p>
                </div>
              )}

              {/* Skills */}
              {(candDetail.skills as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(candDetail.skills as any[]).map((s: any, i: number) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-indigo-50 text-indigo-800">
                        {s.skill_name}
                        {s.skill_level && <span className="text-[10px] text-indigo-400">· {s.skill_level}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional summary */}
              {candDetail.professional_summary && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Professional Summary</p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{candDetail.professional_summary}</p>
                </div>
              )}

              {/* Experience */}
              {(candDetail.experience as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Work Experience</p>
                  <div className="space-y-3">
                    {(candDetail.experience as any[]).map((ex: any, i: number) => (
                      <div key={i} className="border-l-2 border-indigo-200 pl-4">
                        <p className="text-[13px] font-semibold text-slate-900">{ex.designation}</p>
                        <p className="text-[12px] text-slate-600">{ex.company_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ex.joining_date ? new Date(ex.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                          {' – '}
                          {ex.is_current ? 'Present' : (ex.relieving_date ? new Date(ex.relieving_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '')}
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
              {(candDetail.education as any[] ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Education</p>
                  <div className="space-y-2">
                    {(candDetail.education as any[]).map((ed: any, i: number) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[13px] font-semibold text-slate-900">{ed.degree}{ed.specialization ? ` — ${ed.specialization}` : ''}</p>
                        <p className="text-[12px] text-slate-600">{ed.institute}</p>
                        {(ed.passing_year || ed.percentage) && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{ed.passing_year}{ed.percentage ? ` · ${ed.percentage}%` : ''}</p>
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
