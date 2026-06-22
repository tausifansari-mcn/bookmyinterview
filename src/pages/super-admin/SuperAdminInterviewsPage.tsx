import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  Loader2, Video, Calendar, Clock, User, Building2, MessageSquare,
  CheckCircle2, XCircle, Search, Headphones, Mic, FileText, Play,
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
  mediator_joined_at: string | null
  candidate_name: string
  candidate_email: string
  profile_photo_url: string | null
  current_designation: string | null
  job_title: string
  company_name: string
  application_id: string
  mediator_name: string | null
  transcript_count: number
}

interface Transcript {
  id: string
  transcript_text: string | null
  transcript_json: any
  recording_url: string | null
  recording_duration_secs: number | null
  captured_by: string | null
  captured_at: string
}

interface Recording {
  id: string
  recording_url: string
  segment_index: number
  duration_seconds: number | null
  created_at: string
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

export default function SuperAdminInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [mediatorNotes, setMediatorNotes] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [recordingUrl, setRecordingUrl] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = filter ? `?scheduling_status=${filter}` : ''
      const { data } = await superAdminApi.get(`/interviews${params}`)
      setInterviews(data.data.interviews)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  async function loadDetail(id: string) {
    try {
      const { data } = await superAdminApi.get(`/interviews/${id}`)
      setDetail(data.data)
      setMediatorNotes(data.data.mediator_notes || '')
    } catch { }
  }

  async function handleJoin(id: string) {
    try {
      await superAdminApi.post(`/interviews/${id}/join`)
      setActionMsg('Joined as mediator!')
      load()
      setTimeout(() => setActionMsg(''), 3000)
    } catch { }
  }

  async function handleComplete(id: string) {
    try {
      await superAdminApi.post(`/interviews/${id}/complete`, { mediator_notes: mediatorNotes })
      setActionMsg('Interview completed!')
      load()
      setTimeout(() => setActionMsg(''), 3000)
    } catch { }
  }

  async function handleSaveTranscript(id: string) {
    if (!transcriptText.trim() && !recordingUrl.trim()) return
    try {
      await superAdminApi.post(`/interviews/${id}/transcript`, {
        transcript_text: transcriptText,
        recording_url: recordingUrl || undefined,
      })
      setActionMsg('Transcript saved!')
      setTranscriptText('')
      setRecordingUrl('')
      loadDetail(id)
      setTimeout(() => setActionMsg(''), 3000)
    } catch { }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Mediated Interviews</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Monitor and capture interview transcripts</p>
        </div>
        {actionMsg && (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{actionMsg}</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['', 'meeting_shared', 'in_progress', 'completed'].map(s => (
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
        <div className="text-center py-12 text-zinc-400 text-sm">No mediated interviews found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {interviews.map(iv => (
            <div key={iv.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {iv.candidate_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{iv.candidate_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{iv.job_title} <span className="text-zinc-400">at {iv.company_name}</span></p>
                  </div>
                </div>
                <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0', STATUS_STYLES[iv.scheduling_status] || '')}>
                  {iv.scheduling_status?.replace(/_/g, ' ') || iv.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 mb-3">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{iv.candidate_proposed_at ? formatDate(iv.candidate_proposed_at) : 'TBD'}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{iv.duration_mins} min</span>
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{iv.candidate_email}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{iv.transcript_count} transcripts</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {iv.scheduling_status === 'meeting_shared' && (
                  <button onClick={() => handleJoin(iv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                    <Headphones className="h-3.5 w-3.5" /> Join as Mediator
                  </button>
                )}
                {iv.mediator_name && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1"><User className="h-3 w-3" />{iv.mediator_name}</span>
                )}
                <button onClick={() => loadDetail(iv.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs rounded-lg transition-colors">
                  <Video className="h-3.5 w-3.5" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-600">{detail.company_name}</span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{detail.candidate_name}</h2>
                <p className="text-sm text-zinc-500">{detail.job_title} &middot; {detail.round_name}</p>
              </div>
              <button onClick={() => setDetail(null)}
                className="text-zinc-400 hover:text-zinc-600"><XCircle className="h-5 w-5" /></button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm mb-6">
              <div><span className="text-xs text-zinc-400 block">Status</span>
                <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium inline-block mt-1', STATUS_STYLES[detail.scheduling_status] || '')}>{detail.scheduling_status?.replace(/_/g, ' ')}</span>
              </div>
              <div><span className="text-xs text-zinc-400 block">Proposed</span><span className="font-medium">{formatDate(detail.candidate_proposed_at)}</span></div>
              <div><span className="text-xs text-zinc-400 block">Acknowledged</span><span className="font-medium">{formatDate(detail.client_acknowledged_at)}</span></div>
              <div><span className="text-xs text-zinc-400 block">Meeting</span>
                {detail.meeting_link
                  ? <a href={detail.meeting_link} target="_blank" className="text-indigo-600 hover:underline text-xs">{detail.meeting_link}</a>
                  : <span className="text-zinc-400">Not shared</span>}
              </div>
              <div><span className="text-xs text-zinc-400 block">Mediator</span><span className="font-medium">{detail.mediator_name || 'Not joined'}</span></div>
              <div><span className="text-xs text-zinc-400 block">Assessment</span>
                <span className={cn('text-xs font-medium', detail.assessment_passed ? 'text-emerald-600' : 'text-zinc-400')}>
                  {detail.assessment_score != null ? `${detail.assessment_score}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Mediator Actions */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-4">
              {detail.scheduling_status === 'meeting_shared' && (
                <button onClick={() => handleJoin(detail.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <Headphones className="h-4 w-4" /> Join Interview as Mediator
                </button>
              )}

              {/* Mediator Notes */}
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">Mediator Notes</label>
                <textarea value={mediatorNotes} onChange={e => setMediatorNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => handleComplete(detail.id)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <CheckCircle2 className="h-4 w-4" /> Complete Interview
                </button>
              </div>

              {/* Transcript */}
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1 flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> Add Transcript</label>
                <textarea value={transcriptText} onChange={e => setTranscriptText(e.target.value)} rows={4} placeholder="Paste interview transcript here..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} placeholder="Recording URL (optional)"
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={() => handleSaveTranscript(detail.id)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <FileText className="h-4 w-4" /> Save Transcript
                </button>
              </div>

              {/* Existing Transcripts */}
              {detail.transcripts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Captured Transcripts ({detail.transcripts.length})</h4>
                  <div className="space-y-2">
                    {detail.transcripts.map((t: Transcript) => (
                      <div key={t.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-400">{new Date(t.captured_at).toLocaleString('en-IN')}</span>
                          {t.recording_duration_secs && <span className="text-[10px] text-zinc-400">{Math.floor(t.recording_duration_secs / 60)}m {t.recording_duration_secs % 60}s</span>}
                        </div>
                        {t.transcript_text && <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3">{t.transcript_text}</p>}
                        {t.recording_url && (
                          <a href={t.recording_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 mt-1">
                            <Play className="h-3 w-3" /> Play Recording
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
