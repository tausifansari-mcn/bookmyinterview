import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users, Plus, Search, Shield, UserCheck, UserX, Key, Trash2,
  Loader2, CheckCircle2, X, ChevronDown, Eye, EyeOff, RefreshCw,
  Crown, Briefcase, User, Mail, Phone, Lock, AlertTriangle
} from 'lucide-react'

// ── auth header ───────────────────────────────────────────────
const authHdr = () => ({
  Authorization: `Bearer ${localStorage.getItem('bmi_token') ?? ''}`,
  'Content-Type': 'application/json',
})

// ── Role config ───────────────────────────────────────────────
const ROLES = [
  { value: 'super_admin',   label: 'Super Admin',    color: 'bg-red-100 text-red-700 border-red-200',       icon: Crown },
  { value: 'admin',         label: 'Admin',          color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Shield },
  { value: 'hr_manager',    label: 'HR Manager',     color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Users },
  { value: 'recruiter',     label: 'Recruiter',      color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: UserCheck },
  { value: 'interviewer',   label: 'Interviewer',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Briefcase },
  { value: 'hiring_manager',label: 'Hiring Manager', color: 'bg-teal-100 text-teal-700 border-teal-200',   icon: Briefcase },
  { value: 'viewer',        label: 'Viewer',         color: 'bg-gray-100 text-gray-600 border-gray-200',   icon: User },
]

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(x => x.value === role) ?? ROLES[ROLES.length - 1]
  const Icon = r.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${r.color}`}>
      <Icon className="h-3 w-3" /> {r.label}
    </span>
  )
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm'|'md'|'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500']
  const color  = colors[name.charCodeAt(0) % colors.length]
  const cls    = size === 'lg' ? 'h-12 w-12 text-base' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <div className={`${cls} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success'|'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white
      ${type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  )
}

// ── Field helpers ─────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, required, icon: Icon }: any) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
        <input
          type={isPass && !show ? 'password' : 'text'}
          value={value ?? ''} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className={`w-full rounded-xl border border-gray-200 py-2.5 text-sm outline-none transition-all
            ${Icon ? 'pl-9' : 'pl-3.5'} ${isPass ? 'pr-10' : 'pr-3.5'}
            focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 hover:border-gray-300`}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, required, placeholder }: any) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select value={value ?? ''} onChange={e => onChange(e.target.value)} required={required}
          className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none bg-white appearance-none
            focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 hover:border-gray-300 pr-9">
          <option value="">{placeholder ?? '— Select —'}</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Create User Modal
// ════════════════════════════════════════════════════════════
function CreateUserModal({ onClose, onCreated, currentRole }: { onClose: () => void; onCreated: () => void; currentRole: string }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: '', mobile: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState<any>(null)

  const roleOptions = ROLES
    .filter(r => currentRole === 'super_admin' || r.value !== 'super_admin')
    .map(r => ({ value: r.value, label: r.label }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const { data } = await axios.post('/api/v1/users', form, { headers: authHdr() })
      setResult(data)
      onCreated()
    } catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to create user') }
    finally { setSaving(false) }
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">User Created!</h3>
          <p className="text-gray-500 text-sm mb-4">{result.message}</p>
          {result.data?.temp_password && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Temporary Password</p>
              <p className="font-mono text-lg font-bold text-gray-900">{result.data.temp_password}</p>
              <p className="text-xs text-amber-600 mt-1">Share this with the user. They must change it on first login.</p>
            </div>
          )}
          <button onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Team Member</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create a new admin / staff account</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={form.full_name} onChange={(v: string) => setForm({...form, full_name: v})}
              placeholder="John Smith" required icon={User} />
            <Field label="Mobile" value={form.mobile} onChange={(v: string) => setForm({...form, mobile: v})}
              placeholder="+91 9876543210" icon={Phone} />
          </div>
          <Field label="Email Address" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})}
            placeholder="john@company.com" required icon={Mail} />
          <SelectField label="Role" value={form.role} onChange={(v: string) => setForm({...form, role: v})}
            options={roleOptions} required placeholder="— Select role —" />
          <Field label="Password (optional — leave blank to auto-generate)" type="password" value={form.password}
            onChange={(v: string) => setForm({...form, password: v})} placeholder="Min. 8 characters" icon={Lock} />
          <p className="text-xs text-gray-400">
            If you leave the password blank, a temporary password will be generated and shown to you after creation.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><Plus className="h-4 w-4" />Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Reset Password Modal
// ════════════════════════════════════════════════════════════
function ResetPasswordModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [newPwd, setNewPwd]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [result, setResult]   = useState<any>(null)
  const [error, setError]     = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const { data } = await axios.post(`/api/v1/users/${user.id}/reset-password`,
        { new_password: newPwd || undefined }, { headers: authHdr() })
      setResult(data)
    } catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to reset password') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} />
            <div>
              <h2 className="text-base font-bold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900 mb-2">{result.message}</p>
            {result.data?.temp_password && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
                <p className="text-xs font-bold text-amber-700 uppercase mb-1">New Password</p>
                <p className="font-mono text-lg font-bold text-gray-900">{result.data.temp_password}</p>
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">Done</button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="p-6 space-y-4">
            <Field label="New Password (optional — blank = auto-generate)" type="password" value={newPwd}
              onChange={setNewPwd} placeholder="Min. 8 characters" icon={Lock} />
            {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {saving ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Edit Role Modal
// ════════════════════════════════════════════════════════════
function EditRoleModal({ user, onClose, onSaved, currentRole }: { user: any; onClose: () => void; onSaved: () => void; currentRole: string }) {
  const [role, setRole]     = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const roleOptions = ROLES
    .filter(r => currentRole === 'super_admin' || r.value !== 'super_admin')
    .map(r => ({ value: r.value, label: r.label }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await axios.put(`/api/v1/users/${user.id}`, { role }, { headers: authHdr() })
      onSaved(); onClose()
    } catch (err: any) { setError(err?.response?.data?.message ?? 'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} />
            <div>
              <h2 className="text-base font-bold text-gray-900">Change Role</h2>
              <p className="text-sm text-gray-500">{user.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <SelectField label="New Role" value={role} onChange={setRole} options={roleOptions} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════
export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers]           = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [toast, setToast]           = useState<{msg: string; type: 'success'|'error'}|null>(null)

  const [showCreate, setShowCreate]         = useState(false)
  const [resetTarget, setResetTarget]       = useState<any>(null)
  const [editRoleTarget, setEditRoleTarget] = useState<any>(null)
  const [confirmDelete, setConfirmDelete]   = useState<any>(null)

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  async function loadUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)     params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const { data } = await axios.get(`/api/v1/users?${params}`, { headers: authHdr() })
      setUsers(data.data)
    } catch { showToast('Failed to load users', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [roleFilter])

  async function toggleBlock(u: any) {
    try {
      const newVal = u.is_blocked ? 0 : 1
      await axios.put(`/api/v1/users/${u.id}`, { is_blocked: newVal }, { headers: authHdr() })
      showToast(newVal ? `${u.full_name} blocked` : `${u.full_name} unblocked`)
      loadUsers()
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
  }

  async function deleteUser(u: any) {
    try {
      await axios.delete(`/api/v1/users/${u.id}`, { headers: authHdr() })
      showToast(`${u.full_name} removed from team`)
      setConfirmDelete(null); loadUsers()
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
  }

  const isSuperAdmin = me?.role === 'super_admin'
  const isAdmin      = me?.role === 'admin' || isSuperAdmin

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const formatLast = (d?: string) => {
    if (!d) return 'Never'
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team Members</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage admin and staff accounts for your organization</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-indigo-500/25 hover:opacity-90 transition-all">
              <Plus className="h-4 w-4" /> Add Team Member
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Members', value: users.length, color: 'text-gray-900' },
            { label: 'Super Admin / Admin', value: users.filter(u => ['super_admin','admin'].includes(u.role)).length, color: 'text-red-600' },
            { label: 'Active', value: users.filter(u => !u.is_blocked).length, color: 'text-emerald-600' },
            { label: 'Blocked', value: users.filter(u => u.is_blocked).length, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex gap-3 flex-wrap items-center">
          <div className="flex-1 relative min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUsers()}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10" />
          </div>
          <div className="relative">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 outline-none bg-white appearance-none pr-9
                focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={loadUsers}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Search className="h-3.5 w-3.5" /> Search
          </button>
          <button onClick={() => { setSearch(''); setRoleFilter(''); setTimeout(loadUsers, 0) }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">No team members found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new member</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Member</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Last Login</th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => {
                    const isMe      = u.id === me?.id
                    const canAct    = isMe ? false : (isSuperAdmin || (isAdmin && u.role !== 'super_admin'))
                    const canDelete = isSuperAdmin && !isMe

                    return (
                      <tr key={u.id} className={`hover:bg-indigo-50/20 transition-colors ${isMe ? 'bg-indigo-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar name={u.full_name} />
                              {isMe && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm">{u.full_name}</span>
                                {isMe && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                                {u.must_change_password ? <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Temp pwd</span> : null}
                              </div>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {u.email}
                              </span>
                              {u.mobile && (
                                <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3" /> {u.mobile}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-4">
                          {u.is_blocked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                              <UserX className="h-3 w-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <UserCheck className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">{formatLast(u.last_login_at)}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 justify-end">
                            {canAct && (
                              <>
                                <button onClick={() => setEditRoleTarget(u)} title="Change Role"
                                  className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors" >
                                  <Shield className="h-4 w-4" />
                                </button>
                                <button onClick={() => setResetTarget(u)} title="Reset Password"
                                  className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors">
                                  <Key className="h-4 w-4" />
                                </button>
                                <button onClick={() => toggleBlock(u)} title={u.is_blocked ? 'Unblock' : 'Block'}
                                  className={`p-2 rounded-lg transition-colors ${u.is_blocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                                  {u.is_blocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                </button>
                              </>
                            )}
                            {canDelete && (
                              <button onClick={() => setConfirmDelete(u)} title="Delete User"
                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {!canAct && !canDelete && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role legend */}
        <div className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Role Permissions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { role: 'super_admin',    can: 'Full access — all settings, all users, all tenants' },
              { role: 'admin',          can: 'Manage team, jobs, candidates, settings' },
              { role: 'hr_manager',     can: 'Manage jobs, candidates, applications, reports' },
              { role: 'recruiter',      can: 'Post jobs, manage candidates, schedule interviews' },
              { role: 'interviewer',    can: 'View assigned interviews, submit feedback' },
              { role: 'hiring_manager', can: 'Review candidates, approve offers' },
              { role: 'viewer',         can: 'Read-only access to all sections' },
            ].map(({ role, can }) => (
              <div key={role} className="flex flex-col gap-1.5">
                <RoleBadge role={role} />
                <p className="text-xs text-gray-400 leading-snug">{can}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { loadUsers() }}
          currentRole={me?.role ?? ''}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}
      {editRoleTarget && (
        <EditRoleModal
          user={editRoleTarget}
          currentRole={me?.role ?? ''}
          onClose={() => setEditRoleTarget(null)}
          onSaved={() => { showToast('Role updated!'); loadUsers() }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Team Member?</h3>
            <p className="text-gray-500 text-sm mb-5">
              <span className="font-semibold text-gray-900">{confirmDelete.full_name}</span> ({confirmDelete.email}) will lose all access immediately.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-1.5">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
