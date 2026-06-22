import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { clientApi } from '@/lib/clientApi'
import { Loader2, Building2, MapPin, User, CheckCircle2, ChevronRight, ChevronLeft, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import LogoCropper from '@/components/LogoCropper'

const INDUSTRIES = [
  'Technology','Finance','Healthcare','Education','Manufacturing',
  'Retail','Consulting','Media','Real Estate','Hospitality','Other',
]
const COMPANY_SIZES = ['1-10','11-50','51-200','201-500','501-1000','1000+']

const STEPS = [
  { id: 1, label: 'Company Identity', icon: Building2 },
  { id: 2, label: 'Location & Legal', icon: MapPin    },
  { id: 3, label: 'Primary Contact',  icon: User      },
  { id: 4, label: 'Review & Finish',  icon: CheckCircle2 },
]

interface FormData {
  company_tagline: string
  industry: string
  company_size: string
  website: string
  logo_url: string
  address_line1: string
  city: string
  state: string
  pincode: string
  cin_number: string
  gst_number: string
  primary_contact_name: string
  primary_contact_phone: string
  primary_contact_designation: string
}

export default function ClientOnboardingPage() {
  const { client, tenant, updateTenant } = useClientAuth()
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    company_tagline: '', industry: '', company_size: '11-50', website: '',
    logo_url: '', address_line1: '', city: '', state: '', pincode: '',
    cin_number: '', gst_number: '', primary_contact_name: client?.full_name ?? '',
    primary_contact_phone: '', primary_contact_designation: '',
  })

  function set(key: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

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
      set('logo_url', data.data.url)
      setCropSrc(null)
    } catch {
      setCropSrc(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleFinish() {
    setSaving(true); setError('')
    try {
      await clientApi.post('/complete-onboarding', form)
      updateTenant({ onboarding_completed: true, industry: form.industry, logo_url: form.logo_url || null })
      navigate('/client/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-[26px] font-bold text-slate-900">Set up {tenant?.company_name ?? 'your company'}</h1>
          <p className="text-slate-500 mt-1 text-[14px]">Complete your company profile to get started</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full text-[12px] font-bold shrink-0 transition-all',
                step > s.id ? 'bg-amber-500 text-white' :
                step === s.id ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                'bg-slate-100 text-slate-400'
              )}>
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={cn('text-[11px] font-semibold', step >= s.id ? 'text-amber-600' : 'text-slate-400')}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-3', step > s.id ? 'bg-amber-400' : 'bg-slate-100')} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">

          {/* Step 1: Company Identity */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" /> Company Identity
              </h2>

              <div>
                <label className={labelCls}>Company Name</label>
                <input value={tenant?.company_name ?? ''} readOnly
                  className={cn(inputCls, 'bg-slate-50 text-slate-500 cursor-not-allowed')} />
                <p className="text-[11px] text-slate-400 mt-1">Company name cannot be changed here</p>
              </div>

              <div>
                <label className={labelCls}>Tagline / Motto</label>
                <input value={form.company_tagline} onChange={e => set('company_tagline', e.target.value)}
                  placeholder="e.g. Building the future of work" className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Industry *</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} className={inputCls}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Company Size *</label>
                  <select value={form.company_size} onChange={e => set('company_size', e.target.value)} className={inputCls}>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://yourcompany.com" type="url" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Company Logo</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <Upload className="h-4 w-4 text-slate-400" />}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{form.logo_url ? 'Change logo' : 'Upload logo'}</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB · Square crop</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Location & Legal */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" /> Location & Legal
              </h2>

              <div>
                <label className={labelCls}>Office Address</label>
                <input value={form.address_line1} onChange={e => set('address_line1', e.target.value)}
                  placeholder="123 MG Road, Koramangala" className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City *</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Bengaluru" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <input value={form.state} onChange={e => set('state', e.target.value)}
                    placeholder="Karnataka" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Pincode</label>
                <input value={form.pincode} onChange={e => set('pincode', e.target.value)}
                  placeholder="560001" maxLength={6} className={inputCls} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CIN Number</label>
                  <input value={form.cin_number} onChange={e => set('cin_number', e.target.value)}
                    placeholder="U72900KA2020PTC..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>GST Number</label>
                  <input value={form.gst_number} onChange={e => set('gst_number', e.target.value)}
                    placeholder="29ABCDE1234F1Z5" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Primary Contact */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" /> Primary Contact
              </h2>

              <div>
                <label className={labelCls}>Contact Person Name *</label>
                <input value={form.primary_contact_name} onChange={e => set('primary_contact_name', e.target.value)}
                  placeholder="Ramesh Kumar" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Designation</label>
                <input value={form.primary_contact_designation} onChange={e => set('primary_contact_designation', e.target.value)}
                  placeholder="HR Director" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Phone Number *</label>
                <input value={form.primary_contact_phone} onChange={e => set('primary_contact_phone', e.target.value)}
                  placeholder="+91 98765 43210" type="tel" className={inputCls} />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-500" /> Review & Finish
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Company', value: tenant?.company_name },
                  { label: 'Industry', value: form.industry },
                  { label: 'Size', value: form.company_size ? `${form.company_size} employees` : '' },
                  { label: 'Website', value: form.website },
                  { label: 'City', value: form.city },
                  { label: 'State', value: form.state },
                  { label: 'GST', value: form.gst_number },
                  { label: 'Contact', value: form.primary_contact_name },
                  { label: 'Phone', value: form.primary_contact_phone },
                  { label: 'Designation', value: form.primary_contact_designation },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-[13px] font-medium text-slate-800 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-[13px] text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-medium transition-colors',
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-100',
              )}>
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
                style={{ background: saving ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: saving ? 'none' : '0 4px 12px rgba(245,158,11,0.3)' }}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4" /> Complete Setup</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
