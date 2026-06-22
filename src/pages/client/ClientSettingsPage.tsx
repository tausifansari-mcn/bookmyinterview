import { useState } from 'react'
import axios from 'axios'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { clientApi } from '@/lib/clientApi'
import { KeyRound, Loader2, Eye, EyeOff, CheckCircle2, User, Building2, Upload, ImageIcon } from 'lucide-react'
import LogoCropper from '@/components/LogoCropper'

export default function ClientSettingsPage() {
  const { client, tenant, updateTenant } = useClientAuth()

  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  const [cropSrc, setCropSrc]       = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [logoSuccess, setLogoSuccess] = useState(false)

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCropDone(blob: Blob) {
    setUploading(true)
    setLogoSuccess(false)
    try {
      const fd = new FormData()
      fd.append('photo', blob, 'logo.jpg')
      const token = localStorage.getItem('bmi_client_token')
      const { data } = await axios.post('/api/v1/upload/admin-photo', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const logo_url = data.data.url
      await clientApi.patch('/logo', { logo_url })
      updateTenant({ logo_url })
      setCropSrc(null)
      setLogoSuccess(true)
    } catch {
      setCropSrc(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(false)

    if (newPw.length < 8) {
      setError('New password must be at least 8 characters'); return
    }
    if (newPw !== confirmPw) {
      setError('New passwords do not match'); return
    }

    setLoading(true)
    try {
      await clientApi.post('/change-password', {
        current_password: currentPw,
        new_password: newPw,
      })
      setSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all'
  const labelCls = 'block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide'

  return (
    <>
    {cropSrc && (
      <LogoCropper
        imageSrc={cropSrc}
        uploading={uploading}
        onDone={handleCropDone}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Settings</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Company Logo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-1 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-500" /> Company Logo
        </h2>
        <p className="text-[12.5px] text-slate-400 mb-4">Upload a square logo — it will be cropped and shown on job postings.</p>

        {logoSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">Logo updated successfully!</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center bg-slate-50">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-slate-300" />
            )}
          </div>
          <label className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              {uploading
                ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                : <Upload className="h-4 w-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-700">
                {tenant?.logo_url ? 'Replace logo' : 'Upload logo'}
              </p>
              <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB · Square crop</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
          </label>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-amber-500" /> Account Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name',    value: client?.full_name },
            { label: 'Email',        value: client?.email },
            { label: 'Role',         value: client?.role },
            { label: 'Company',      value: tenant?.company_name },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-[13px] font-medium text-slate-800 mt-0.5 truncate">{value ?? '—'}</p>
            </div>
          ))}
        </div>
        {tenant?.subscription_status && (
          <div className="mt-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-[12px] text-slate-500">Plan:</span>
            <span className="text-[12px] font-semibold text-amber-600 capitalize">{tenant.subscription_status}</span>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-amber-500" /> Change Password
        </h2>
        <p className="text-[12.5px] text-slate-400 mb-5">Choose a strong password with at least 8 characters.</p>

        {success && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">Password changed successfully!</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Current Password *</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                required placeholder="Enter current password"
                className={inputCls + ' pr-11'}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>New Password *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required placeholder="Min 8 characters"
                className={inputCls + ' pr-11'}
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Confirm New Password *</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required placeholder="Re-enter new password"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-[10px] font-bold">!</span>
              </div>
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
            style={{ background: loading ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: loading ? 'none' : '0 4px 12px rgba(245,158,11,0.3)' }}>
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing…</>
              : <><KeyRound className="h-4 w-4" /> Change Password</>}
          </button>
        </form>
      </div>
    </div>
    </>
  )
}
