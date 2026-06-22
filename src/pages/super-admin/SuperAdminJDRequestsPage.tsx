import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import {
  Loader2, CheckCircle2, XCircle, Clock, Search, Building2,
  FileText, Mail, Phone, ExternalLink, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JDRequest {
  id: string
  title: string
  description: string | null
  requirements: string | null
  job_type: string
  work_mode: string
  experience_min_years: number
  experience_max_years: number | null
  salary_min: number | null
  salary_max: number | null
  skills_required: string | null
  location: string | null
  source_type: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  company_name: string
  logo_url: string | null
  primary_contact_name: string | null
  primary_contact_phone: string | null
  reviewer_name: string | null
  reviewed_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-1 ring-red-200',
}

export default function SuperAdminJDRequestsPage() {
  const [requests, setRequests] = useState<JDRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<JDRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })

  async function loadStats() {
    try {
      const { data } = await superAdminApi.get('/jd-stats')
      setStats(data.data)
    } catch { }
  }

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: filter })
      if (search) params.set('search', search)
      const { data } = await superAdminApi.get(`/jd-requests?${params}`)
      setRequests(data.data.requests)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load(); loadStats() }, [filter])

  async function handleApprove(id: string) {
    setActionLoading(true)
    try {
      await superAdminApi.post(`/jd-requests/${id}/approve`, { admin_notes: approveNotes })
      setDetail(null)
      setApproveNotes('')
      load(); loadStats()
    } catch { } finally { setActionLoading(false) }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      await superAdminApi.post(`/jd-requests/${id}/reject`, { reason: rejectReason })
      setDetail(null)
      setRejectReason('')
      load(); loadStats()
    } catch { } finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">JD Requests</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Review client job description submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
          { label: 'Total', value: stats.total, color: 'text-zinc-900 dark:text-white' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === s
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800')}>
            {s}
          </button>
        ))}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); load() }}
            placeholder="Search by title or company..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
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
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setDetail(r)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{r.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{r.title}</h3>
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase', STATUS_STYLES[r.status])}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                      <span>{r.job_type?.replace('_', ' ')}</span>
                      <span>&middot;</span>
                      <span>{r.work_mode}</span>
                      {r.location && <><span>&middot;</span><span>{r.location}</span></>}
                      {r.experience_min_years != null && <><span>&middot;</span><span>{r.experience_min_years}-{r.experience_max_years || 'Any'} yrs</span></>}
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{r.source_type}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail + Action Dialog */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-600">{detail.company_name}</span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{detail.title}</h2>
                <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold inline-block mt-1', STATUS_STYLES[detail.status])}>{detail.status}</span>
              </div>
              <button onClick={() => { setDetail(null); setRejectReason(''); setApproveNotes('') }}
                className="text-zinc-400 hover:text-zinc-600"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-xs text-zinc-400 block">Job Type</span><span className="font-medium">{detail.job_type?.replace('_', ' ')}</span></div>
              <div><span className="text-xs text-zinc-400 block">Work Mode</span><span className="font-medium">{detail.work_mode}</span></div>
              <div><span className="text-xs text-zinc-400 block">Experience</span><span className="font-medium">{detail.experience_min_years} - {detail.experience_max_years || 'Any'} years</span></div>
              <div><span className="text-xs text-zinc-400 block">Location</span><span className="font-medium">{detail.location || 'Not specified'}</span></div>
              {detail.salary_min != null && (
                <div><span className="text-xs text-zinc-400 block">Salary Range</span><span className="font-medium">₹{Number(detail.salary_min).toLocaleString('en-IN')} - {detail.salary_max ? `₹${Number(detail.salary_max).toLocaleString('en-IN')}` : 'Negotiable'}</span></div>
              )}
              <div><span className="text-xs text-zinc-400 block">Submitted</span><span className="font-medium">{new Date(detail.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
            </div>

            {detail.primary_contact_name && (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-zinc-500 mb-1">Client Contact</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-zinc-400" />{detail.primary_contact_name}</span>
                  {detail.primary_contact_phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-zinc-400" />{detail.primary_contact_phone}</span>}
                </div>
              </div>
            )}

            {detail.description && (
              <div className="mb-4">
                <span className="text-xs text-zinc-500 block mb-1 font-medium">Description</span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">{detail.description}</p>
              </div>
            )}

            {detail.status === 'pending' && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Approval Notes (optional)</label>
                  <textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={() => handleApprove(detail.id)} disabled={actionLoading}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve & Post Job
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 block mb-1">Rejection Reason *</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} placeholder="Why is this JD being rejected?"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <button onClick={() => handleReject(detail.id)} disabled={actionLoading || !rejectReason.trim()}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </div>
              </div>
            )}

            {(detail.status === 'approved' || detail.status === 'rejected') && detail.admin_notes && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <span className="text-xs font-medium text-zinc-500 block mb-1">Admin Notes</span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">{detail.admin_notes}</p>
                {detail.reviewer_name && <p className="text-xs text-zinc-400 mt-2">Reviewed by {detail.reviewer_name}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
