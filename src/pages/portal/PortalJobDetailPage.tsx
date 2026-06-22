import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { ArrowLeft, MapPin, Briefcase, Building2, Globe, Users, Loader2, CheckCircle2, Tag, Trophy, Image, ClipboardList, ArrowRight } from 'lucide-react'

interface CompanyMedia {
  id: string; media_type: string; title: string | null
  description: string | null; file_url: string; sort_order: number
}

interface JobDetail {
  id: string; title: string; job_type: string; work_mode: string
  experience_min_years: number | null; experience_max_years: number | null
  salary_min: number | null; salary_max: number | null
  description: string; about_job: string | null
  posted_at: string; closes_at: string | null
  company_name: string; company_logo_url: string | null
  about_company: string | null; industry: string | null; company_size: string | null
  website: string | null; company_city: string | null; company_state: string | null
  location_city: string | null; location_state: string | null
  department_name: string | null
  skills_required: string | null; skills_mandatory: string | null
  achievements_json: { title: string; description?: string; year?: string }[] | null
  company_media: CompanyMedia[] | null
  culture_description: string | null
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)} / year`
  if (min) return `From ${fmt(min)} / year`
  return `Up to ${fmt(max!)} / year`
}

export default function PortalJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { candidate } = useCandidateAuth()
  const [job, setJob]           = useState<JobDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [applying, setApplying]       = useState(false)
  const [applied, setApplied]         = useState(false)
  const [applyErr, setApplyErr]       = useState('')
  const [assessment, setAssessment]   = useState<{ token: string; title: string; time_limit_mins: number } | null>(null)

  useEffect(() => {
    if (!id) return
    portalApi.get(`/jobs/${id}`)
      .then(r => setJob(r.data.data))
      .catch(() => setError('Job not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleApply() {
    if (!candidate) { navigate('/portal/login'); return }
    setApplying(true); setApplyErr('')
    try {
      const { data } = await portalApi.post(`/jobs/${id}/apply`, {})
      setApplied(true)
      if (data.data?.assessment?.token) {
        setAssessment(data.data.assessment)
      }
    } catch (e: any) {
      setApplyErr(e.response?.data?.message ?? 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error || !job) return (
    <div className="text-center py-16">
      <p className="text-zinc-500 text-sm">{error || 'Job not found'}</p>
      <Link to="/portal/jobs" className="text-indigo-500 text-sm mt-2 inline-block hover:underline">← Back to jobs</Link>
    </div>
  )

  const salary = salaryLabel(job.salary_min, job.salary_max)
  const location = [job.location_city, job.location_state].filter(Boolean).join(', ')
  const companyLocation = [job.company_city, job.company_state].filter(Boolean).join(', ')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {job.company_logo_url
                  ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                  : <Building2 className="h-6 w-6 text-zinc-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{job.title}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{job.company_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {job.job_type && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Briefcase className="h-3 w-3" />
                      {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {job.work_mode}
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                  )}
                </div>
                {(() => {
                  let skills: string[] = []
                  if (job.skills_required) {
                    try {
                      skills = typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : job.skills_required
                    } catch { skills = [] }
                  }
                  return skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skills.map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                          <Tag className="h-3 w-3" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          </div>

          {(job.about_job || job.description) && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">About this role</h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {job.about_job || job.description}
              </div>
            </div>
          )}

          {job.about_company && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">About {job.company_name}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{job.about_company}</p>
              </div>

              {job.culture_description && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Culture & Values</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{job.culture_description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {job.industry && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Building2 className="h-3.5 w-3.5" />{job.industry}
                  </div>
                )}
                {job.company_size && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />{job.company_size}
                  </div>
                )}
                {companyLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />{companyLocation}
                  </div>
                )}
                {job.website && (
                  <a
                    href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600"
                  >
                    <Globe className="h-3.5 w-3.5" />Website
                  </a>
                )}
              </div>

              {job.achievements_json && job.achievements_json.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" /> Achievements & Awards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {job.achievements_json.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50">
                        <Trophy className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-zinc-900 dark:text-white">{a.title}</p>
                          {a.description && <p className="text-xs text-zinc-500 mt-0.5">{a.description}</p>}
                          {a.year && <p className="text-xs text-zinc-400 mt-0.5">{a.year}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {job.company_media && job.company_media.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-blue-500" /> Company Photos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {job.company_media.map(m => (
                      <div key={m.id} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                        <img src={m.file_url} alt={m.title ?? ''} className="h-full w-full object-cover" />
                        {m.title && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                            <p className="text-xs text-white font-medium truncate">{m.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Apply CTA */}
        <div className="space-y-4">
          <div className="sticky top-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            {salary && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Salary</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{salary}</p>
              </div>
            )}
            {(job.experience_min_years !== null || job.experience_max_years !== null) && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Experience</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">
                  {job.experience_min_years ?? 0}
                  {job.experience_max_years ? ` – ${job.experience_max_years}` : '+'} years
                </p>
              </div>
            )}
            {job.department_name && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Department</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">{job.department_name}</p>
              </div>
            )}
            {(() => {
              let skills: string[] = []
              if (job.skills_required) {
                try {
                  skills = typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : job.skills_required
                } catch { skills = [] }
              }
              return skills.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                        <Tag className="h-2.5 w-2.5" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
            {applied ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Application submitted successfully!</span>
                </div>
                {assessment && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <ClipboardList className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">Assessment Required</p>
                        <p className="text-xs text-indigo-700 mt-0.5">
                          {assessment.title} · {assessment.time_limit_mins} mins
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Complete this assessment to move forward in the hiring process.
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/portal/assessment/${assessment.token}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                    >
                      Start Assessment <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
                {applyErr && <p className="text-xs text-red-500 text-center">{applyErr}</p>}
                {!candidate && (
                  <p className="text-xs text-zinc-400 text-center">
                    <Link to="/portal/login" className="text-indigo-500 hover:underline">Sign in</Link> to apply
                  </p>
                )}
              </>
            )}
            {job.closes_at && (
              <p className="text-xs text-zinc-400 text-center">
                Closes {new Date(job.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
