import { useEffect, useState, useCallback } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  Loader2, Briefcase, ArrowRight, X, MapPin,
  Globe, BookOpen, FileText, Calendar, Award,
  User, ChevronDown, ExternalLink, Clock, Target, CheckCircle2,
  Video, Link2, Shield, Mic, Send, Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

interface Application {
  id: string; current_stage_name: string; status: string; applied_at: string
  candidate_id: string; full_name: string; email: string
  profile_photo_url: string | null; current_designation: string | null
  current_company: string | null; experience_years: number | null
  job_id: string; job_title: string; job_code: string
  profile_completion: number | null; intro_score: number | null; assessment_score: number | null
}

interface Detail {
  id: string; current_stage_name: string; applied_at: string; notes: string | null
  interview_slot_at: string | null; meeting_link: string | null
  job_id: string; job_title: string; job_code: string; work_mode: string | null; job_type: string | null
  candidate_id: string; full_name: string; email: string; mobile: string | null
  profile_photo_url: string | null; current_designation: string | null
  current_company: string | null; experience_years: number | null
  expected_salary: number | null; current_salary: number | null
  current_location: string | null; work_preference: string | null
  ai_score: number | null; ai_summary: string | null
  resume_url: string | null; professional_summary: string | null
  career_objective: string | null; linkedin_url: string | null
  portfolio_url: string | null; date_of_birth: string | null; gender: string | null
  voice_intro_url: string | null; voice_intro_duration: number | null
  github_url: string | null; skills_summary: string | null
  profile_completion: number | null; intro_score: number | null
  intro_transcript: string | null; intro_feedback: string | null
  education: any[]; experience: any[]; skills: any[]; certifications: any[]
  answers: any[]; assessment: any | null
}


const STAGE_TRANSITIONS: Record<string, string[]> = {
  'Application Received': ['Shortlisted', 'Rejected'],
  'Shortlisted':          ['Interview Scheduled', 'Rejected'],
  'Interview Scheduled':  ['Offer Made', 'Rejected'],
  'Offer Made':           ['Hired', 'Rejected'],
  'Hired':                [],
  'Rejected':             [],
}

function stageBadgeColor(stage: string) {
  const map: Record<string, string> = {
    'Application Received': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    'Shortlisted':          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    'Interview Scheduled':  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    'Offer Made':           'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    'Hired':                'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    'Rejected':             'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  }
  return map[stage] ?? 'bg-zinc-50 text-zinc-600 border-zinc-200'
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function daysSince(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`
}

function safeUrl(url: string | null | undefined): string {
  if (!url) return ''
  try { const u = new URL(url); return u.protocol.startsWith('http') ? url : '' }
  catch { return '' }
}

export default function ClientApplicationsPage() {
  const [apps, setApps]             = useState<Application[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [moving, setMoving]         = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail]         = useState<Detail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Interview scheduling modal
  const [ivModal, setIvModal]       = useState<{ appId: string } | null>(null)
  const [ivDateTime, setIvDateTime] = useState('')
  const [ivMeetLink, setIvMeetLink] = useState('')
  const [ivNote, setIvNote]         = useState('')
  const [ivSaving, setIvSaving]     = useState(false)

  const [search, setSearch]           = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  const fetchApps = useCallback(() => {
    setLoading(true)
    clientApi.get('/applications', { params: { limit: 100 } })
      .then(r => setApps(r.data.data.applications))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  function moveStage(appId: string, stage: string) {
    if (stage === 'Interview Scheduled') {
      setIvModal({ appId })
      setIvDateTime('')
      setIvMeetLink('')
      setIvNote('')
      return
    }
    void doMoveStage(appId, stage)
  }

  async function doMoveStage(appId: string, stage: string, extra?: { meet_link?: string; interview_date?: string; interview_note?: string }) {
    setMoving(appId)
    try {
      await clientApi.patch(`/applications/${appId}/stage`, { stage, ...extra })
      setApps(prev => prev.map(a => a.id === appId ? { ...a, current_stage_name: stage } : a))
      if (selectedId === appId && detail) {
        setDetail(prev => prev ? { ...prev, current_stage_name: stage } : null)
      }
    } catch { /* silent */ }
    finally { setMoving(null) }
  }

  async function handleScheduleInterview() {
    if (!ivModal || !ivDateTime) return
    setIvSaving(true)
    try {
      await doMoveStage(ivModal.appId, 'Interview Scheduled', {
        meet_link:      ivMeetLink || undefined,
        interview_date: ivDateTime,
        interview_note: ivNote || undefined,
      })
      setIvModal(null)
    } finally { setIvSaving(false) }
  }

  async function openDetail(id: string) {
    setSelectedId(id)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const { data } = await clientApi.get(`/applications/${id}`)
      setDetail(data.data)
    } catch { /* silent */ }
    finally { setLoadingDetail(false) }
  }

  const stageCounts = apps.reduce((acc, a) => {
    acc[a.current_stage_name] = (acc[a.current_stage_name] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filtered = apps.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.full_name.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q) || (a.current_designation ?? '').toLowerCase().includes(q)
    const matchStage = stageFilter === 'all' || a.current_stage_name === stageFilter
    return matchSearch && matchStage
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>

  return (
    <>
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[22px] font-black text-zinc-900 dark:text-white">Interview Pipeline</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">
            {apps.length === 0 ? 'No candidates scheduled yet' : `${apps.length} candidate${apps.length !== 1 ? 's' : ''} in your interview pipeline`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates…"
            className="pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-56"
          />
        </div>
      </div>

      {/* ── Stage filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all',                 label: 'All',         count: apps.length },
          { key: 'Interview Scheduled', label: 'Scheduled',   count: stageCounts['Interview Scheduled'] ?? 0 },
          { key: 'Offer Made',          label: 'Offer Made',  count: stageCounts['Offer Made'] ?? 0 },
          { key: 'Hired',               label: 'Hired',       count: stageCounts['Hired'] ?? 0 },
          { key: 'Rejected',            label: 'Rejected',    count: stageCounts['Rejected'] ?? 0 },
        ].map(({ key, label, count }) => {
          const isActive = stageFilter === key
          return (
            <button key={key} onClick={() => setStageFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                isActive
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-300 hover:text-amber-600'
              )}>
              {label}
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Candidate list ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
            <User className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-500">No scheduled interviews yet</p>
          <p className="text-xs text-zinc-400 mt-1">Candidates appear here once they pass all 3 gates and are scheduled for interview</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-2" layout>
          <AnimatePresence mode="popLayout">
          {filtered.map((app, i) => {
            const allGates = Number(app.profile_completion ?? 0) >= 95
              && Number(app.assessment_score ?? 0) >= 80
              && Number(app.intro_score ?? 0) >= 80
            const nextStages = (STAGE_TRANSITIONS[app.current_stage_name] ?? [])
              .filter(s => s !== 'Interview Scheduled' || allGates)
            return (
              <motion.div key={app.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, delay: i * 0.04, ease: 'easeOut' }}
                onClick={() => openDetail(app.id)}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-md transition-colors cursor-pointer">
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 ring-2 ring-zinc-100 dark:ring-zinc-800">
                    {app.profile_photo_url
                      ? <img src={app.profile_photo_url} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-white text-[13px] font-bold bg-gradient-to-br from-amber-500 to-orange-600">
                          {getInitials(app.full_name)}
                        </div>}
                  </div>

                  {/* Name + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-zinc-900 dark:text-white">{app.full_name}</p>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', stageBadgeColor(app.current_stage_name))}>
                        {app.current_stage_name}
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {[app.current_designation, app.current_company].filter(Boolean).join(' @ ') || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-100 dark:border-zinc-700">
                        <Briefcase className="h-3 w-3" />{app.job_title}
                      </span>
                      <span className="text-[11px] text-zinc-400">{daysSince(app.applied_at)}</span>
                    </div>
                  </div>

                  {/* Gate scores */}
                  <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                    {[
                      { label: 'Profile', value: Number(app.profile_completion ?? 0), target: 95 },
                      { label: 'Assess',  value: Number(app.assessment_score ?? 0),   target: 80 },
                      { label: 'Intro',   value: Number(app.intro_score ?? 0),        target: 80 },
                    ].map((g, gi) => {
                      const passed = g.value >= g.target
                      return (
                        <motion.div key={g.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 + gi * 0.06, duration: 0.2 }}
                          className={cn(
                          'flex flex-col items-center px-2.5 py-1.5 rounded-xl border text-center min-w-[52px]',
                          passed
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                            : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
                        )}>
                          <span className={cn('text-[13px] font-black leading-tight', passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400')}>
                            {g.value}<span className="text-[9px] font-semibold">%</span>
                          </span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">{g.label}</span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Stage action buttons */}
                  {nextStages.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {nextStages.map(next => (
                        <button key={next}
                          onClick={() => moveStage(app.id, next)}
                          disabled={moving === app.id}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all disabled:opacity-40',
                            next === 'Hired'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                              : next === 'Rejected'
                              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                              : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                          )}>
                          {moving === app.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <ArrowRight className="h-3 w-3" />}
                          {next === 'Hired' ? 'Hire' : next === 'Rejected' ? 'Reject' : next === 'Interview Scheduled' ? 'Schedule' : next.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>

    {/* ── Interview Scheduling Modal ── */}
    <AnimatePresence>
    {ivModal && (
      <motion.div
        key="iv-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <Video className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">Schedule Interview</p>
            </div>
            <button onClick={() => setIvModal(null)}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Interview Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={ivDateTime}
                  onChange={e => setIvDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Meeting Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="url"
                  value={ivMeetLink}
                  onChange={e => setIvMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Google Meet, Zoom, Teams, or any video link</p>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Note to Candidate
              </label>
              <textarea
                value={ivNote}
                onChange={e => setIvNote(e.target.value)}
                rows={2}
                placeholder="e.g. Please join 5 minutes early, bring your resume…"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setIvModal(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button type="button"
                onClick={handleScheduleInterview}
                disabled={!ivDateTime || ivSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {ivSaving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</>
                  : <><Video className="h-4 w-4" /> Schedule & Notify</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>

    <AnimatePresence>
    {selectedId && (
      <>
        <motion.div
          key="detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setSelectedId(null)} />
        <motion.div
          key="detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-zinc-950 z-50 shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              {detail && (
                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                  {detail.profile_photo_url
                    ? <img src={detail.profile_photo_url} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-amber-500 to-orange-600">
                        {getInitials(detail.full_name)}
                      </div>}
                </div>
              )}
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Application Detail</p>
            </div>
            <button onClick={() => setSelectedId(null)}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center flex-1 text-zinc-400 text-[13px]">
              Failed to load
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">

                {/* ── Candidate Screening Header ── */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 ring-2 ring-white/20">
                    {detail.profile_photo_url
                      ? <img src={detail.profile_photo_url} alt="" className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center text-white text-[22px] font-bold bg-gradient-to-br from-amber-500 to-orange-600">
                          {detail.full_name?.[0]?.toUpperCase() ?? <User className="h-6 w-6" />}
                        </div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[18px] font-bold text-white">{detail.full_name}</h2>
                      <span className={cn('text-[10px] font-semibold px-2.5 py-0.5 rounded-full border',
                        detail.current_stage_name === 'Hired' ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' :
                        detail.current_stage_name === 'Rejected' ? 'bg-red-400/20 text-red-300 border-red-400/30' :
                        'bg-amber-400/20 text-amber-300 border-amber-400/30')}>
                        {detail.current_stage_name}
                      </span>
                    </div>
                    {(detail.current_designation || detail.current_company) && (
                      <p className="text-[13px] text-zinc-300 mt-0.5">
                        {[detail.current_designation, detail.current_company].filter(Boolean).join(' @ ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                      {detail.experience_years != null && <span>{detail.experience_years} yrs exp</span>}
                      {detail.current_location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{detail.current_location}</span>
                      )}
                    </div>
                  </div>
                  {detail.ai_score != null && (
                    <div className="text-center shrink-0">
                      <div className="text-2xl font-black text-amber-400">{Math.round(detail.ai_score)}%</div>
                      <div className="text-[10px] text-zinc-400">AI Match</div>
                    </div>
                  )}
                </div>

                {/* ── 3-Gate Scores + Intro Recording — at top ── */}
                <JourneyScoresSection detail={detail} onMeetingLinkSent={(link) => setDetail(d => d ? { ...d, meeting_link: link } : d)} />

                {/* ── Stage Actions ── */}
                {(() => {
                  const dAllGates = Number(detail.profile_completion ?? 0) >= 95
                    && Number(detail.assessment?.assessment_score ?? 0) >= 80
                    && Number(detail.intro_score ?? 0) >= 80
                  const dNextStages = (STAGE_TRANSITIONS[detail.current_stage_name] ?? [])
                    .filter(s => s !== 'Interview Scheduled' || dAllGates)
                  return dNextStages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Move Candidate</p>
                    <div className="flex flex-wrap gap-2">
                      {dNextStages.map(next => (
                        <button key={next}
                          onClick={() => moveStage(detail.id, next)}
                          disabled={moving === detail.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                          style={{
                            background: next === 'Hired' ? 'linear-gradient(135deg,#10b981,#059669)' :
                                        next === 'Rejected' ? 'linear-gradient(135deg,#ef4444,#dc2626)' :
                                        'linear-gradient(135deg,#f59e0b,#d97706)',
                            color: 'white',
                            boxShadow: next === 'Hired' ? '0 2px 8px rgba(16,185,129,0.3)' :
                                       next === 'Rejected' ? '0 2px 8px rgba(239,68,68,0.3)' :
                                       '0 2px 8px rgba(245,158,11,0.3)',
                          }}>
                          {moving === detail.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <ArrowRight className="h-3.5 w-3.5" />}
                          {next === 'Hired' ? 'Hire' : next === 'Rejected' ? 'Reject' : next}
                        </button>
                      ))}
                    </div>
                  </div>
                  )
                })()}

                {/* ── Quick Info Grid ── */}
                <div className="grid grid-cols-2 gap-3">
                  {detail.email && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Email</p>
                      <a href={`mailto:${detail.email}`} className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate block hover:text-amber-600 transition-colors">{detail.email}</a>
                    </div>
                  )}
                  {detail.mobile && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Phone</p>
                      <a href={`tel:${detail.mobile}`} className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate block hover:text-amber-600 transition-colors">{detail.mobile}</a>
                    </div>
                  )}
                  {(detail.expected_salary != null) && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Expected CTC</p>
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">₹{Number(detail.expected_salary).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {(detail.current_salary != null) && (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Current CTC</p>
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">₹{Number(detail.current_salary).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {/* ── Links ── */}
                <div className="flex flex-wrap gap-2">
                  {safeUrl(detail.resume_url) && (
                    <a href={safeUrl(detail.resume_url)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 transition-colors">
                      <FileText className="h-3.5 w-3.5" /> Resume
                    </a>
                  )}
                  {safeUrl(detail.linkedin_url) && (
                    <a href={safeUrl(detail.linkedin_url)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Globe className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                  {safeUrl(detail.github_url) && (
                    <a href={safeUrl(detail.github_url)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors">
                      <BookOpen className="h-3.5 w-3.5" /> GitHub
                    </a>
                  )}
                  {safeUrl(detail.portfolio_url) && (
                    <a href={safeUrl(detail.portfolio_url)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                    </a>
                  )}
                </div>

                {/* ── Applied Job Info ── */}
                <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Applied For</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{detail.job_title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-zinc-500">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{detail.job_type}</span>
                    {detail.work_mode && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{detail.work_mode}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{daysSince(detail.applied_at)}</span>
                  </div>
                </div>


                {/* ── Career Objective / Professional Summary ── */}
                {detail.career_objective && (
                  <Section title="Career Objective">
                    <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{detail.career_objective}</p>
                  </Section>
                )}
                {detail.professional_summary && (
                  <Section title="Professional Summary">
                    <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{detail.professional_summary}</p>
                  </Section>
                )}

                {/* ── Skills ── */}
                {(detail.skills && detail.skills.length > 0) && (
                  <Section title={`Skills (${detail.skills.length})`}>
                    <div className="flex flex-wrap gap-2">
                      {detail.skills.map((s: any, i: number) => (
                        <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
                          {s.skill_name}
                          {s.proficiency_level && <span className="text-[10px] text-amber-400">· {s.proficiency_level}</span>}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Work Experience ── */}
                {(detail.experience && detail.experience.length > 0) && (
                  <Section title={`Experience (${detail.experience.length})`}>
                    <div className="space-y-3">
                      {detail.experience.map((ex: any, i: number) => (
                        <div key={i} className="border-l-2 border-amber-300 pl-4 pb-1">
                          <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{ex.designation}</p>
                          <p className="text-[12px] text-zinc-600">{ex.company_name}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {ex.joining_date ? new Date(ex.joining_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                            {' — '}
                            {ex.is_current ? 'Present' : (ex.relieving_date ? new Date(ex.relieving_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '')}
                          </p>
                          {ex.roles_responsibilities && (
                            <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{ex.roles_responsibilities}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Education ── */}
                {(detail.education && detail.education.length > 0) && (
                  <Section title={`Education (${detail.education.length})`}>
                    <div className="space-y-2">
                      {detail.education.map((ed: any, i: number) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                          <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                            {ed.degree}{ed.specialization ? ` — ${ed.specialization}` : ''}
                          </p>
                          <p className="text-[12px] text-zinc-600">{ed.institution}</p>
                          {(ed.passing_year || ed.percentage_grade) && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">{ed.passing_year}{ed.percentage_grade ? ` · ${ed.percentage_grade}%` : ''}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Certifications ── */}
                {(detail.certifications && detail.certifications.length > 0) && (
                  <Section title={`Certifications (${detail.certifications.length})`}>
                    <div className="space-y-2">
                      {detail.certifications.map((cert: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                          <Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{cert.certification_name}</p>
                            {cert.issuing_organization && (
                              <p className="text-[12px] text-zinc-500">{cert.issuing_organization}</p>
                            )}
                            {cert.issue_date && (
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {new Date(cert.issue_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                {cert.expiry_date ? ` — ${new Date(cert.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Assessment Results ── */}
                {detail.assessment && detail.assessment.assessment_status === 'completed' && (
                  <AssessmentResultSection assessment={detail.assessment} />
                )}

                {/* ── Application Answers ── */}
                {(detail.answers && detail.answers.length > 0) && (
                  <Section title="Application Answers">
                    <div className="space-y-3">
                      {detail.answers.map((a: any, i: number) => (
                        <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                          <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{a.question_text}</p>
                          <p className="text-[12px] text-zinc-500">{a.answer_text}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}


              </div>
            </div>
          )}
        </motion.div>
      </>
    )}
    </AnimatePresence>
    </>
  )
}

function JourneyScoresSection({ detail, onMeetingLinkSent }: { detail: Detail; onMeetingLinkSent: (link: string) => void }) {
  const [meetLink, setMeetLink] = useState(detail.meeting_link ?? '')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(!!detail.meeting_link)
  const [showIntro, setShowIntro] = useState(false)

  const profile    = Number(detail.profile_completion ?? 0)
  const assessment = Number(detail.assessment?.assessment_score ?? 0)
  const intro      = Number(detail.intro_score ?? 0)
  const allGates   = profile >= 95 && assessment >= 80 && intro >= 80

  async function sendMeetingLink() {
    if (!meetLink.trim()) return
    setSending(true)
    try {
      await clientApi.patch(`/applications/${detail.id}/meeting-link`, { meeting_link: meetLink.trim() })
      setSent(true)
      onMeetingLinkSent(meetLink.trim())
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  return (
    <Section title="Candidate Journey">
      {/* Gate scores */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Profile', value: profile, unit: '%', target: 95, icon: User },
          { label: 'Assessment', value: assessment, unit: '%', target: 80, icon: Target },
          { label: 'Intro Score', value: intro, unit: '/100', target: 80, icon: Mic },
        ].map(g => {
          const passed = g.value >= g.target
          return (
            <div key={g.label} className={`rounded-xl p-2.5 border text-center ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
              <g.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${passed ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <p className={`text-[17px] font-black leading-none ${passed ? 'text-emerald-700' : 'text-zinc-700'}`}>{g.value}{g.unit}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">{g.label}</p>
              {passed && <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mt-0.5" />}
            </div>
          )
        })}
      </div>

      {/* Gates status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${allGates ? 'bg-emerald-50 border border-emerald-200' : 'bg-zinc-100 border border-zinc-200'}`}>
        <Shield className={`h-4 w-4 shrink-0 ${allGates ? 'text-emerald-600' : 'text-zinc-400'}`} />
        <p className={`text-[12px] font-semibold ${allGates ? 'text-emerald-700' : 'text-zinc-500'}`}>
          {allGates ? '✓ All 3 gates cleared — candidate is interview-ready' : 'Not all gates cleared yet'}
        </p>
      </div>

      {/* Interview slot */}
      {detail.interview_slot_at && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 mb-3">
          <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
          <div>
            <p className="text-[11.5px] font-bold text-indigo-700">Preferred Interview Slot</p>
            <p className="text-[11px] text-indigo-500">
              {new Date(detail.interview_slot_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      )}

      {/* Intro recording — always visible to client for screening */}
      {detail.voice_intro_url && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Video className="h-3 w-3" /> Introduction Recording
          </p>
          {/video-/.test(detail.voice_intro_url) || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(detail.voice_intro_url) ? (
            <video controls src={detail.voice_intro_url} className="w-full rounded-xl max-h-52 bg-black" />
          ) : (
            <audio controls src={detail.voice_intro_url} className="w-full" />
          )}
          {detail.voice_intro_duration && (
            <p className="text-[11px] text-zinc-400 mt-1">{Math.round(detail.voice_intro_duration)}s</p>
          )}
        </div>
      )}

      {detail.intro_transcript && (
        <div className="mb-3">
          <button onClick={() => setShowIntro(x => !x)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-indigo-600 transition-colors mb-1.5">
            <Mic className="h-3.5 w-3.5" />
            {showIntro ? 'Hide intro ↑' : 'View candidate intro ↓'}
          </button>
          {showIntro && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              {detail.intro_feedback && (
                <p className="text-[11px] font-bold text-violet-600 mb-1.5">AI Feedback: {detail.intro_feedback}</p>
              )}
              <p className="text-[12px] text-slate-600 italic leading-relaxed">"{detail.intro_transcript}"</p>
            </div>
          )}
        </div>
      )}

      {/* Resume download */}
      {detail.resume_url && (
        <a href={detail.resume_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors mb-3">
          <FileText className="h-4 w-4 text-zinc-500" />
          <span className="text-[12px] font-semibold text-zinc-700">Download Resume</span>
          <ExternalLink className="h-3 w-3 text-zinc-400 ml-auto" />
        </a>
      )}

      {/* Meeting link sender */}
      {detail.interview_slot_at && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <p className="text-[11px] font-bold text-indigo-700 mb-2 flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {sent ? 'Meeting link sent ✓' : 'Send meeting link to candidate'}
          </p>
          <div className="flex gap-2">
            <input
              value={meetLink}
              onChange={e => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:border-indigo-400"
            />
            <button onClick={sendMeetingLink} disabled={sending || !meetLink.trim() || sent}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold rounded-lg disabled:opacity-50 transition-colors shrink-0">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sent ? 'Sent' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function AssessmentResultSection({ assessment }: { assessment: any }) {
  const [expanded, setExpanded] = useState(false)
  const answers: any[] = Array.isArray(assessment.answers_submitted_json)
    ? assessment.answers_submitted_json : []

  return (
    <Section title="Assessment Result">
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
        {/* Score header */}
        <button
          className="w-full flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 text-left"
          onClick={() => answers.length > 0 && setExpanded(e => !e)}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">{assessment.assessment_title}</p>
              <p className="text-[11px] text-zinc-500">{assessment.scored_marks}/{assessment.total_marks} marks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold px-3 py-1 rounded-full',
              assessment.assessment_passed
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400')}>
              {Math.round(assessment.assessment_score)}%
            </span>
            {answers.length > 0 && (
              <ChevronDown className={cn('h-4 w-4 text-zinc-400 transition-transform', expanded && 'rotate-180')} />
            )}
          </div>
        </button>

        {/* Per-question breakdown */}
        {expanded && answers.length > 0 && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {answers.map((q: any, i: number) => (
              <div key={i} className="p-3 bg-white dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 flex-1">
                    <span className="text-zinc-400 mr-1">Q{i + 1}.</span>{q.question_title}
                  </p>
                  <span className={cn('shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                    q.is_correct
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400')}>
                    {q.marks_scored}/{q.marks_available}
                  </span>
                </div>
                {q.selected_options && (
                  <p className="text-[11px] text-zinc-500 mb-0.5">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Answered: </span>
                    {Array.isArray(q.selected_options) ? q.selected_options.join(', ') : q.selected_options}
                  </p>
                )}
                {!q.is_correct && q.correct_options && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">Correct: </span>
                    {Array.isArray(q.correct_options) ? q.correct_options.join(', ') : q.correct_options}
                  </p>
                )}
                {q.text_answer && (
                  <p className="text-[11px] text-zinc-500 mt-0.5 italic">"{q.text_answer}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}
