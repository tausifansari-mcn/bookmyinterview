import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Users, Clock, Briefcase, BadgeIndianRupee,
  Calendar, Tag, ChevronDown, Loader2, CheckCircle, PauseCircle, XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getInitials } from '@/lib/utils'

const STAGES = [
  'Application Received','Assessment Pending','Shortlisted',
  'Interview Scheduled','Selected','Offer Sent','Joined',
]

const REC_COLOR: Record<string, string> = {
  highly_recommended: 'text-emerald-600',
  recommended:        'text-blue-600',
  review_required:    'text-amber-600',
  not_recommended:    'text-red-500',
}

const priorityColor: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
}

const statusIcon: Record<string, React.ReactNode> = {
  open:   <CheckCircle className="h-4 w-4 text-green-500" />,
  paused: <PauseCircle className="h-4 w-4 text-yellow-500" />,
  closed: <XCircle className="h-4 w-4 text-gray-400" />,
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob]             = useState<any | null>(null)
  const [apps, setApps]           = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [appsLoading, setAppsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'pipeline'>('overview')
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/jobs/${id}`)
      .then(r => setJob(r.data.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false))

    setAppsLoading(true)
    api.get(`/jobs/${id}/applications`)
      .then(r => setApps(r.data.data))
      .catch(() => setApps([]))
      .finally(() => setAppsLoading(false))
  }, [id])

  async function changeStatus(status: string) {
    if (!job) return
    setStatusChanging(true)
    try {
      await api.patch(`/jobs/${id}/status`, { status })
      setJob((j: any) => ({ ...j, status }))
    } catch {}
    finally { setStatusChanging(false) }
  }

  const formatSalary = (min: number | null, max: number | null) => {
    const fmt = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`
    if (!min && !max) return null
    if (min && max) return `${fmt(min)} – ${fmt(max)} /yr`
    if (min) return `${fmt(min)}+ /yr`
    return `Up to ${fmt(max!)} /yr`
  }

  const daysAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  // Group applications by stage
  const byStage = (stageName: string) => apps.filter(a => a.current_stage_name === stageName)
  const pipelineStages = STAGES.filter(s => s !== 'Rejected')
  const rejected = apps.filter(a => a.current_stage_name === 'Rejected' || a.status === 'rejected')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-muted-foreground">Job not found</p>
        <Link to="/jobs" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
      </div>
    )
  }

  const skills: string[] = (() => {
    try { return typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : job.skills_required ?? [] }
    catch { return [] }
  })()

  const salary = formatSalary(job.salary_min, job.salary_max)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <Link to="/jobs" className="p-2 rounded-lg hover:bg-accent mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{job.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColor[job.priority] ?? ''}`}>
              {job.priority}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {statusIcon[job.status]}
              <span className="capitalize">{job.status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
            <span className="font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded">{job.job_code}</span>
            {job.department_name && <span>{job.department_name}</span>}
            {job.location_city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location_city}</span>}
            <span className="capitalize">{job.job_type?.replace('_', ' ')}</span>
            <span className="capitalize">{job.work_mode}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysAgo(job.created_at)}</span>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-shrink-0">
          {/* Status change */}
          {job.status !== 'closed' && (
            <div className="relative group">
              <button
                disabled={statusChanging}
                className="flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg font-medium hover:bg-accent disabled:opacity-50"
              >
                {statusChanging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Change Status
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[130px]">
                {job.status === 'open'   && <button onClick={() => changeStatus('paused')} className="w-full text-left px-4 py-2 text-sm hover:bg-accent">Pause</button>}
                {job.status === 'paused' && <button onClick={() => changeStatus('open')}   className="w-full text-left px-4 py-2 text-sm hover:bg-accent">Re-open</button>}
                <button onClick={() => changeStatus('closed')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Close Job</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Applications', value: apps.length, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Openings',     value: job.headcount, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Exp Required', value: job.experience_min_years !== null ? `${job.experience_min_years}–${job.experience_max_years ?? '+'}  yrs` : '—', icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Salary',       value: salary ?? '—', icon: BadgeIndianRupee, color: 'text-rose-600 bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b">
        {(['overview', 'pipeline'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'pipeline' ? `Pipeline (${apps.length})` : 'Overview'}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            {/* Description */}
            {job.description && (
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Job Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold mb-3">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {!job.description && !job.requirements && skills.length === 0 && (
              <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No description added for this job</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm">Job Details</h3>
              {[
                { label: 'Job Code',    value: job.job_code },
                { label: 'Status',      value: <span className="capitalize">{job.status}</span> },
                { label: 'Type',        value: job.job_type?.replace('_', ' ') },
                { label: 'Work Mode',   value: job.work_mode },
                { label: 'Priority',    value: <span className="capitalize">{job.priority}</span> },
                { label: 'Openings',    value: job.headcount },
                { label: 'Department',  value: job.department_name ?? '—' },
                { label: 'Location',    value: job.location_city ?? '—' },
                { label: 'Experience',  value: job.experience_min_years !== null
                  ? `${job.experience_min_years}–${job.experience_max_years ?? '+'}  yrs` : '—' },
                { label: 'Salary',      value: salary ?? '—' },
                { label: 'Posted On',   value: job.posted_at ? new Date(job.posted_at).toLocaleDateString('en-IN') : '—' },
                { label: 'Closes On',   value: job.closes_at ? new Date(job.closes_at).toLocaleDateString('en-IN') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{label}</span>
                  <span className="font-medium text-right capitalize">{value}</span>
                </div>
              ))}
            </div>

            {job.closes_at && new Date(job.closes_at) < new Date() && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                This job's application deadline has passed
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pipeline tab ── */}
      {activeTab === 'pipeline' && (
        appsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border rounded-xl">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No applications yet</p>
            <p className="text-sm mt-1">Share this job to start receiving candidates</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipelineStages.map(stage => {
              const stageApps = byStage(stage)
              return (
                <div key={stage} className="min-w-[200px] flex-shrink-0 w-48">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground truncate">{stage}</p>
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5 flex-shrink-0 ml-1">{stageApps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageApps.map(app => (
                      <Link
                        key={app.id}
                        to={`/candidates/${app.candidate_id ?? app.id}`}
                        className="block bg-card border rounded-lg p-3 hover:border-primary/40 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {app.profile_photo_url ? (
                            <img src={app.profile_photo_url} alt={app.full_name} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">{getInitials(app.full_name)}</span>
                            </div>
                          )}
                          <p className="text-sm font-medium truncate">{app.full_name}</p>
                        </div>
                        {app.current_designation && (
                          <p className="text-xs text-muted-foreground truncate">{app.current_designation}</p>
                        )}
                        {app.total_score > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className={`text-xs font-semibold ${REC_COLOR[app.recommendation] ?? 'text-muted-foreground'}`}>
                              {Number(app.total_score).toFixed(0)}% match
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{daysAgo(app.applied_at)}</p>
                      </Link>
                    ))}
                    {stageApps.length === 0 && (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Rejected column */}
            {rejected.length > 0 && (
              <div className="min-w-[200px] flex-shrink-0 w-48">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-red-500">Rejected</p>
                  <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">{rejected.length}</span>
                </div>
                <div className="space-y-2">
                  {rejected.map(app => (
                    <div key={app.id} className="bg-card border border-red-100 rounded-lg p-3 opacity-60">
                      <p className="text-sm font-medium truncate">{app.full_name}</p>
                      {app.current_designation && <p className="text-xs text-muted-foreground truncate">{app.current_designation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
