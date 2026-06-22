import { useEffect, useState } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  Loader2, Video, Calendar, Clock, CheckCircle2, XCircle,
  ExternalLink, MessageSquare, User, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Interview {
  id: string
  round_name: string
  interview_type: string
  mode: string
  scheduled_at: string | null
  duration_mins: number
  meeting_link: string | null
  status: string
  scheduling_status: string
  candidate_proposed_at: string | null
  client_acknowledged_at: string | null
  candidate_notes: string | null
  mediator_notes: string | null
  candidate_name: string
  candidate_email: string
  profile_photo_url: string | null
  current_designation: string | null
  job_title: string
  application_id: string
  transcript_count: number
}

const STATUS_STYLES: Record<string, string> = {
  pending_candidate: 'bg-amber-50 text-amber-700',
  candidate_scheduled: 'bg-blue-50 text-blue-700',
  client_acknowledged: 'bg-purple-50 text-purple-700',
  meeting_shared: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-green-50 text-green-700',
  completed: 'bg-zinc-100 text-zinc-600',
  cancelled: 'bg-red-50 text-red-600',
}

function formatDate(d: string | null) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ClientInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState<Interview | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [meetingLink, setMeetingLink] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = filter ? `?scheduling_status=${filter}` : ''
      const { data } = await clientApi.get(`/interviews${params}`)
      setInterviews(data.data.interviews)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  async function handleAcknowledge(id: string) {
    try {
      await clientApi.post(`/interviews/${id}/acknowledge`)
      setActionMsg('Interview acknowledged!')
      load()
      if (detail?.id === id) {
        const { data } = await clientApi.get(`/interviews/${id}`)
        setDetail(data.data)
      }
      setTimeout(() => setActionMsg(''), 3000)
    } catch { }
  }

  async function handleShareLink(id: string) {
    if (!meetingLink.trim()) return
    try {
      await clientApi.post(`/interviews/${id}/meeting-link`, { meeting_link: meetingLink })
      setActionMsg('Meeting link shared!')
      setShowLinkForm(false)
      setMeetingLink('')
      load()
      if (detail?.id === id) {
        const { data } = await clientApi.get(`/interviews/${id}`)
        setDetail(data.data)
      }
      setTimeout(() => setActionMsg(''), 3000)
    } catch { }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Interviews</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage candidate interviews</p>
        </div>
        {actionMsg && (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{actionMsg}</span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'candidate_scheduled', 'client_acknowledged', 'meeting_shared', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === s
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">No interviews found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {interviews.map(iv => (
            <div key={iv.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {iv.candidate_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{iv.candidate_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{iv.job_title}</p>
                  </div>
                </div>
                <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap shrink-0', STATUS_STYLES[iv.scheduling_status] || '')}>
                  {iv.scheduling_status?.replace(/_/g, ' ') || iv.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-500 mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{iv.candidate_proposed_at ? formatDate(iv.candidate_proposed_at) : 'Awaiting scheduling'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{iv.duration_mins} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{iv.candidate_email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {iv.scheduling_status === 'candidate_scheduled' && (
                  <button onClick={() => handleAcknowledge(iv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge
                  </button>
                )}
                {(iv.scheduling_status === 'client_acknowledged') && (
                  <button onClick={() => { setDetail(iv); setShowLinkForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> Share Link
                  </button>
                )}
                {iv.meeting_link && (
                  <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Video className="h-3.5 w-3.5" /> Join
                  </a>
                )}
                <button onClick={async () => {
                  const { data } = await clientApi.get(`/interviews/${iv.id}`)
                  setDetail(data.data)
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs rounded-lg transition-colors">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meeting Link Dialog */}
      {showLinkForm && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Share Meeting Link</h3>
            <p className="text-xs text-zinc-500 mb-4">For {detail.candidate_name} - {detail.job_title}</p>
            <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />
            <div className="flex items-center gap-3">
              <button onClick={() => handleShareLink(detail.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Share Link
              </button>
              <button onClick={() => setShowLinkForm(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {detail && !showLinkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Interview Detail</h3>
                <p className="text-xs text-zinc-500">{detail.candidate_name} - {detail.job_title}</p>
              </div>
              <button onClick={() => { setDetail(null); setShowLinkForm(false) }}
                className="text-zinc-400 hover:text-zinc-600"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-zinc-400 block">Status</span>
                <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium inline-block mt-1', STATUS_STYLES[detail.scheduling_status] || '')}>
                  {detail.scheduling_status?.replace(/_/g, ' ') || detail.status}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Round</span>
                <span className="font-medium text-zinc-900 dark:text-white">{detail.round_name}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Proposed Date</span>
                <span className="font-medium text-zinc-900 dark:text-white">{formatDate(detail.candidate_proposed_at)}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block">Acknowledged</span>
                <span className="font-medium text-zinc-900 dark:text-white">{formatDate(detail.client_acknowledged_at)}</span>
              </div>
              {detail.candidate_notes && (
                <div className="col-span-2">
                  <span className="text-xs text-zinc-400 block">Candidate Notes</span>
                  <p className="text-zinc-700 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">{detail.candidate_notes}</p>
                </div>
              )}
              {detail.mediator_notes && (
                <div className="col-span-2">
                  <span className="text-xs text-zinc-400 block">Mediator Notes</span>
                  <p className="text-zinc-700 dark:text-zinc-300 mt-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">{detail.mediator_notes}</p>
                </div>
              )}
              {detail.transcript_count > 0 && (
                <div className="col-span-2">
                  <span className="text-xs text-zinc-400 block flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Transcripts</span>
                  <span className="text-sm text-emerald-600 font-medium">{detail.transcript_count} transcript(s) captured</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
