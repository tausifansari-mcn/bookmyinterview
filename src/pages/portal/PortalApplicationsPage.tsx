import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { motion, AnimatePresence } from 'motion/react'
import {
  Briefcase, CalendarDays, CheckCircle2, ClipboardCheck, FileText, Loader2, MapPin,
  Sparkles, TrendingUp, Trophy, Calendar, X, Lock, Unlock, Mic, Shield,
  ChevronDown, ChevronUp,
} from 'lucide-react'

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  active:         { label: 'Under Review',   cls: 'bg-blue-50 text-blue-700 border-blue-100',         dot: 'bg-blue-500'    },
  selected:       { label: 'Shortlisted',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  rejected:       { label: 'Not Selected',   cls: 'bg-rose-50 text-rose-700 border-rose-100',          dot: 'bg-rose-500'    },
  withdrawn:      { label: 'Withdrawn',      cls: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400'   },
  on_hold:        { label: 'On Hold',        cls: 'bg-amber-50 text-amber-700 border-amber-100',       dot: 'bg-amber-500'   },
  offer_extended: { label: 'Offer Extended', cls: 'bg-violet-50 text-violet-700 border-violet-100',    dot: 'bg-violet-500'  },
  offer_accepted: { label: 'Offer Accepted', cls: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-600' },
  offer_declined: { label: 'Offer Declined', cls: 'bg-orange-50 text-orange-700 border-orange-100',    dot: 'bg-orange-500'  },
  joined:         { label: 'Joined 🎉',      cls: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-600' },
}

const STATUS_STEP: Record<string, number> = {
  active: 1, on_hold: 1,
  selected: 2, offer_extended: 3, offer_accepted: 3, offer_declined: 3, joined: 3,
  rejected: -1, withdrawn: -1,
}

const PIPELINE = ['Applied', 'In Review', 'Shortlisted', 'Offer']
const JOB_GRADS = [
  'from-indigo-500 to-indigo-600', 'from-violet-500 to-violet-600',
  'from-emerald-500 to-teal-600',  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-500',  'from-sky-500 to-cyan-600',
]
const getGrad = (s: string) => JOB_GRADS[(s?.charCodeAt(0) ?? 0) % JOB_GRADS.length]

function GateBadge({ passed, label }: { passed: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
      passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
    }`}>
      {passed ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {label}
    </span>
  )
}

export default function PortalApplicationsPage() {
  const { candidate } = useCandidateAuth()
  const navigate = useNavigate()
  const [apps, setApps]           = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showSchedule, setShowSchedule] = useState<string | null>(null)
  const [slotDate, setSlotDate]   = useState('')
  const [slotTime, setSlotTime]   = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState('')
  const [expandedGates, setExpandedGates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!candidate) { navigate('/portal/login'); return }
    portalApi.get('/applications')
      .then(r => setApps(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [candidate, navigate])

  async function handleSelectSlot(appId: string) {
    if (!slotDate || !slotTime) return
    setScheduling(true)
    setScheduleMsg('')
    try {
      const slot_at = new Date(`${slotDate}T${slotTime}`).toISOString()
      await portalApi.post(`/applications/${appId}/select-slot`, { slot_at })
      setScheduleMsg('Interview slot confirmed! The client will share a meeting link shortly.')
      setApps(prev => prev.map(a => a.id === appId ? { ...a, interview_slot_at: slot_at } : a))
      setTimeout(() => { setShowSchedule(null); setScheduleMsg('') }, 3000)
    } catch (err: any) {
      setScheduleMsg(err?.response?.data?.message ?? 'Failed. Please try again.')
    } finally {
      setScheduling(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const activeCount   = apps.filter(a => ['active', 'on_hold'].includes(a.status)).length
  const positiveCount = apps.filter(a => ['selected', 'offer_extended', 'offer_accepted', 'joined'].includes(a.status)).length

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold text-indigo-700 mb-2.5"
            style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
            <Sparkles className="h-3.5 w-3.5" /> Application Tracker
          </div>
          <h1 className="text-[20px] sm:text-[26px] font-bold text-slate-900 leading-tight">My Applications</h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-slate-500 mt-1">Track every role from first review to final decision</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/portal/intro"
            className="shrink-0 flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl border-2 border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors">
            <Mic className="h-4 w-4" /> Short Intro
          </Link>
          <Link to="/portal/jobs" className="shrink-0 flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
            <Briefcase className="h-4 w-4" /> Browse Jobs
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
        {[
          { label: 'Total',  value: loading ? '…' : apps.length,      icon: FileText,   from: '#6366f1', bg: '#eef2ff' },
          { label: 'Active', value: loading ? '…' : activeCount,      icon: TrendingUp, from: '#0ea5e9', bg: '#e0f2fe' },
          { label: 'Wins',   value: loading ? '…' : positiveCount,    icon: Trophy,     from: '#10b981', bg: '#d1fae5' },
        ].map(s => (
          <motion.div key={s.label}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
            className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all"
            style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <s.icon style={{ width: 17, height: 17, color: s.from }} />
            </div>
            <div>
              <p className="text-[22px] sm:text-[26px] font-bold text-slate-900 leading-none">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 3-Gate explainer ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5"
        style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-indigo-600" />
          <p className="text-[13px] font-bold text-slate-800">3-Gate Interview Process</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {[
            { num: 1, label: 'Profile 95%+', desc: 'Complete your profile', icon: '👤' },
            { num: 2, label: 'Assessment 80%+', desc: 'Pass the skills test', icon: '📋' },
            { num: 3, label: 'Intro 80%+', desc: 'Submit short intro', icon: '🎤' },
          ].map(g => (
            <div key={g.num} className="flex items-center gap-3 flex-1 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              <span className="text-lg">{g.icon}</span>
              <div>
                <p className="text-[12px] font-bold text-slate-700">Gate {g.num}: {g.label}</p>
                <p className="text-[11px] text-slate-400">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-slate-500 mt-3">
          Clear all 3 gates → unlock interview scheduling → client sends meeting link
        </p>
      </div>

      {/* ── Applications list ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '2px dashed #e8edf8' }}>
          <FileText className="mx-auto h-12 w-12 text-slate-200" />
          <p className="mt-4 text-[15px] font-bold text-slate-800">No applications yet</p>
          <p className="mt-1.5 text-[13px] text-slate-400 max-w-sm mx-auto">
            Apply to roles that match your profile and they'll appear here.
          </p>
          <Link to="/portal/jobs"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700 transition-colors">
            <Briefcase className="h-4 w-4" /> Browse Open Jobs
          </Link>
        </div>
      ) : (
        <motion.div
          className="space-y-3 sm:space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {apps.map(app => {
            const s     = STATUS[app.status] ?? { label: app.status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
            const step  = STATUS_STEP[app.status] ?? 0
            const grad  = getGrad(app.job_title ?? '')
            const init  = (app.job_title?.[0] ?? 'J').toUpperCase()
            const isFailed = ['rejected', 'withdrawn', 'offer_declined'].includes(app.status)
            const g1 = app.gate1_passed, g2 = app.gate2_passed, g3 = app.gate3_passed
            const allGates = app.all_gates_passed
            const gatesOpen = expandedGates[app.id]

            return (
              <motion.div key={app.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
                className="bg-white rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                {/* Top: logo + title + badge */}
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-[13px] sm:text-[15px] font-bold text-white shrink-0`}>
                    {init}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 justify-between">
                      <h3 className="text-[13.5px] sm:text-[15px] font-bold text-slate-900 leading-tight truncate">
                        {app.job_title}
                      </h3>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11.5px] text-slate-400">
                      {app.department_name && (
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{app.department_name}</span>
                      )}
                      {app.location_city && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location_city}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />Applied {formatDate(app.applied_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gate status row */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setExpandedGates(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
                      <Shield className="h-3 w-3" /> Gates
                      {gatesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    <GateBadge passed={g1} label="Profile 95%" />
                    <GateBadge passed={g2} label="Assessment 80%" />
                    <GateBadge passed={g3} label="Intro 80%" />
                    {allGates && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                        <Unlock className="h-3 w-3" /> Interview Unlocked
                      </span>
                    )}
                  </div>

                  {gatesOpen && (
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Profile', value: app.profile_completion ?? 0, unit: '%', target: 95, action: '/portal/profile' },
                        { label: 'Assessment', value: Math.round(Number(app.assessment_score ?? 0)), unit: '%', target: 80, action: app.assessment_token ? `/portal/assessment/${app.assessment_token}` : null },
                        { label: 'Intro', value: Math.round(Number(app.intro_score ?? 0)), unit: '/100', target: 80, action: '/portal/intro' },
                      ].map(g => {
                        const pct = Math.min(100, Number(g.value))
                        const done = pct >= g.target
                        return (
                          <div key={g.label} className={`rounded-xl p-2.5 border text-center ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-[10px] font-bold text-slate-500 mb-1">{g.label}</p>
                            <p className={`text-[18px] font-black leading-none ${done ? 'text-emerald-600' : 'text-slate-700'}`}>
                              {g.value}{g.unit}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Target: {g.target}{g.unit}</p>
                            {!done && g.action && (
                              <Link to={g.action}
                                className="mt-1.5 inline-block text-[9.5px] font-bold text-indigo-600 hover:underline">
                                Improve →
                              </Link>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Assessment banner (pending) */}
                {app.assessment_token && (app.assessment_status === 'invited' || app.assessment_status === 'started') && (
                  <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <ClipboardCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                      <p className="text-[12px] font-semibold text-indigo-700 truncate">
                        {app.assessment_status === 'started' ? 'Resume your assessment' : `Complete: ${app.assessment_title ?? 'Assessment'}`}
                      </p>
                    </div>
                    <Link to={`/portal/assessment/${app.assessment_token}`}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                      {app.assessment_status === 'started' ? 'Continue' : 'Start Now'}
                    </Link>
                  </div>
                )}

                {/* Assessment done */}
                {app.assessment_status === 'completed' && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    Number(app.assessment_score ?? 0) >= 80
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-amber-50 border-amber-100'
                  }`}>
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${Number(app.assessment_score ?? 0) >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <p className={`text-[12px] font-semibold ${Number(app.assessment_score ?? 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      Assessment complete · {Math.round(Number(app.assessment_score ?? 0))}%
                      {Number(app.assessment_score ?? 0) >= 80 ? ' · Gate 2 Passed ✓' : ' · Need 80% to pass'}
                    </p>
                  </div>
                )}

                {/* Intro gate prompt */}
                {app.assessment_status === 'completed' && Number(app.assessment_score ?? 0) >= 80 && !g3 && (
                  <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Mic className="h-4 w-4 text-violet-600 shrink-0" />
                      <p className="text-[12px] font-semibold text-violet-700">Complete Gate 3: Submit your short intro</p>
                    </div>
                    <Link to="/portal/intro"
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors">
                      Go →
                    </Link>
                  </div>
                )}

                {/* Interview slot — shown only when all gates pass */}
                {allGates && !app.interview_slot_at && (
                  <div className="mt-3">
                    <button onClick={() => setShowSchedule(app.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors w-full justify-center">
                      <Calendar className="h-4 w-4" /> Select Interview Date & Time
                    </button>
                  </div>
                )}

                {/* Slot already selected */}
                {app.interview_slot_at && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold text-indigo-700">Interview Slot Selected</p>
                      <p className="text-[11px] text-indigo-500">
                        {new Date(app.interview_slot_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {app.meeting_link && (
                      <a href={app.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] font-bold rounded-lg transition-colors">
                        Join Meeting
                      </a>
                    )}
                  </div>
                )}

                {/* Pipeline */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  {isFailed ? (
                    <div className="flex items-center gap-2 text-[12px] text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      Stage: <span className="font-semibold text-slate-600">{app.current_stage_name}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-0">
                        {PIPELINE.map((label, idx) => {
                          const done    = idx <= step
                          const current = idx === step
                          const isLast  = idx === PIPELINE.length - 1
                          return (
                            <div key={label} className="flex items-center flex-1 min-w-0">
                              <div className="flex flex-col items-center shrink-0">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${done ? current ? 'bg-indigo-600 ring-2 ring-indigo-200 shadow-sm' : 'bg-indigo-600' : 'bg-slate-200'}`}>
                                  {done && !current && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                  {current && <span className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                  {!done && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                                </div>
                                <span className={`mt-1.5 text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${done ? (current ? 'text-indigo-600' : 'text-indigo-500') : 'text-slate-400'}`}>
                                  {label}
                                </span>
                              </div>
                              {!isLast && (
                                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${idx < step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {app.current_stage_name && (
                        <p className="mt-2 text-[11.5px] text-slate-400">
                          Current stage: <span className="font-semibold text-slate-700">{app.current_stage_name}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Interview slot selection modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Select Interview Slot</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Pick your preferred date and time</p>
              </div>
              <button onClick={() => { setShowSchedule(null); setScheduleMsg('') }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {scheduleMsg && (
              <div className={`mb-4 px-3 py-2 rounded-xl text-[12px] font-semibold border ${
                scheduleMsg.includes('confirmed') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'
              }`}>
                {scheduleMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Preferred Date</label>
                <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-[13px] focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-600 mb-1.5">Preferred Time</label>
                <input type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-[13px] focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <button onClick={() => handleSelectSlot(showSchedule)}
                disabled={scheduling || !slotDate || !slotTime}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-colors">
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Confirm Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
