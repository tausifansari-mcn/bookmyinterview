import { useEffect, useState, useRef } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  Loader2, Plus, FileText, Upload, Search, CheckCircle2, XCircle,
  Clock, ChevronDown, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JDRequest {
  id: string
  title: string
  description: string | null
  job_type: string
  work_mode: string
  experience_min_years: number
  experience_max_years: number | null
  skills_required: string | null
  location: string | null
  source_type: 'upload' | 'manual' | 'existing'
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewer_name: string | null
  created_at: string
  reviewed_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-1 ring-red-200',
}

export default function ClientJDRequestsPage() {
  const [requests, setRequests] = useState<JDRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    job_type: 'full_time',
    work_mode: 'onsite',
    experience_min_years: 0,
    experience_max_years: '',
    salary_min: '',
    salary_max: '',
    skills_required: '',
    location: '',
    source_type: 'manual' as 'upload' | 'manual' | 'existing',
    existing_job_id: '',
  })

  async function load() {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const { data } = await clientApi.get(`/jd-requests${params}`)
      setRequests(data.data.requests)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      if (fileRef.current?.files?.[0]) {
        fd.append('file', fileRef.current.files[0])
      }
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('requirements', form.requirements)
      fd.append('responsibilities', form.responsibilities)
      fd.append('job_type', form.job_type)
      fd.append('work_mode', form.work_mode)
      fd.append('experience_min_years', String(form.experience_min_years))
      fd.append('experience_max_years', form.experience_max_years)
      fd.append('salary_min', form.salary_min)
      fd.append('salary_max', form.salary_max)
      fd.append('skills_required', form.skills_required)
      fd.append('location', form.location)
      fd.append('source_type', form.source_type)

      await clientApi.post('/jd-requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setShowForm(false)
      setForm({ title: '', description: '', requirements: '', responsibilities: '', job_type: 'full_time', work_mode: 'onsite', experience_min_years: 0, experience_max_years: '', salary_min: '', salary_max: '', skills_required: '', location: '', source_type: 'manual', existing_job_id: '' })
      if (fileRef.current) fileRef.current.value = ''
      load()
    } catch { } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">JD Requests</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Submit job descriptions for Super Admin review</p>
        </div>
        <button onClick={() => setShowForm(o => !o)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New JD Request
        </button>
      </div>

      {/* JD Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Submit New JD Request</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Job Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Source Type</label>
              <select value={form.source_type} onChange={e => setForm(p => ({ ...p, source_type: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="manual">Fill Manually</option>
                <option value="upload">Upload JD File</option>
                <option value="existing">Use Existing</option>
              </select>
            </div>

            {form.source_type === 'upload' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Upload JD File (PDF/DOC/DOCX)</label>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-xs file:font-medium" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Job Type</label>
              <select value={form.job_type} onChange={e => setForm(p => ({ ...p, job_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Work Mode</label>
              <select value={form.work_mode} onChange={e => setForm(p => ({ ...p, work_mode: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Min Experience (years)</label>
              <input type="number" value={form.experience_min_years} onChange={e => setForm(p => ({ ...p, experience_min_years: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Max Experience</label>
              <input type="number" value={form.experience_max_years} onChange={e => setForm(p => ({ ...p, experience_max_years: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Min Salary</label>
              <input type="number" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Max Salary</label>
              <input type="number" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Skills Required (comma separated)</label>
              <input value={form.skills_required} onChange={e => setForm(p => ({ ...p, skills_required: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Submit for Review
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === s
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">No JD requests found</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const skills = r.skills_required ? (
              typeof r.skills_required === 'string' && r.skills_required.startsWith('[')
                ? JSON.parse(r.skills_required) : (r.skills_required || '').split(',').map(s => s.trim())
            ) : []
            return (
              <div key={r.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{r.title}</h3>
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase', STATUS_STYLES[r.status])}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">
                      {r.job_type.replace('_', ' ')} &middot; {r.work_mode}
                      {r.location && ` &middot; ${r.location}`}
                    </p>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {skills.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {r.source_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {r.status === 'pending' && <Clock className="h-8 w-8 text-amber-400" />}
                    {r.status === 'approved' && <CheckCircle2 className="h-8 w-8 text-emerald-500" />}
                    {r.status === 'rejected' && <XCircle className="h-8 w-8 text-red-400" />}
                  </div>
                </div>
                {r.admin_notes && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[11px] text-zinc-500">
                      <span className="font-medium">Admin Notes:</span> {r.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
