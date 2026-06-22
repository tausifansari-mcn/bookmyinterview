import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminApi } from '@/lib/superAdminApi'
import { Search, Plus, Loader2, Building2, X, ChevronDown, Trash2, KeyRound, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  company_name: string
  plan: string
  subscription_status: string
  is_active: number
  onboarding_completed: number
  jobs_count: number
  candidates_count: number
  applications_count: number
  created_at: string
  city: string | null
  industry: string | null
  primary_contact_name: string | null
  primary_contact_phone: string | null
  logo_url: string | null
}

const STATUS_STYLES: Record<string, string> = {
  trial:     'bg-amber-50 text-amber-600',
  active:    'bg-green-50 text-green-600',
  suspended: 'bg-red-50 text-red-500',
  expired:   'bg-slate-100 text-slate-400',
}

export default function SuperAdminClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients]     = useState<Client[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    company_name: '', admin_email: '', admin_name: '', admin_password: '', plan: 'starter',
  })
  const [showCreatePw, setShowCreatePw] = useState(false)

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<Client | null>(null)
  const [resetPw, setResetPw]         = useState('')
  const [showResetPw, setShowResetPw] = useState(false)
  const [resetting, setResetting]     = useState(false)
  const [resetError, setResetError]   = useState('')

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleting, setDeleting]         = useState(false)

  function load() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (search)       params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    superAdminApi.get(`/clients?${params}`)
      .then(r => { setClients(r.data.data.clients ?? []); setTotal(r.data.data.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter])

  function setF(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setCreateError('')
    try {
      await superAdminApi.post('/clients', form)
      setShowCreate(false)
      setForm({ company_name: '', admin_email: '', admin_name: '', admin_password: '', plan: 'starter' })
      load()
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(clientId: string, currentActive: number) {
    try {
      await superAdminApi.patch(`/clients/${clientId}`, { is_active: currentActive ? 0 : 1 })
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, is_active: currentActive ? 0 : 1 } : c))
    } catch {}
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetTarget) return
    setResetting(true); setResetError('')
    try {
      await superAdminApi.post(`/clients/${resetTarget.id}/reset-password`, { new_password: resetPw })
      setResetTarget(null); setResetPw('')
    } catch (err: any) {
      setResetError(err?.response?.data?.message ?? 'Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await superAdminApi.delete(`/clients/${deleteTarget.id}`)
      setDeleteTarget(null)
      load()
    } catch {} finally {
      setDeleting(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all'
  const labelCls = 'block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[22px] font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">{total} companies on the platform</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <Plus className="h-4 w-4" /> Add New Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all bg-white cursor-pointer">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Client list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-slate-100 rounded" />
                  <div className="h-3 w-28 bg-slate-50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No clients found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.id}
              className={cn(
                'bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md',
                !c.is_active ? 'border-red-100 opacity-70' : 'border-slate-100',
              )}>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-[14px]"
                  style={{ background: c.logo_url ? 'transparent' : (c.is_active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#cbd5e1') }}>
                  {c.logo_url
                    ? <img src={c.logo_url} alt={c.company_name} className="h-full w-full object-cover" />
                    : c.company_name[0]?.toUpperCase()
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[15px] font-semibold text-slate-900">{c.company_name}</p>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_STYLES[c.subscription_status] ?? 'bg-slate-100 text-slate-400')}>
                      {c.subscription_status}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{c.plan}</span>
                    {!c.is_active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Deactivated</span>
                    )}
                    {c.is_active && !c.onboarding_completed && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">Setup Pending</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-400 flex-wrap">
                    {c.industry && <span>{c.industry}</span>}
                    {c.city && <><span>·</span><span>{c.city}</span></>}
                    {c.primary_contact_name && <><span>·</span><span>{c.primary_contact_name}</span></>}
                    <span>·</span>
                    <span>Joined {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[12px]">
                    <span className="text-slate-600 font-medium"><span className="font-bold text-slate-800">{c.jobs_count}</span> jobs</span>
                    <span className="text-slate-600 font-medium"><span className="font-bold text-slate-800">{c.candidates_count}</span> candidates</span>
                    <span className="text-slate-600 font-medium"><span className="font-bold text-slate-800">{c.applications_count}</span> applications</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => navigate(`/super-admin/clients/${c.id}`)}
                    title="View full client profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => { setResetTarget(c); setResetPw(''); setResetError('') }}
                    title="Reset admin password"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <KeyRound className="h-3.5 w-3.5" /> Reset PW
                  </button>
                  <button
                    onClick={() => handleToggleStatus(c.id, c.is_active)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors',
                      c.is_active
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100',
                    )}>
                    {c.is_active ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    title="Delete client"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Client Modal ──────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-[17px] font-bold text-slate-900">Add New Client</h2>
              <button onClick={() => setShowCreate(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Company Name *</label>
                <input value={form.company_name} onChange={e => setF('company_name', e.target.value)}
                  required placeholder="Acme Corp" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Plan</label>
                <select value={form.plan} onChange={e => setF('plan', e.target.value)} className={inputCls}>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Admin Name *</label>
                <input value={form.admin_name} onChange={e => setF('admin_name', e.target.value)}
                  required placeholder="John Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Admin Email *</label>
                <input type="email" value={form.admin_email} onChange={e => setF('admin_email', e.target.value)}
                  required placeholder="admin@acmecorp.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Admin Password *</label>
                <div className="relative">
                  <input type={showCreatePw ? 'text' : 'password'} value={form.admin_password}
                    onChange={e => setF('admin_password', e.target.value)}
                    required placeholder="Min 8 characters" minLength={8} className={cn(inputCls, 'pr-11')} />
                  <button type="button" onClick={() => setShowCreatePw(!showCreatePw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCreatePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {createError && <p className="text-[13px] text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                  style={{ background: saving ? '#4338ca' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ─────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900">Reset Password</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">{resetTarget.company_name}</p>
              </div>
              <button onClick={() => setResetTarget(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>New Password *</label>
                <div className="relative">
                  <input type={showResetPw ? 'text' : 'password'} value={resetPw}
                    onChange={e => setResetPw(e.target.value)}
                    required placeholder="Min 8 characters" minLength={8}
                    className={cn(inputCls, 'pr-11')} />
                  <button type="button" onClick={() => setShowResetPw(!showResetPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">This will reset the admin account password for this client.</p>
              </div>
              {resetError && <p className="text-[13px] text-red-600">{resetError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={resetting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                  style={{ background: resetting ? '#1d4ed8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  {resetting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : <><KeyRound className="h-4 w-4" /> Reset Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 text-center">Deactivate Client?</h2>
            <p className="text-[13px] text-slate-500 text-center mt-2 leading-relaxed">
              <span className="font-semibold text-slate-700">"{deleteTarget.company_name}"</span> will be deactivated and all their users will be blocked. This can be reversed by activating the account again.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                style={{ background: deleting ? '#dc2626' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deactivating…</> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
