import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { Search, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight, Loader2, Building2 } from 'lucide-react'

interface Job {
  id: string; job_code: string; title: string; job_type: string; work_mode: string
  experience_min_years: number | null; experience_max_years: number | null
  salary_min: number | null; salary_max: number | null
  description: string; posted_at: string
  company_name: string; company_logo_url: string | null
  department_name: string | null; location_city: string | null; location_state: string | null
}

function daysSince(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export default function PortalJobsPage() {
  const [jobs, setJobs]         = useState<Job[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [jobType, setJobType]   = useState('')
  const [workMode, setWorkMode] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const LIMIT = 12

  const fetchJobs = useCallback(() => {
    setLoading(true)
    portalApi.get('/jobs', { params: { search, job_type: jobType, work_mode: workMode, page, limit: LIMIT } })
      .then(r => { setJobs(r.data.data.jobs); setTotal(r.data.data.total) })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false))
  }, [search, jobType, workMode, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Browse Jobs</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{total} open positions available</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search jobs or companies..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={jobType}
          onChange={e => { setJobType(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Job Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <select
          value={workMode}
          onChange={e => { setWorkMode(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Work Modes</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No jobs found</p>
          <p className="text-xs mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map(job => {
            const salary = salaryLabel(job.salary_min, job.salary_max)
            const location = [job.location_city, job.location_state].filter(Boolean).join(', ')
            return (
              <Link
                key={job.id}
                to={`/portal/jobs/${job.id}`}
                className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {job.company_logo_url
                      ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                      : <Building2 className="h-5 w-5 text-zinc-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 truncate">{job.company_name}</p>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {job.job_type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {job.work_mode}
                    </span>
                  )}
                  {salary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      {salary}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50 dark:border-zinc-800">
                  {location ? (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </div>
                  ) : <span />}
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {daysSince(job.posted_at)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
