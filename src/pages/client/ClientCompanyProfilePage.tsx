import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { clientApi } from '@/lib/clientApi'
import {
  Building2, Globe, ImagePlus, Trash2, Loader2, CheckCircle2, Plus, X,
  Camera, Award, Briefcase, FileText, BookOpen
} from 'lucide-react'

interface MediaItem {
  id: string
  media_type: 'photo' | 'achievement' | 'project' | 'banner'
  title: string | null
  description: string | null
  file_url: string
}

const MEDIA_TABS: { key: MediaItem['media_type']; label: string; icon: any }[] = [
  { key: 'photo',       label: 'Photos',       icon: Camera    },
  { key: 'achievement', label: 'Achievements', icon: Award     },
  { key: 'project',     label: 'Projects',     icon: Briefcase },
]

export default function ClientCompanyProfilePage() {
  const [profile, setProfile]       = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  // Text fields
  const [about, setAbout]           = useState('')
  const [culture, setCulture]       = useState('')
  const [achievements, setAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState('')

  // Media
  const [mediaTab, setMediaTab]     = useState<MediaItem['media_type']>('photo')
  const [media, setMedia]           = useState<MediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  // Add media form
  const [showAddMedia, setShowAddMedia] = useState(false)
  const [mediaTitle, setMediaTitle]     = useState('')
  const [mediaDesc, setMediaDesc]       = useState('')
  const [mediaFile, setMediaFile]       = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    clientApi.get('/company/profile')
      .then(r => {
        const d = r.data.data
        setProfile(d)
        setAbout(d.about_company ?? '')
        setCulture(d.culture_description ?? '')
        const ach = Array.isArray(d.achievements_json) ? d.achievements_json : []
        setAchievements(ach)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoadingMedia(true)
    clientApi.get(`/company/media?type=${mediaTab}`)
      .then(r => setMedia(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingMedia(false))
  }, [mediaTab])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false)
    try {
      await clientApi.patch('/company/profile', {
        about_company: about || null,
        culture_description: culture || null,
        achievements_json: achievements,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally {
      setSaving(false)
    }
  }

  function handleAddAchievement() {
    const val = newAchievement.trim()
    if (!val) return
    setAchievements(prev => [...prev, val])
    setNewAchievement('')
  }

  async function handleAddMedia() {
    if (!mediaFile) return
    setUploadingMedia(true)
    try {
      const fd = new FormData()
      fd.append('photo', mediaFile)
      const token = localStorage.getItem('bmi_client_token')
      const { data: uploadData } = await axios.post('/api/v1/upload/company-media', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const file_url = uploadData.data.url
      const { data } = await clientApi.post('/company/media', {
        title: mediaTitle || null,
        description: mediaDesc || null,
        file_url,
        media_type: mediaTab,
      })
      setMedia(prev => [...prev, data.data])
      setShowAddMedia(false)
      setMediaTitle(''); setMediaDesc(''); setMediaFile(null)
    } catch {} finally {
      setUploadingMedia(false)
    }
  }

  async function handleDeleteMedia(id: string) {
    try {
      await clientApi.delete(`/company/media/${id}`)
      setMedia(prev => prev.filter(m => m.id !== id))
    } catch {}
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all'
  const labelCls = 'block text-[12px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Company Profile</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Candidates see this when they view your job postings</p>
      </div>

      {/* ── About & Culture form ──────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-amber-500" /> Company Story
        </h2>

        {saved && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-[13px] text-emerald-700 font-medium">Company profile saved!</p>
          </div>
        )}

        <div>
          <label className={labelCls}>About Company</label>
          <textarea value={about} onChange={e => setAbout(e.target.value)} rows={4}
            placeholder="Tell candidates about your company — your mission, products, impact, and why it's a great place to work…"
            className={inputCls + ' resize-none'} />
          <p className="text-[11px] text-slate-400 mt-1">{about.length} chars</p>
        </div>

        <div>
          <label className={labelCls}>Culture & Work Environment</label>
          <textarea value={culture} onChange={e => setCulture(e.target.value)} rows={3}
            placeholder="Describe your team culture, work-life balance, learning opportunities, values…"
            className={inputCls + ' resize-none'} />
        </div>

        <div>
          <label className={labelCls}>Key Achievements</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {achievements.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-[12px] font-medium text-amber-700">
                <Award className="h-3 w-3" /> {a}
                <button type="button" onClick={() => setAchievements(prev => prev.filter((_, j) => j !== i))}
                  className="text-amber-400 hover:text-amber-600 ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newAchievement} onChange={e => setNewAchievement(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAchievement() } }}
              placeholder="e.g. Raised Series A, 50K+ users, ISO certified…"
              className={inputCls} />
            <button type="button" onClick={handleAddAchievement}
              className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shrink-0">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Press Enter or click + to add</p>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all"
          style={{ background: saving ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: saving ? 'none' : '0 4px 12px rgba(245,158,11,0.3)' }}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Globe className="h-4 w-4" /> Save Profile</>}
        </button>
      </form>

      {/* ── Media section ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-amber-500" /> Company Gallery
          </h2>
          <button onClick={() => { setShowAddMedia(true); setMediaTitle(''); setMediaDesc(''); setMediaFile(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add {mediaTab.charAt(0).toUpperCase() + mediaTab.slice(1)}
          </button>
        </div>

        {/* Media type tabs */}
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
          {MEDIA_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMediaTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${mediaTab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {loadingMedia ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-amber-400" /></div>
        ) : media.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
            <ImagePlus className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-400">No {mediaTab}s added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map(m => (
              <div key={m.id} className="group relative rounded-xl overflow-hidden border border-slate-100">
                <img src={m.file_url} alt={m.title ?? mediaTab} className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                  <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.title && <p className="text-white text-[11px] font-medium truncate">{m.title}</p>}
                    <button onClick={() => handleDeleteMedia(m.id)}
                      className="mt-1 flex items-center gap-1 text-[10px] text-red-300 hover:text-red-200">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Media Modal ───────────────────────────────────── */}
      {showAddMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-[15px] font-bold text-slate-900">Add {mediaTab.charAt(0).toUpperCase() + mediaTab.slice(1)}</p>
              <button onClick={() => setShowAddMedia(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Image *</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
                  {mediaFile ? (
                    <img src={URL.createObjectURL(mediaFile)} alt="preview" className="h-12 w-20 object-cover rounded-lg" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <ImagePlus className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{mediaFile ? mediaFile.name : 'Choose image'}</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG up to 5MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => setMediaFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input value={mediaTitle} onChange={e => setMediaTitle(e.target.value)}
                  placeholder="e.g. Team offsite 2024" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={mediaDesc} onChange={e => setMediaDesc(e.target.value)} rows={2}
                  placeholder="Optional description…" className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddMedia(false)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleAddMedia}
                  disabled={!mediaFile || uploadingMedia}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  {uploadingMedia ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><ImagePlus className="h-4 w-4" /> Upload</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
