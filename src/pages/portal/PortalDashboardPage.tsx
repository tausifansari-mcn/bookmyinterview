import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { portalApi } from '@/lib/portalApi'
import { motion } from 'motion/react'
import {
  AlertCircle, ArrowRight, Briefcase, CheckCircle2, Clock,
  FileText, MapPin, Search, Star, TrendingUp, Zap,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
})

interface CompletionItem { label: string; pct: number; done: boolean }
interface Completion    { profile_completion: number; breakdown: Record<string, CompletionItem> }
interface Application   {
  id: string; job_title: string; current_stage_name: string
  status: string; applied_at: string; ai_match_score: number | null
  location_city?: string | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active:         { label: 'Under Review',  cls: 'bg-blue-50 text-blue-700 border-blue-100'     },
  selected:       { label: 'Shortlisted',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected:       { label: 'Not Selected',  cls: 'bg-rose-50 text-rose-700 border-rose-100'     },
  on_hold:        { label: 'On Hold',       cls: 'bg-amber-50 text-amber-700 border-amber-100'  },
  offer_extended: { label: 'Offer Extended',cls: 'bg-violet-50 text-violet-700 border-violet-100'},
  offer_accepted: { label: 'Offer Accepted',cls: 'bg-emerald-50 text-emerald-800 border-emerald-100'},
  withdrawn:      { label: 'Withdrawn',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  joined:         { label: 'Joined 🎉',     cls: 'bg-emerald-50 text-emerald-800 border-emerald-100'},
}

const JOB_BADGE_COLORS = [
  'from-indigo-500 to-indigo-600', 'from-violet-500 to-violet-600',
  'from-emerald-500 to-teal-600',  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-500',  'from-sky-500 to-cyan-600',
]
const getBadgeGrad = (s: string) => JOB_BADGE_COLORS[(s?.charCodeAt(0) ?? 0) % JOB_BADGE_COLORS.length]

function parseSkills(v: unknown): string[] {
  if (Array.isArray(v)) return v
  if (typeof v !== 'string' || !v.trim()) return []
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] }
  catch { return v.split(',').map(s => s.trim()).filter(Boolean) }
}

export default function PortalDashboardPage() {
  const { candidate } = useCandidateAuth()
  const [completion,    setCompletion]    = useState<Completion | null>(null)
  const [applications,  setApplications]  = useState<Application[]>([])
  const [featuredJobs,  setFeaturedJobs]  = useState<any[]>([])
  const [loadingComp,   setLoadingComp]   = useState(true)
  const [loadingApps,   setLoadingApps]   = useState(true)
  const [loadingJobs,   setLoadingJobs]   = useState(true)

  useEffect(() => {
    portalApi.get('/me/completion')
      .then(r => setCompletion(r.data.data)).finally(() => setLoadingComp(false))
    portalApi.get('/applications')
      .then(r => setApplications(r.data.data)).finally(() => setLoadingApps(false))
    portalApi.get('/jobs')
      .then(r => setFeaturedJobs((r.data.data.jobs ?? []).slice(0, 4))).finally(() => setLoadingJobs(false))
  }, [])

  const pct            = completion?.profile_completion ?? 0
  const breakdown      = useMemo(() => completion ? Object.entries(completion.breakdown) : [], [completion])
  const nextStep       = breakdown.find(([, i]) => !i.done)?.[1]
  const completedItems = breakdown.filter(([, i]) => i.done).length
  const shortlisted    = applications.filter(a => ['selected','offer_extended','offer_accepted','joined'].includes(a.status)).length
  const inProgress     = applications.filter(a => ['active','on_hold'].includes(a.status)).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 17 ? '👋 Good afternoon' : '🌙 Good evening'
  const firstName = candidate?.full_name?.split(' ')[0] ?? 'there'

  /* ── profile ring ── */
  const r = 34, circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 100) / 100
  const ringColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1'

  return (
    <div className="space-y-5">

      {/* ── Hero welcome ── */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-2xl p-5 sm:p-7 text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)' }}>
        <div className="absolute top-[-40px] right-[-40px] h-[180px] w-[180px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute bottom-[-20px] left-[40%] h-[120px] w-[120px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-indigo-200 text-[12px] sm:text-[13px] font-medium mb-1">{greeting},</p>
            <h1 className="text-[22px] sm:text-[28px] font-bold leading-tight truncate">{firstName}!</h1>
            <p className="text-indigo-200 text-[12px] sm:text-[13px] mt-2 leading-relaxed max-w-sm">
              {pct < 60
                ? `Your profile is ${pct}% — boost it to attract recruiters.`
                : pct < 90
                ? `${pct}% complete. A few more steps to stand out!`
                : 'Great profile! Keep applying to land your dream role.'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/portal/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold text-indigo-700 transition-all hover:bg-white active:scale-95"
                style={{ background: 'rgba(255,255,255,0.92)' }}>
                <Search className="h-3.5 w-3.5" /> Find Jobs
              </Link>
              {pct < 100 && (
                <Link to="/portal/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  Complete Profile
                </Link>
              )}
            </div>
          </div>
          {/* Profile ring */}
          <div className="shrink-0 hidden sm:flex flex-col items-center">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
              <circle cx="44" cy="44" r={r} fill="none" stroke={ringColor} strokeWidth="7"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform="rotate(-90 44 44)" style={{ transition: 'stroke-dasharray 0.7s ease' }} />
              <text x="44" y="40" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{loadingComp ? '…' : pct}%</text>
              <text x="44" y="55" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="9.5">Profile</text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
        {[
          { label: 'Applications', value: loadingApps ? '…' : applications.length, icon: FileText,   to: '/portal/applications', from: '#6366f1', light: '#eef2ff' },
          { label: 'In Progress',  value: loadingApps ? '…' : inProgress,          icon: Clock,      to: '/portal/applications', from: '#0ea5e9', light: '#e0f2fe' },
          { label: 'Shortlisted',  value: loadingApps ? '…' : shortlisted,         icon: Star,       to: '/portal/applications', from: '#10b981', light: '#d1fae5' },
        ].map(s => (
          <motion.div key={s.label}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
            <Link to={s.to}
              className="bg-white rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md active:scale-[0.98] hover:-translate-y-0.5 transition-all"
              style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: s.light }}>
                <s.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: s.from }} />
              </div>
              <div>
                <p className="text-[22px] sm:text-[26px] font-bold text-slate-900 leading-none">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1">{s.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Featured Jobs ── */}
      <motion.div {...fadeUp(0.2)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500" /> Featured Jobs
            </h2>
            <p className="text-[11.5px] text-slate-400 mt-0.5">Latest openings matching your profile</p>
          </div>
          <Link to="/portal/jobs"
            className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse"
              style={{ border: '1px solid #e8edf8' }} />)}
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '1px solid #e8edf8' }}>
            <Briefcase className="h-10 w-10 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">No jobs available right now.</p>
            <Link to="/portal/jobs" className="mt-2 inline-block text-[12px] font-semibold text-indigo-600">
              Check again →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {featuredJobs.map(job => {
              const skills = parseSkills(job.skills_required)
              const initial = (job.title?.[0] ?? 'J').toUpperCase()
              const badgeGrad = getBadgeGrad(job.title ?? '')
              const wmStyle: Record<string, string> = {
                remote: 'bg-emerald-50 text-emerald-700',
                hybrid: 'bg-amber-50 text-amber-700',
                onsite: 'bg-blue-50 text-blue-700',
              }
              return (
                <Link key={job.id} to="/portal/jobs"
                  className="bg-white rounded-2xl p-4 flex gap-3 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] transition-all group"
                  style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${badgeGrad} flex items-center justify-center text-[14px] font-bold text-white shrink-0`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {job.department_name && (
                        <span className="text-[11px] text-slate-500 truncate">{job.department_name}</span>
                      )}
                      {job.location_city && (
                        <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                          <MapPin className="h-3 w-3" />{job.location_city}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {job.work_mode && (
                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${wmStyle[job.work_mode] ?? 'bg-slate-100 text-slate-600'}`}>
                          {job.work_mode === 'onsite' ? 'On-site' : job.work_mode === 'remote' ? 'Remote' : 'Hybrid'}
                        </span>
                      )}
                      {skills.slice(0, 2).map(s => (
                        <span key={s} className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{s}</span>
                      ))}
                      {skills.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{skills.length - 2}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ── 2-col: checklist + recent applications ── */}
      <motion.div {...fadeUp(0.28)} className="grid gap-4 lg:grid-cols-2">

        {/* Profile checklist */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-slate-900">Profile Checklist</h2>
              <p className="text-[11.5px] text-slate-400 mt-0.5">{completedItems}/{breakdown.length} completed</p>
            </div>
            <Link to="/portal/profile"
              className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
              Edit <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Progress bar */}
          {!loadingComp && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, ${pct >= 80 ? '#10b981' : '#7c3aed'})` }} />
              </div>
              {nextStep && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Next: <span className="font-semibold text-slate-700">{nextStep.label}</span> (+{nextStep.pct}%)
                </p>
              )}

            </div>
          )}

          {loadingComp ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {breakdown.map(([key, item]) => {
                const link = key === 'short_introduction' ? '/portal/intro' : '/portal/profile'
                const Inner = (
                  <>
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <AlertCircle  className="h-4 w-4 text-slate-300 shrink-0" />}
                    <span className={item.done ? 'text-emerald-700 font-medium' : 'text-slate-600'}>{item.label}</span>
                    {!item.done && (
                      <span className="ml-auto text-[10.5px] font-semibold text-indigo-500 shrink-0">Fill →</span>
                    )}
                    {item.done && (
                      <span className="ml-auto text-[11px] font-bold text-emerald-500 shrink-0">+{item.pct}%</span>
                    )}
                  </>
                )
                return item.done ? (
                  <div key={key}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px]"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    {Inner}
                  </div>
                ) : (
                  <Link key={key} to={link}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                    style={{ background: '#f8fafc', border: '1px solid #e8edf8' }}>
                    {Inner}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-slate-900">My Applications</h2>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Your recent activity</p>
            </div>
            <Link to="/portal/applications"
              className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingApps ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">No applications yet</p>
              <p className="text-[11.5px] text-slate-400 mt-1 mb-3">Apply to jobs and track them here</p>
              <Link to="/portal/jobs" className="btn-primary text-[12.5px] px-4 py-2">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {applications.slice(0, 5).map(app => {
                const s = STATUS_STYLE[app.status] ?? { label: app.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }
                return (
                  <div key={app.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: '#f8fafc', border: '1px solid #e8edf8' }}>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-900 truncate">{app.job_title}</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">{app.current_stage_name}</p>
                    </div>
                    <span className={`shrink-0 text-[10.5px] font-semibold px-2 py-1 rounded-full border ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.32 } } }}>
        {[
          { to: '/portal/jobs',         icon: Briefcase,    label: 'Explore Jobs',    sub: 'Find new roles',       color: '#6366f1', bg: '#eef2ff' },
          { to: '/portal/profile',      icon: TrendingUp,   label: 'My Profile',      sub: 'Boost visibility',     color: '#7c3aed', bg: '#f5f3ff' },
          { to: '/portal/applications', icon: Star,         label: 'Applications',    sub: 'Track progress',       color: '#0ea5e9', bg: '#e0f2fe' },
        ].map(a => (
          <motion.div key={a.to}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
            <Link to={a.to}
              className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all"
              style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: a.bg }}>
                <a.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: a.color }} />
              </div>
              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-tight">{a.label}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 hidden sm:block">{a.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
