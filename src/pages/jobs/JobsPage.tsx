import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MapPin, Clock, Sparkles, Loader2, X, ChevronDown, CheckCircle, Briefcase } from 'lucide-react'
import { api } from '@/lib/api'

interface Job {
  id: string
  job_code: string
  title: string
  department_name: string | null
  location_city: string | null
  job_type: string
  work_mode: string
  experience_min_years: number
  experience_max_years: number | null
  salary_min: number | null
  salary_max: number | null
  headcount: number
  priority: string
  status: string
  created_at: string
  description: string | null
}

interface Dept { id: string; name: string }
interface Loc  { id: string; city: string; state: string; country: string }

const priorityColor: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}

const emptyForm = {
  title: '', department_id: '', location_id: '',
  job_type: 'full_time', work_mode: 'onsite',
  experience_min_years: 0, experience_max_years: '',
  salary_min: '', salary_max: '',
  headcount: 1, priority: 'medium',
  description: '', requirements: '', closes_at: '',
}

export default function JobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState({ ...emptyForm })
  const [submitting, setSubmitting]   = useState(false)
  const [formError, setFormError]     = useState('')
  const [successMsg, setSuccessMsg]   = useState('')
  const [departments, setDepartments] = useState<Dept[]>([])
  const [locations, setLocations]     = useState<Loc[]>([])
  const [skills, setSkills]           = useState<string[]>([])
  const [skillInput, setSkillInput]   = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  async function loadJobs() {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/jobs', { params })
      setJobs(data.data)
    } catch {
      // leave empty
    } finally {
      setLoading(false)
    }
  }

  async function loadMeta() {
    try {
      const [d, l] = await Promise.all([
        api.get('/jobs/departments'),
        api.get('/jobs/locations'),
      ])
      setDepartments(d.data.data)
      setLocations(l.data.data)
    } catch {}
  }

  useEffect(() => { loadJobs(); loadMeta() }, [])
  useEffect(() => { loadJobs() }, [statusFilter])

  function addSkill(val: string) {
    const s = val.trim().replace(/,$/,'')
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput) }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      setSkills(prev => prev.slice(0, -1))
    }
  }

  function openModal() {
    setForm({ ...emptyForm })
    setFormError('')
    setSkills([])
    setSkillInput('')
    setShowModal(true)
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Job title is required'); return }
    setSubmitting(true)
    setFormError('')
    try {
      if (skillInput.trim()) addSkill(skillInput)   // commit any pending skill
      const { data } = await api.post('/jobs', {
        title:                form.title.trim(),
        department_id:        form.department_id || undefined,
        location_id:          form.location_id || undefined,
        job_type:             form.job_type,
        work_mode:            form.work_mode,
        experience_min_years: Number(form.experience_min_years),
        experience_max_years: form.experience_max_years ? Number(form.experience_max_years) : undefined,
        salary_min:           form.salary_min ? Number(form.salary_min) : undefined,
        salary_max:           form.salary_max ? Number(form.salary_max) : undefined,
        headcount:            Number(form.headcount),
        priority:             form.priority,
        description:          form.description || undefined,
        requirements:         form.requirements || undefined,
        skills_required:      skills.length > 0 ? skills : undefined,
        closes_at:            form.closes_at || undefined,
      })
      setShowModal(false)
      setSuccessMsg(data.message ?? 'Job posted successfully!')
      setTimeout(() => setSuccessMsg(''), 5000)
      loadJobs()
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Failed to create job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase())
      || (j.department_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const daysOpen = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000)

  return (
    <div className="space-y-5">
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-sub">{jobs.length} position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus className="h-4 w-4" /> Post New Job
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 max-w-sm
                        focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-500/10 transition-all">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs…"
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="field w-auto"
        >
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <Briefcase className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{search ? 'No jobs match your search' : 'No jobs yet'}</p>
          {!search && <p className="text-slate-400 text-sm mt-1">Click "Post New Job" to create your first opening</p>}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`}
              className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-5
                         hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-semibold text-[15px] text-slate-900">{job.title}</h3>
                    <span className={`badge ${job.priority === 'urgent' ? 'badge-red' : job.priority === 'high' ? 'badge-amber' : job.priority === 'low' ? 'badge-gray' : 'badge-blue'} capitalize`}>
                      {job.priority}
                    </span>
                    {job.status !== 'open' && (
                      <span className="badge badge-gray capitalize">{job.status}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-slate-400 flex-wrap">
                    {job.department_name && <span className="font-medium text-slate-500">{job.department_name}</span>}
                    {job.location_city && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location_city}</span>
                    )}
                    <span className="capitalize">{job.job_type.replace('_', ' ')}</span>
                    <span className="capitalize">{job.work_mode}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysOpen(job.created_at)}d ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-slate-900">{job.headcount}</p>
                    <p className="text-[11px] text-slate-400">opening{job.headcount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center
                                  group-hover:bg-indigo-600 transition-colors">
                    <Sparkles className="h-4 w-4 text-indigo-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Post New Job Modal ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Post New Job</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Fill in the details to create a new opening</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Job Title <span className="text-red-500">*</span></label>
                <input
                  ref={titleRef}
                  value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Senior Customer Care Executive"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Department + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Department</label>
                  <div className="relative">
                    <select
                      value={form.department_id} onChange={e => set('department_id', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white pr-8"
                    >
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <div className="relative">
                    <select
                      value={form.location_id} onChange={e => set('location_id', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white pr-8"
                    >
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.city}{l.state ? `, ${l.state}` : ''}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Job Type + Work Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Job Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={form.job_type} onChange={e => set('job_type', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white pr-8"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="temp">Temporary</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Work Mode <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={form.work_mode} onChange={e => set('work_mode', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white pr-8"
                    >
                      <option value="onsite">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Experience (years)</label>
                  <input
                    type="number" min="0" max="30"
                    value={form.experience_min_years} onChange={e => set('experience_min_years', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Experience (years)</label>
                  <input
                    type="number" min="0" max="40"
                    value={form.experience_max_years} onChange={e => set('experience_max_years', e.target.value)}
                    placeholder="Optional"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Salary (₹/year)</label>
                  <input
                    type="number" min="0"
                    value={form.salary_min} onChange={e => set('salary_min', e.target.value)}
                    placeholder="e.g. 300000"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Salary (₹/year)</label>
                  <input
                    type="number" min="0"
                    value={form.salary_max} onChange={e => set('salary_max', e.target.value)}
                    placeholder="e.g. 600000"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Headcount + Priority + Closes At */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Headcount <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="1"
                    value={form.headcount} onChange={e => set('headcount', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={form.priority} onChange={e => set('priority', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white pr-8"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Closes On</label>
                  <input
                    type="date"
                    value={form.closes_at} onChange={e => set('closes_at', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Job Description</label>
                <textarea
                  value={form.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder="Describe the role, responsibilities, and what makes this a great opportunity…"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Requirements</label>
                <textarea
                  value={form.requirements} onChange={e => set('requirements', e.target.value)}
                  rows={3} placeholder="List qualifications, certifications, and experience required…"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Skills Required */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Skills Required
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(press Enter or comma to add)</span>
                </label>
                <div className="border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary min-h-[42px] flex flex-wrap gap-1.5 items-center cursor-text"
                  onClick={() => document.getElementById('skill-input')?.focus()}>
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {s}
                      <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="skill-input"
                    type="text"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => skillInput.trim() && addSkill(skillInput)}
                    placeholder={skills.length === 0 ? 'e.g. React, Node.js, MySQL…' : ''}
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
