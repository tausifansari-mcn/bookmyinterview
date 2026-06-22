import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight,
  Building2, Tag, X, Zap, IndianRupee, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Job {
  id: string; job_code: string; title: string; job_type: string; work_mode: string
  experience_min_years: number | null; experience_max_years: number | null
  salary_min: number | null; salary_max: number | null
  description: string; posted_at: string
  company_name: string; company_logo_url: string | null
  department_name: string | null; location_city: string | null; location_state: string | null
  skills_required: string | null
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', internship: 'Internship',
}
const WORK_MODE_LABELS: Record<string, string> = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' }

const GRADIENTS = [
  'from-indigo-500 to-violet-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500', 'from-sky-500 to-cyan-600',
  'from-blue-500 to-indigo-600', 'from-teal-500 to-emerald-600',
]
const getGrad = (s: string) => GRADIENTS[(s?.charCodeAt(0) ?? 0) % GRADIENTS.length]

const WM_BADGE: Record<string, string> = {
  remote: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  hybrid: 'bg-amber-50 text-amber-700 border-amber-100',
  onsite: 'bg-sky-50 text-sky-700 border-sky-100',
}
const JT_BADGE: Record<string, string> = {
  full_time: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  part_time: 'bg-violet-50 text-violet-700 border-violet-100',
  contract: 'bg-orange-50 text-orange-700 border-orange-100',
  internship: 'bg-pink-50 text-pink-700 border-pink-100',
}

function daysSince(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(0)}L` : `${(n / 1000).toFixed(0)}K`
  if (min && max) return `₹${fmt(min)}–${fmt(max)}`
  if (min) return `₹${fmt(min)}+`
  return `Up to ₹${fmt(max!)}`
}

function parseSkills(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v !== 'string' || !v.trim()) return []
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] }
  catch { return v.split(',').map(s => s.trim()).filter(Boolean) }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-zinc-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-zinc-100 rounded-lg" />
          <div className="h-3 w-1/2 bg-zinc-100 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-zinc-100 rounded-full" />
        <div className="h-5 w-14 bg-zinc-100 rounded-full" />
      </div>
      <div className="flex gap-1">
        <div className="h-5 w-20 bg-zinc-100 rounded-full" />
        <div className="h-5 w-16 bg-zinc-100 rounded-full" />
      </div>
    </div>
  )
}

export default function PortalJobsPage() {
  const [searchParams] = useSearchParams()
  const [jobs, setJobs]         = useState<Job[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState(searchParams.get('search') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [jobType, setJobType]   = useState('')
  const [workMode, setWorkMode] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const LIMIT = 12

  const fetchJobs = useCallback(() => {
    setLoading(true)
    portalApi.get('/jobs', { params: { search, location, job_type: jobType, work_mode: workMode, page, limit: LIMIT } })
      .then(r => { setJobs(r.data.data.jobs); setTotal(r.data.data.total) })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false))
  }, [search, location, jobType, workMode, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const totalPages = Math.ceil(total / LIMIT)
  const hasFilters = search || location || jobType || workMode

  function clearFilters() {
    setSearch(''); setLocation(''); setJobType(''); setWorkMode(''); setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-0">

      {/* ── Hero Search Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-8 sm:py-8 mb-5"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #6d28d9 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full opacity-10 translate-y-1/2"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 text-[12px] font-semibold mb-2">
            <Zap className="h-3.5 w-3.5" /> {total} open positions available
          </div>
          <h1 className="text-[24px] sm:text-[32px] font-black text-white mb-4 leading-tight">
            Find Your Dream Job
          </h1>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by job title, skills, or company…"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative flex-1 sm:max-w-[220px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                value={location}
                onChange={e => { setLocation(e.target.value); setPage(1) }}
                placeholder="City or state…"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filter Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-4">
        {/* Job Type pills */}
        {[{ v: '', l: 'All Types' }, ...Object.entries(JOB_TYPE_LABELS).map(([v, l]) => ({ v, l }))].map(({ v, l }) => (
          <button key={v} onClick={() => { setJobType(v); setPage(1) }}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all',
              jobType === v
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:text-indigo-600'
            )}>
            {l}
          </button>
        ))}
        <div className="w-px bg-zinc-200 mx-1 hidden sm:block" />
        {/* Work Mode pills */}
        {[{ v: '', l: 'All Modes' }, ...Object.entries(WORK_MODE_LABELS).map(([v, l]) => ({ v, l }))].map(({ v, l }) => (
          <button key={v} onClick={() => { setWorkMode(v); setPage(1) }}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all',
              workMode === v
                ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-violet-300 hover:text-violet-600'
            )}>
            {l}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </motion.div>

      {/* ── Results count ── */}
      {!loading && !error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[12.5px] text-zinc-400 mb-3 font-medium">
          {total === 0 ? 'No jobs found' : `Showing ${Math.min((page - 1) * LIMIT + 1, total)}–${Math.min(page * LIMIT, total)} of ${total} jobs`}
        </motion.p>
      )}

      {/* ── Jobs Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
          <p className="text-red-500 text-sm font-medium">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-20 text-center bg-white rounded-2xl border border-zinc-100">
          <div className="h-16 w-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-zinc-200" />
          </div>
          <p className="text-[15px] font-bold text-zinc-800">No jobs found</p>
          <p className="text-[13px] text-zinc-400 mt-1 max-w-xs">Try adjusting your search filters or clearing them</p>
          {hasFilters && (
            <button onClick={clearFilters}
              className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
              Clear Filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <AnimatePresence mode="popLayout">
          {jobs.map(job => {
            const salary  = salaryLabel(job.salary_min, job.salary_max)
            const locStr  = [job.location_city, job.location_state].filter(Boolean).join(', ')
            const skills  = parseSkills(job.skills_required)
            const initial = (job.title?.[0] ?? 'J').toUpperCase()
            const expLabel = job.experience_min_years != null
              ? `${job.experience_min_years}${job.experience_max_years != null ? `–${job.experience_max_years}` : '+'} yrs`
              : null
            return (
              <motion.div
                key={job.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}>
                <Link
                  to={`/portal/jobs/${job.id}`}
                  className="group block bg-white rounded-2xl border border-zinc-100 p-5 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full">

                  {/* Company logo + title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'h-11 w-11 rounded-xl shrink-0 flex items-center justify-center text-[15px] font-bold text-white overflow-hidden bg-gradient-to-br',
                      getGrad(job.title ?? '')
                    )}>
                      {job.company_logo_url
                        ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                        : initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {job.title}
                      </h3>
                      <p className="text-[12px] text-zinc-400 mt-0.5 flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />{job.company_name}
                      </p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.job_type && (
                      <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full border', JT_BADGE[job.job_type] ?? 'bg-zinc-50 text-zinc-600 border-zinc-200')}>
                        {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                      </span>
                    )}
                    {job.work_mode && (
                      <span className={cn('text-[10.5px] font-semibold px-2 py-0.5 rounded-full border', WM_BADGE[job.work_mode] ?? 'bg-zinc-50 text-zinc-600 border-zinc-200')}>
                        {WORK_MODE_LABELS[job.work_mode] ?? job.work_mode}
                      </span>
                    )}
                    {salary && (
                      <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
                        <IndianRupee className="h-2.5 w-2.5" />{salary}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                          <Tag className="h-2.5 w-2.5" />{s}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="text-[10.5px] font-medium text-zinc-400 px-1.5">+{skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-2.5 mt-auto border-t border-zinc-50 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {locStr && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="h-3 w-3" />{locStr}
                        </span>
                      )}
                      {expLabel && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <GraduationCap className="h-3 w-3" />{expLabel}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0">
                      <Clock className="h-3 w-3" />{daysSince(job.posted_at)}
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <div className="flex items-center gap-1.5 px-3">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-[12px] font-bold transition-all',
                    page === p
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-500 hover:bg-zinc-100'
                  )}>
                  {p}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  )
}
