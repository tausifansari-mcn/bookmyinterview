import { useEffect, useState, useCallback } from 'react'
import { clientApi } from '@/lib/clientApi'
import { Loader2, Briefcase, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Application {
  id: string; current_stage_name: string; status: string; applied_at: string
  candidate_id: string; full_name: string; email: string
  profile_photo_url: string | null; current_designation: string | null
  current_company: string | null; experience_years: number | null
  job_id: string; job_title: string; job_code: string
}

const COLUMNS: Array<{ stage: string; label: string; color: string; dot: string }> = [
  { stage: 'Application Received', label: 'Applied',     color: 'border-blue-200 bg-blue-50/50',     dot: 'bg-blue-400'   },
  { stage: 'Shortlisted',          label: 'Shortlisted', color: 'border-amber-200 bg-amber-50/50',   dot: 'bg-amber-400'  },
  { stage: 'Interview Scheduled',  label: 'Interview',   color: 'border-purple-200 bg-purple-50/50', dot: 'bg-purple-400' },
  { stage: 'Offer Made',           label: 'Offer Made',  color: 'border-indigo-200 bg-indigo-50/50', dot: 'bg-indigo-400' },
  { stage: 'Hired',                label: 'Hired',       color: 'border-green-200 bg-green-50/50',   dot: 'bg-green-400'  },
  { stage: 'Rejected',             label: 'Rejected',    color: 'border-red-200 bg-red-50/50',       dot: 'bg-red-400'    },
]

const STAGE_TRANSITIONS: Record<string, string[]> = {
  'Application Received': ['Shortlisted', 'Rejected'],
  'Shortlisted':          ['Interview Scheduled', 'Rejected'],
  'Interview Scheduled':  ['Offer Made', 'Rejected'],
  'Offer Made':           ['Hired', 'Rejected'],
  'Hired':                [],
  'Rejected':             [],
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function daysSince(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`
}

export default function ClientApplicationsPage() {
  const [apps, setApps]       = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [moving, setMoving]   = useState<string | null>(null)

  const fetchApps = useCallback(() => {
    setLoading(true)
    clientApi.get('/applications', { params: { limit: 100 } })
      .then(r => setApps(r.data.data.applications))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function moveStage(appId: string, stage: string) {
    setMoving(appId)
    try {
      await clientApi.patch(`/applications/${appId}/stage`, { stage })
      setApps(prev => prev.map(a => a.id === appId ? { ...a, current_stage_name: stage } : a))
    } catch {
      // silent — could show toast
    } finally {
      setMoving(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>

  const byStage = (stage: string) => apps.filter(a => a.current_stage_name === stage)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Applications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{apps.length} total · Kanban view</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => {
          const colApps = byStage(col.stage)
          return (
            <div key={col.stage} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('h-2 w-2 rounded-full', col.dot)} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{col.label}</span>
                <span className="ml-auto text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                  {colApps.length}
                </span>
              </div>

              <div className={cn('rounded-xl border p-2 space-y-2 min-h-[120px]', col.color)}>
                {colApps.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-400">No candidates</div>
                )}
                {colApps.map(app => {
                  const nextStages = STAGE_TRANSITIONS[app.current_stage_name] ?? []
                  return (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0 overflow-hidden">
                          {app.profile_photo_url
                            ? <img src={app.profile_photo_url} alt="" className="h-full w-full object-cover" />
                            : getInitials(app.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{app.full_name}</p>
                          {app.current_designation && (
                            <p className="text-[10px] text-zinc-400 truncate">{app.current_designation}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{app.job_title}</span>
                      </div>

                      <p className="text-[10px] text-zinc-400">{daysSince(app.applied_at)}</p>

                      {nextStages.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-50 dark:border-zinc-800">
                          {nextStages.map(next => (
                            <button
                              key={next}
                              onClick={() => moveStage(app.id, next)}
                              disabled={moving === app.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 border border-zinc-100 dark:border-zinc-700 rounded-md transition-colors disabled:opacity-40"
                            >
                              {moving === app.id
                                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                : <ArrowRight className="h-2.5 w-2.5" />}
                              {next === 'Hired' ? 'Hire' : next === 'Rejected' ? 'Reject' : next.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
