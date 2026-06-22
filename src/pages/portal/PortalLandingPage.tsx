import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { portalApi } from '@/lib/portalApi'
import {
  Search, MapPin, Briefcase, Building2, Clock, ChevronRight,
  Loader2, Tag, Users, Globe, Star, ArrowRight,
} from 'lucide-react'

interface Job {
  id: string; title: string; job_type: string; work_mode: string
  salary_min: number | null; salary_max: number | null
  posted_at: string; company_name: string; company_logo_url: string | null
  department_name: string | null; location_city: string | null; location_state: string | null
  skills_required: string | null
}

interface Company {
  id: string; company_name: string; logo_url: string | null
  industry: string | null; company_size: string | null
  city: string | null; state: string | null
  job_count: number; about_company: string | null
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'Just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(0)}L` : `${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

const WORK_MODE_STYLE: Record<string, { label: string; cls: string }> = {
  remote: { label: 'Remote', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  hybrid: { label: 'Hybrid', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  onsite: { label: 'On-site', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
}

export default function PortalLandingPage() {
  const { candidate } = useCandidateAuth()
  const navigate = useNavigate()
  const isLoggedIn = !!candidate
  const [jobs, setJobs]             = useState<Job[]>([])
  const [companies, setCompanies]   = useState<Company[]>([])
  const [search, setSearch]         = useState('')
  const [location, setLocation]     = useState('')
  const [loadingJobs, setLoadingJobs]       = useState(true)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  const fetchJobs = useCallback(() => {
    setLoadingJobs(true)
    portalApi.get('/jobs', { params: { search, location, limit: 12 } })
      .then(r => setJobs(r.data.data.jobs))
      .catch(() => {})
      .finally(() => setLoadingJobs(false))
  }, [search, location])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  useEffect(() => {
    portalApi.get('/companies')
      .then(r => setCompanies(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingCompanies(false))
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/portal/jobs?search=${encodeURIComponent(search)}&location=${encodeURIComponent(location)}`)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-[-60px] right-[-60px] h-[250px] w-[250px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
          <div className="absolute bottom-[-30px] left-[30%] h-[180px] w-[180px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            Find Your Dream Job<br />
            <span className="text-indigo-200">Top Companies Are Hiring</span>
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base mt-4 max-w-xl mx-auto">
            Discover thousands of job opportunities from leading companies. Search by role, skills, or location.
          </p>

          {/* Search Bars */}
          <form onSubmit={handleSearch} className="mt-8 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Job title, skills, or company..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Location..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{loadingJobs ? '...' : jobs.length}+</p>
              <p className="text-xs text-indigo-200 mt-0.5">Open Jobs</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{loadingCompanies ? '...' : companies.length}+</p>
              <p className="text-xs text-indigo-200 mt-0.5">Companies</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-xs text-indigo-200 mt-0.5">Candidates</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── Companies Section ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" /> Top Companies Hiring
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">Explore companies with open positions</p>
            </div>
          </div>

          {loadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-40 bg-white dark:bg-zinc-900 rounded-xl animate-pulse border border-zinc-200 dark:border-zinc-800" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No companies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {companies.map(company => {
                const location = [company.city, company.state].filter(Boolean).join(', ')
                return (
                  <Link
                    key={company.id}
                    to={`/portal/jobs?search=${encodeURIComponent(company.company_name)}`}
                    className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                        {company.logo_url
                          ? <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
                          : <Building2 className="h-6 w-6 text-zinc-300" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {company.company_name}
                        </h3>
                        {company.industry && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{company.industry}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {location && (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" />{location}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Users className="h-3 w-3" />{company.company_size ?? 'N/A'}
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Briefcase className="h-3 w-3" />
                          {company.job_count} {company.job_count === 1 ? 'job' : 'jobs'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Latest Jobs Section ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" /> Latest Job Openings
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">Fresh opportunities posted recently</p>
            </div>
            <Link to="/portal/jobs"
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-44 bg-white dark:bg-zinc-900 rounded-xl animate-pulse border border-zinc-200 dark:border-zinc-800" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => {
                const salary = salaryLabel(job.salary_min, job.salary_max)
                const location = [job.location_city, job.location_state].filter(Boolean).join(', ')
                const wm = WORK_MODE_STYLE[job.work_mode]
                let skills: string[] = []
                if (job.skills_required) {
                  try { skills = typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : job.skills_required } catch {}
                }
                return (
                  <Link
                    key={job.id}
                    to={`/portal/jobs/${job.id}`}
                    className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                        {job.company_logo_url
                          ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                          : <Building2 className="h-5 w-5 text-zinc-300" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500 truncate">{job.company_name}</p>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors truncate">
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
                      {wm && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${wm.cls}`}>
                          {wm.label}
                        </span>
                      )}
                      {salary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          {salary}
                        </span>
                      )}
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                            <Tag className="h-2.5 w-2.5" />{s}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            +{skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50 dark:border-zinc-800">
                      {location ? (
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" />{location}
                        </div>
                      ) : <span />}
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {timeAgo(job.posted_at)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-10">
          {isLoggedIn ? (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 sm:p-12 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">Welcome back!</h2>
              <p className="text-emerald-100 text-sm mt-2 max-w-md mx-auto">
                Continue where you left off — track your applications and discover new opportunities.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <Link to="/portal/dashboard"
                  className="px-6 py-3 bg-white text-emerald-700 font-semibold text-sm rounded-xl hover:bg-emerald-50 transition-colors">
                  Go to Dashboard
                </Link>
                <Link to="/portal/jobs"
                  className="px-6 py-3 bg-white/15 text-white font-semibold text-sm rounded-xl border border-white/25 hover:bg-white/25 transition-colors">
                  Browse Jobs
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 sm:p-12 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to Start Your Journey?</h2>
              <p className="text-indigo-100 text-sm mt-2 max-w-md mx-auto">
                Create your profile, upload your resume, and let top companies find you.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <Link to="/portal/register"
                  className="px-6 py-3 bg-white text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition-colors">
                  Create Account
                </Link>
                <Link to="/portal/jobs"
                  className="px-6 py-3 bg-white/15 text-white font-semibold text-sm rounded-xl border border-white/25 hover:bg-white/25 transition-colors">
                  Browse Jobs
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Book My Interview</span>
          </div>
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} Book My Interview. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
