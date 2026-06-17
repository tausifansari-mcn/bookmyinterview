import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import {
  User, Briefcase, GraduationCap, Award, Languages, FileText, ChevronDown,
  Plus, Trash2, Loader2, CheckCircle2, Sparkles, LogOut, Home, Star, X,
  Camera, Upload, Mic, Video, Square, RotateCcw, Zap, Link2, MapPin,
  Phone, Mail, Globe, Edit3, Save
} from 'lucide-react'

// ── auth header helper ────────────────────────────────────────
const authHdr = () => ({
  Authorization: `Bearer ${localStorage.getItem('bmi_candidate_token') ?? ''}`,
})

// ── Completion ring SVG ───────────────────────────────────────
function CompletionRing({ pct }: { pct: number }) {
  const r = 36; const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 100) / 100
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#818cf8'
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-lg">
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="45" y="42" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{pct}%</text>
      <text x="45" y="56" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">Complete</text>
    </svg>
  )
}

// ── Section card ──────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, accent = 'indigo' }: any) {
  const [open, setOpen] = useState(defaultOpen)
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    violet: 'bg-violet-100 text-violet-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber:   'bg-amber-100 text-amber-600',
    rose:    'bg-rose-100 text-rose-600',
    sky:     'bg-sky-100 text-sky-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${colors[accent] ?? colors.indigo}`}>
            <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-semibold text-gray-800 text-[15px]">{title}</span>
        </div>
        <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-100 bg-white">{children}</div>}
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, required, readOnly, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all
          ${readOnly ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                     : 'bg-white border-gray-200 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 hover:border-gray-300'}`} />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3, maxLength = 1000, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={rows} maxLength={maxLength}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all resize-none
          focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 hover:border-gray-300" />
      <p className="text-[11px] text-gray-400 text-right mt-1">{(value ?? '').length}/{maxLength}</p>
    </div>
  )
}

function Select({ label, value, onChange, options, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none bg-white transition-all
          focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 hover:border-gray-300">
        <option value="">— Select —</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SaveBtn({ loading, saved, label = 'Save Changes' }: { loading: boolean; saved: boolean; label?: string }) {
  return (
    <button type="submit" disabled={loading}
      className={`mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
        ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-60`}>
      {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
               : saved  ? <><CheckCircle2 className="h-3.5 w-3.5" />Saved!</>
                        : <><Save className="h-3.5 w-3.5" />{label}</>}
    </button>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium text-white
      animate-in slide-in-from-right-4 duration-300
      ${type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
      {type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
      {msg}
    </div>
  )
}

// ── Skill level badge ─────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    expert:       'bg-purple-100 text-purple-700 border-purple-200',
    advanced:     'bg-blue-100 text-blue-700 border-blue-200',
    intermediate: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    beginner:     'bg-gray-100 text-gray-600 border-gray-200',
  }
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${styles[level] ?? styles.beginner}`}>{level}</span>
}

// ════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════
export default function PortalProfilePage() {
  const { candidate, logout, updateCandidate } = useCandidateAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [completion, setCompletion] = useState(0)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function refreshCompletion() {
    try {
      const r = await portalApi.get('/me/completion')
      setCompletion(r.data.data.profile_completion)
    } catch {}
  }

  // ── Photo upload ──────────────────────────────────────────
  const [photoUrl, setPhotoUrl]               = useState('')
  const [uploadingPhoto, setUploadingPhoto]   = useState(false)
  const photoInputRef                         = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData(); fd.append('photo', file)
      const { data } = await axios.post('/api/v1/upload/photo', fd, { headers: authHdr() })
      setPhotoUrl(data.data.url)
      setPersonal((p: any) => ({ ...p, profile_photo_url: data.data.url }))
      updateCandidate({ profile_photo_url: data.data.url })
      showToast('Profile photo updated!')
      refreshCompletion()
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Photo upload failed', 'error') }
    finally { setUploadingPhoto(false); e.target.value = '' }
  }

  // ── Resume upload + AI parse ──────────────────────────────
  const [resumeUrl, setResumeUrl]             = useState('')
  const [resumeFileName, setResumeFileName]   = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const [parsingAI, setParsingAI]             = useState(false)
  const [parseStep, setParseStep]             = useState<'idle'|'ready'|'parsing'|'done'>('idle')
  const resumeInputRef                        = useRef<HTMLInputElement>(null)

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setResumeFileName(file.name)
    setUploadingResume(true); setParseStep('idle')
    try {
      const fd = new FormData(); fd.append('resume', file)
      const { data } = await axios.post('/api/v1/upload/resume', fd, { headers: authHdr() })
      setResumeUrl(data.data.url)
      setPersonal((p: any) => ({ ...p, resume_url: data.data.url }))
      showToast('Resume uploaded! Click "Auto-fill with AI" to parse it.')
      setParseStep(data.data.has_text ? 'ready' : 'idle')
      refreshCompletion()
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Resume upload failed', 'error') }
    finally { setUploadingResume(false); e.target.value = '' }
  }

  async function parseResumeWithAI() {
    setParsingAI(true); setParseStep('parsing')
    try {
      const { data } = await axios.post('/api/v1/upload/parse-resume', {}, { headers: authHdr() })
      const p = data.data

      // Auto-fill personal info (only non-empty values)
      setPersonal((prev: any) => ({
        ...prev,
        full_name:             p.full_name            || prev.full_name,
        mobile:                p.mobile               || prev.mobile,
        linkedin_url:          p.linkedin_url         || prev.linkedin_url,
        github_url:            p.github_url           || prev.github_url,
        portfolio_url:         p.portfolio_url        || prev.portfolio_url,
        current_company:       p.current_company      || prev.current_company,
        current_designation:   p.current_designation  || prev.current_designation,
        total_experience_years: p.total_experience_years || prev.total_experience_years,
        current_location:      p.current_location     || prev.current_location,
        professional_summary:  p.professional_summary || prev.professional_summary,
        career_objective:      p.career_objective     || prev.career_objective,
      }))

      let added = 0
      // Add skills
      for (const sk of (p.skills ?? [])) {
        try { await portalApi.post('/me/skills', sk); added++ } catch {}
      }
      // Add education
      for (const edu of (p.education ?? [])) {
        try { await portalApi.post('/me/education', edu); added++ } catch {}
      }
      // Add experience
      for (const exp of (p.experience ?? [])) {
        try { await portalApi.post('/me/experience', { ...exp, is_current: exp.is_current ? 1 : 0 }); added++ } catch {}
      }
      // Add certifications
      for (const cert of (p.certifications ?? [])) {
        try { await portalApi.post('/me/certifications', cert); added++ } catch {}
      }
      // Reload all sections
      loadEducations(); loadExperiences(); loadSkills(); loadCerts()
      refreshCompletion()
      showToast(`AI auto-filled your profile (${added} entries added). Review & save.`)
      setParseStep('done')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'AI parsing failed', 'error'); setParseStep('ready') }
    finally { setParsingAI(false) }
  }

  // ── Voice / Video intro recording ────────────────────────
  const [mediaUrl, setMediaUrl]             = useState('')
  const [recordMode, setRecordMode]         = useState<'audio'|'video'>('audio')
  const [recording, setRecording]           = useState(false)
  const [recordingTime, setRecordingTime]   = useState(0)
  const [recordedBlob, setRecordedBlob]     = useState<Blob|null>(null)
  const [recordedUrl, setRecordedUrl]       = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const mediaRecorderRef                    = useRef<MediaRecorder|null>(null)
  const chunksRef                           = useRef<Blob[]>([])
  const timerRef                            = useRef<ReturnType<typeof setInterval>>()
  const liveVideoRef                        = useRef<HTMLVideoElement>(null)
  const streamRef                           = useRef<MediaStream|null>(null)

  function getBestMimeType(isVideo: boolean): string {
    const types = isVideo
      ? ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    return types.find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) ?? ''
  }

  async function startRecording() {
    try {
      const constraints = recordMode === 'video' ? { video: true, audio: true } : { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (liveVideoRef.current && recordMode === 'video') {
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.play().catch(() => {})
      }
      chunksRef.current = []
      const mimeType = getBestMimeType(recordMode === 'video')
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const type = mimeType || (recordMode === 'video' ? 'video/webm' : 'audio/webm')
        const blob = new Blob(chunksRef.current, { type })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null
      }
      mr.start(250)
      mediaRecorderRef.current = mr
      setRecording(true); setRecordingTime(0); setRecordedBlob(null); setRecordedUrl('')
      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t >= 60) { stopRecording(); return t }
          return t + 1
        })
      }, 1000)
    } catch (err: any) {
      const name = err?.name ?? ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showToast('Camera/microphone access denied. Please allow permissions in your browser settings.', 'error')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        showToast('No camera/microphone detected. Please check your device.', 'error')
      } else if (name === 'NotSupportedError' || name === 'NotReadableError') {
        showToast('Recording not supported in this browser. Please try Chrome or Firefox.', 'error')
      } else {
        showToast('Could not start recording. Please check your device and try again.', 'error')
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }

  async function uploadMedia() {
    if (!recordedBlob) return
    setUploadingMedia(true)
    try {
      const fd = new FormData()
      fd.append('media', recordedBlob, `intro.webm`)
      fd.append('duration', String(recordingTime))
      const { data } = await axios.post('/api/v1/upload/media', fd, { headers: authHdr() })
      setMediaUrl(data.data.url)
      showToast(`${recordMode === 'video' ? 'Video' : 'Voice'} introduction uploaded!`)
      refreshCompletion()
      setRecordedBlob(null); setRecordedUrl('')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Upload failed', 'error') }
    finally { setUploadingMedia(false) }
  }

  function discardRecording() {
    setRecordedBlob(null); setRecordedUrl(''); setRecordingTime(0)
  }

  // ── Personal Info ─────────────────────────────────────────
  const [personal, setPersonal] = useState<any>({})
  const [savingP, setSavingP]   = useState(false)
  const [savedP, setSavedP]     = useState(false)

  useEffect(() => {
    if (!candidate) { navigate('/portal/login'); return }
    portalApi.get('/me').then(r => {
      const d = r.data.data
      setPersonal(d)
      if (d.profile_photo_url) setPhotoUrl(d.profile_photo_url)
      if (d.resume_url)        { setResumeUrl(d.resume_url); setParseStep('ready') }
      if (d.voice_intro_url)   setMediaUrl(d.voice_intro_url)
    }).catch(() => {})
    refreshCompletion()
  }, [candidate])

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault(); setSavingP(true)
    try {
      await portalApi.patch('/me', personal)
      setSavedP(true); setTimeout(() => setSavedP(false), 3000)
      refreshCompletion(); showToast('Profile information saved!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed to save', 'error') }
    finally { setSavingP(false) }
  }

  // ── Education ─────────────────────────────────────────────
  const [educations, setEducations] = useState<any[]>([])
  const [eduForm, setEduForm]       = useState<any>({ qualification:'', degree:'', specialization:'', institute:'', university:'', passing_year:'', percentage:'', cgpa:'' })
  const [editEduId, setEditEduId]   = useState<string|null>(null)
  const [savingEdu, setSavingEdu]   = useState(false)

  const loadEducations = useCallback(() => {
    portalApi.get('/me/education').then(r => setEducations(r.data.data)).catch(() => {})
  }, [])
  useEffect(() => { loadEducations() }, [loadEducations])

  async function saveEducation(e: React.FormEvent) {
    e.preventDefault(); setSavingEdu(true)
    try {
      if (editEduId) await portalApi.put(`/me/education/${editEduId}`, eduForm)
      else           await portalApi.post('/me/education', eduForm)
      setEduForm({ qualification:'',degree:'',specialization:'',institute:'',university:'',passing_year:'',percentage:'',cgpa:'' })
      setEditEduId(null); loadEducations(); refreshCompletion(); showToast('Education saved!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
    finally { setSavingEdu(false) }
  }

  async function deleteEdu(id: string) {
    if (!confirm('Delete this education entry?')) return
    await portalApi.delete(`/me/education/${id}`)
    loadEducations(); refreshCompletion(); showToast('Education deleted')
  }

  // ── Experience ────────────────────────────────────────────
  const [experiences, setExperiences] = useState<any[]>([])
  const [expForm, setExpForm]         = useState<any>({ company_name:'', designation:'', joining_date:'', relieving_date:'', is_current:0, roles_responsibilities:'' })
  const [editExpId, setEditExpId]     = useState<string|null>(null)
  const [savingExp, setSavingExp]     = useState(false)

  const loadExperiences = useCallback(() => {
    portalApi.get('/me/experience').then(r => setExperiences(r.data.data)).catch(() => {})
  }, [])
  useEffect(() => { loadExperiences() }, [loadExperiences])

  async function saveExperience(e: React.FormEvent) {
    e.preventDefault(); setSavingExp(true)
    try {
      if (editExpId) await portalApi.put(`/me/experience/${editExpId}`, expForm)
      else           await portalApi.post('/me/experience', expForm)
      setExpForm({ company_name:'',designation:'',joining_date:'',relieving_date:'',is_current:0,roles_responsibilities:'' })
      setEditExpId(null); loadExperiences(); refreshCompletion(); showToast('Experience saved!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
    finally { setSavingExp(false) }
  }

  async function deleteExp(id: string) {
    if (!confirm('Delete this experience entry?')) return
    await portalApi.delete(`/me/experience/${id}`)
    loadExperiences(); refreshCompletion(); showToast('Experience deleted')
  }

  // ── Skills ────────────────────────────────────────────────
  const [skills, setSkills]         = useState<any[]>([])
  const [skillForm, setSkillForm]   = useState<any>({ skill_name:'', experience_years:'', skill_level:'intermediate' })
  const [editSkillId, setEditSkillId] = useState<string|null>(null)
  const [savingSkill, setSavingSkill] = useState(false)

  const loadSkills = useCallback(() => {
    portalApi.get('/me/skills').then(r => setSkills(r.data.data)).catch(() => {})
  }, [])
  useEffect(() => { loadSkills() }, [loadSkills])

  async function saveSkill(e: React.FormEvent) {
    e.preventDefault(); setSavingSkill(true)
    try {
      if (editSkillId) await portalApi.put(`/me/skills/${editSkillId}`, skillForm)
      else             await portalApi.post('/me/skills', skillForm)
      setSkillForm({ skill_name:'', experience_years:'', skill_level:'intermediate' })
      setEditSkillId(null); loadSkills(); refreshCompletion(); showToast('Skill saved!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
    finally { setSavingSkill(false) }
  }

  // ── Certifications ────────────────────────────────────────
  const [certs, setCerts]         = useState<any[]>([])
  const [certForm, setCertForm]   = useState<any>({ certification_name:'', issuing_organization:'', issue_date:'', expiry_date:'', certificate_url:'' })
  const [editCertId, setEditCertId] = useState<string|null>(null)
  const [savingCert, setSavingCert] = useState(false)

  const loadCerts = useCallback(() => {
    portalApi.get('/me/certifications').then(r => setCerts(r.data.data)).catch(() => {})
  }, [])
  useEffect(() => { loadCerts() }, [loadCerts])

  async function saveCert(e: React.FormEvent) {
    e.preventDefault(); setSavingCert(true)
    try {
      if (editCertId) await portalApi.put(`/me/certifications/${editCertId}`, certForm)
      else            await portalApi.post('/me/certifications', certForm)
      setCertForm({ certification_name:'',issuing_organization:'',issue_date:'',expiry_date:'',certificate_url:'' })
      setEditCertId(null); loadCerts(); showToast('Certification saved!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
    finally { setSavingCert(false) }
  }

  // ── Languages ─────────────────────────────────────────────
  const [languages, setLanguages]   = useState<any[]>([])
  const [langForm, setLangForm]     = useState<any>({ language:'', can_read:1, can_write:1, can_speak:1, proficiency:'conversational' })
  const [savingLang, setSavingLang] = useState(false)

  const loadLangs = useCallback(() => {
    portalApi.get('/me/languages').then(r => setLanguages(r.data.data)).catch(() => {})
  }, [])
  useEffect(() => { loadLangs() }, [loadLangs])

  async function saveLang(e: React.FormEvent) {
    e.preventDefault(); setSavingLang(true)
    try {
      await portalApi.post('/me/languages', langForm)
      setLangForm({ language:'',can_read:1,can_write:1,can_speak:1,proficiency:'conversational' })
      loadLangs(); showToast('Language added!')
    } catch (err: any) { showToast(err?.response?.data?.message ?? 'Failed', 'error') }
    finally { setSavingLang(false) }
  }

  function handleLogout() { logout(); navigate('/portal/login') }
  const fmtDate = (d?: string) => d ? d.split('T')[0] : ''
  const completionColor = completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-400' : 'bg-indigo-500'

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

      {/* ── Top Nav ────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Book My Interview</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/portal/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              <Home className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <Link to="/portal/jobs"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              <Briefcase className="h-3.5 w-3.5" /> Jobs
            </Link>
            <Link to="/portal/applications"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
              <FileText className="h-3.5 w-3.5" /> Applications
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-7 space-y-5">

        {/* ── Hero Card ──────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-40" />

          <div className="relative px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Photo upload circle */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
                  {uploadingPhoto ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-white/70" />
                  )}
                </div>
                <button onClick={() => photoInputRef.current?.click()} title="Upload Photo"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-indigo-50 transition-colors border border-gray-200">
                  <Camera className="h-4 w-4 text-indigo-600" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Name + info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {personal.full_name || 'Your Name'}
                  {personal.last_name ? ` ${personal.last_name}` : ''}
                </h1>
                {personal.current_designation && (
                  <p className="text-indigo-200 text-sm mt-0.5 font-medium">{personal.current_designation}
                    {personal.current_company ? ` · ${personal.current_company}` : ''}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 justify-center sm:justify-start">
                  {personal.current_location && (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-200">
                      <MapPin className="h-3.5 w-3.5" /> {personal.current_location}
                    </span>
                  )}
                  {personal.email && (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-200">
                      <Mail className="h-3.5 w-3.5" /> {personal.email}
                    </span>
                  )}
                  {personal.mobile && (
                    <span className="flex items-center gap-1.5 text-xs text-indigo-200">
                      <Phone className="h-3.5 w-3.5" /> {personal.mobile}
                    </span>
                  )}
                  {personal.linkedin_url && (
                    <a href={personal.linkedin_url} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors">
                      <Link2 className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
                {/* Quick stats */}
                <div className="flex gap-5 mt-4 justify-center sm:justify-start">
                  {[
                    { label: 'Skills', value: skills.length },
                    { label: 'Education', value: educations.length },
                    { label: 'Experience', value: experiences.length },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-xl font-bold text-white">{s.value}</div>
                      <div className="text-[10px] text-indigo-300 uppercase tracking-wide">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion ring */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <CompletionRing pct={completion} />
                <span className="text-xs text-indigo-200">Profile strength</span>
              </div>
            </div>

            {/* Completion bar */}
            <div className="mt-5 space-y-1">
              <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${completionColor}`}
                  style={{ width: `${completion}%` }} />
              </div>
              {completion === 100 && (
                <p className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Profile is 100% complete — you're all set!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column quick actions ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Resume upload card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <FileText style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-[15px]">Resume / CV</p>
                <p className="text-xs text-gray-400">PDF, DOC or DOCX — max 10 MB</p>
              </div>
            </div>

            {resumeUrl ? (
              <div className="flex items-center gap-3 mb-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                <FileText className="h-5 w-5 text-violet-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{resumeFileName || 'Resume uploaded'}</p>
                  <a href={resumeUrl} target="_blank" rel="noopener" className="text-xs text-violet-600 hover:underline">View file</a>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            ) : (
              <div onClick={() => resumeInputRef.current?.click()}
                className="mb-3 border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all group">
                <Upload className="h-7 w-7 text-gray-300 group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm text-gray-500 group-hover:text-violet-600">Click to upload your resume</p>
              </div>
            )}

            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-60">
                {uploadingResume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {resumeUrl ? 'Replace' : 'Upload'}
              </button>

              {parseStep === 'ready' && (
                <button onClick={parseResumeWithAI} disabled={parsingAI}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-60">
                  {parsingAI
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Parsing with AI…</>
                    : <><Zap className="h-3.5 w-3.5" />Auto-fill with AI</>}
                </button>
              )}
              {parseStep === 'done' && (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> AI parsed!
                </span>
              )}
              {parseStep === 'parsing' && (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading your resume…
                </span>
              )}
            </div>
          </div>

          {/* Voice / Video intro card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Mic style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-[15px]">Introduction Recording</p>
                <p className="text-xs text-gray-400">Max 60 seconds · Voice or Video</p>
              </div>
            </div>

            {/* Existing recording player */}
            {mediaUrl && !recordedUrl && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-2 font-medium">Saved introduction</p>
                {mediaUrl.includes('video') ? (
                  <video src={mediaUrl} controls className="w-full rounded-lg max-h-28" />
                ) : (
                  <audio src={mediaUrl} controls className="w-full" />
                )}
              </div>
            )}

            {/* Mode toggle */}
            {!recording && !recordedUrl && (
              <div className="flex gap-2 mb-3">
                {(['audio', 'video'] as const).map(m => (
                  <button key={m} onClick={() => setRecordMode(m)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all
                      ${recordMode === m ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
                    {m === 'audio' ? <Mic className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                    {m === 'audio' ? 'Voice' : 'Video'}
                  </button>
                ))}
              </div>
            )}

            {/* Live video preview */}
            {recording && recordMode === 'video' && (
              <div className="mb-3 rounded-xl overflow-hidden bg-black aspect-video relative">
                <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  REC {60 - recordingTime}s
                </div>
              </div>
            )}
            {recording && recordMode === 'audio' && (
              <div className="mb-3 flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-rose-500 rounded-full animate-pulse"
                      style={{ height: 8 + Math.random() * 16, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span className="text-sm text-rose-700 font-medium">Recording… {60 - recordingTime}s left</span>
              </div>
            )}

            {/* Playback */}
            {recordedUrl && !recording && (
              <div className="mb-3">
                {recordMode === 'video' ? (
                  <video src={recordedUrl} controls className="w-full rounded-xl max-h-32 bg-black" />
                ) : (
                  <audio src={recordedUrl} controls className="w-full" />
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
              {!recording && !recordedUrl && (
                <button onClick={startRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors shadow-md">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  Start Recording
                </button>
              )}
              {recording && (
                <button onClick={stopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 transition-colors shadow-md">
                  <Square className="h-3.5 w-3.5 fill-white" /> Stop
                </button>
              )}
              {recordedUrl && !recording && (
                <>
                  <button onClick={uploadMedia} disabled={uploadingMedia}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-60">
                    {uploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingMedia ? 'Uploading…' : 'Save Introduction'}
                  </button>
                  <button onClick={discardRecording}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <RotateCcw className="h-3.5 w-3.5" /> Re-record
                  </button>
                </>
              )}
              {mediaUrl && !recordedUrl && !recording && (
                <button onClick={() => { setRecordedUrl(''); setMediaUrl('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" /> Re-record
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── PERSONAL INFORMATION ─────────────────────────── */}
        <Section title="Personal Information" icon={User} defaultOpen={true} accent="indigo">
          <form onSubmit={savePersonal} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="First Name" value={personal.full_name} onChange={(v: string) => setPersonal({...personal, full_name: v})} required placeholder="First name" />
              <Input label="Middle Name" value={personal.middle_name} onChange={(v: string) => setPersonal({...personal, middle_name: v})} placeholder="Middle name" />
              <Input label="Last Name" value={personal.last_name} onChange={(v: string) => setPersonal({...personal, last_name: v})} placeholder="Last name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Gender" value={personal.gender} onChange={(v: string) => setPersonal({...personal, gender: v})}
                options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'},{value:'prefer_not_to_say',label:'Prefer not to say'}]} />
              <Input label="Date of Birth" type="date" value={fmtDate(personal.date_of_birth)} onChange={(v: string) => setPersonal({...personal, date_of_birth: v})} />
              <Select label="Marital Status" value={personal.marital_status} onChange={(v: string) => setPersonal({...personal, marital_status: v})}
                options={[{value:'single',label:'Single'},{value:'married',label:'Married'},{value:'divorced',label:'Divorced'},{value:'widowed',label:'Widowed'},{value:'prefer_not_to_say',label:'Prefer not to say'}]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nationality" value={personal.nationality} onChange={(v: string) => setPersonal({...personal, nationality: v})} placeholder="e.g. Indian" />
              <Select label="Category" value={personal.category} onChange={(v: string) => setPersonal({...personal, category: v})}
                options={[{value:'general',label:'General'},{value:'obc',label:'OBC'},{value:'sc',label:'SC'},{value:'st',label:'ST'},{value:'ews',label:'EWS'}]} />
            </div>
            <SaveBtn loading={savingP} saved={savedP} />
          </form>
        </Section>

        {/* ── CONTACT & LINKS ───────────────────────────────── */}
        <Section title="Contact & Social Links" icon={Phone} defaultOpen={false} accent="sky">
          <form onSubmit={savePersonal} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Mobile Number" value={personal.mobile} onChange={(v: string) => setPersonal({...personal, mobile: v})} placeholder="+91 9876543210" />
              <Input label="Alternate Mobile" value={personal.alternate_mobile} onChange={(v: string) => setPersonal({...personal, alternate_mobile: v})} placeholder="+91 9876543210" />
              <Input label="Email Address" type="email" value={personal.email} onChange={() => {}} placeholder="your@email.com" readOnly />
              <Input label="Alternate Email" type="email" value={personal.alternate_email} onChange={(v: string) => setPersonal({...personal, alternate_email: v})} placeholder="alt@email.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="LinkedIn URL" value={personal.linkedin_url} onChange={(v: string) => setPersonal({...personal, linkedin_url: v})} placeholder="https://linkedin.com/in/..." />
              <Input label="GitHub URL" value={personal.github_url} onChange={(v: string) => setPersonal({...personal, github_url: v})} placeholder="https://github.com/..." />
              <Input label="Portfolio URL" value={personal.portfolio_url} onChange={(v: string) => setPersonal({...personal, portfolio_url: v})} placeholder="https://yoursite.com" />
            </div>
            <SaveBtn loading={savingP} saved={savedP} />
          </form>
        </Section>

        {/* ── ADDRESS ───────────────────────────────────────── */}
        <Section title="Address" icon={MapPin} defaultOpen={false} accent="emerald">
          <form onSubmit={savePersonal} className="mt-5 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Address Line 1" value={personal.current_address_line1} onChange={(v: string) => setPersonal({...personal, current_address_line1: v})} placeholder="Street, Building" className="sm:col-span-2" />
              <Input label="Address Line 2" value={personal.current_address_line2} onChange={(v: string) => setPersonal({...personal, current_address_line2: v})} placeholder="Area, Landmark" className="sm:col-span-2" />
              <Input label="City" value={personal.current_city} onChange={(v: string) => setPersonal({...personal, current_city: v})} placeholder="City" />
              <Input label="State" value={personal.current_state} onChange={(v: string) => setPersonal({...personal, current_state: v})} placeholder="State" />
              <Input label="Country" value={personal.current_country} onChange={(v: string) => setPersonal({...personal, current_country: v})} placeholder="India" />
              <Input label="Pincode" value={personal.current_pincode} onChange={(v: string) => setPersonal({...personal, current_pincode: v})} placeholder="400001" />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer mt-2 select-none">
              <input type="checkbox" checked={!!personal.permanent_same_as_current}
                onChange={e => setPersonal({...personal, permanent_same_as_current: e.target.checked ? 1 : 0})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="font-medium">Permanent address is same as current</span>
            </label>
            {!personal.permanent_same_as_current && (
              <>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">Permanent Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Address Line 1" value={personal.permanent_address_line1} onChange={(v: string) => setPersonal({...personal, permanent_address_line1: v})} placeholder="Street, Building" className="sm:col-span-2" />
                  <Input label="City" value={personal.permanent_city} onChange={(v: string) => setPersonal({...personal, permanent_city: v})} placeholder="City" />
                  <Input label="State" value={personal.permanent_state} onChange={(v: string) => setPersonal({...personal, permanent_state: v})} placeholder="State" />
                  <Input label="Country" value={personal.permanent_country} onChange={(v: string) => setPersonal({...personal, permanent_country: v})} placeholder="India" />
                  <Input label="Pincode" value={personal.permanent_pincode} onChange={(v: string) => setPersonal({...personal, permanent_pincode: v})} placeholder="400001" />
                </div>
              </>
            )}
            <SaveBtn loading={savingP} saved={savedP} />
          </form>
        </Section>

        {/* ── PROFESSIONAL DETAILS ──────────────────────────── */}
        <Section title="Professional Details" icon={Briefcase} defaultOpen={false} accent="amber">
          <form onSubmit={savePersonal} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Total Experience (years)" type="number" value={personal.total_experience_years} onChange={(v: string) => setPersonal({...personal, total_experience_years: v})} placeholder="5" />
              <Input label="Relevant Experience (years)" type="number" value={personal.relevant_experience_years} onChange={(v: string) => setPersonal({...personal, relevant_experience_years: v})} placeholder="3" />
              <Input label="Notice Period (days)" type="number" value={personal.notice_period_days} onChange={(v: string) => setPersonal({...personal, notice_period_days: v})} placeholder="30" />
              <Input label="Current Company" value={personal.current_company} onChange={(v: string) => setPersonal({...personal, current_company: v})} placeholder="Company Name" />
              <Input label="Current Designation" value={personal.current_designation} onChange={(v: string) => setPersonal({...personal, current_designation: v})} placeholder="Software Engineer" />
              <Input label="Current Location" value={personal.current_location} onChange={(v: string) => setPersonal({...personal, current_location: v})} placeholder="Mumbai, Maharashtra" />
              <Input label="Current CTC (₹ LPA)" type="number" value={personal.current_ctc} onChange={(v: string) => setPersonal({...personal, current_ctc: v})} placeholder="10" />
              <Input label="Expected CTC (₹ LPA)" type="number" value={personal.expected_ctc} onChange={(v: string) => setPersonal({...personal, expected_ctc: v})} placeholder="14" />
              <Input label="Preferred Location" value={personal.preferred_location} onChange={(v: string) => setPersonal({...personal, preferred_location: v})} placeholder="Bangalore, Pune" />
            </div>
            <Select label="Work Preference" value={personal.work_preference} onChange={(v: string) => setPersonal({...personal, work_preference: v})}
              options={[{value:'remote',label:'Remote'},{value:'hybrid',label:'Hybrid'},{value:'onsite',label:'On-site'},{value:'any',label:'Any'}]} className="sm:w-64" />
            <SaveBtn loading={savingP} saved={savedP} />
          </form>
        </Section>

        {/* ── INTRODUCTION ──────────────────────────────────── */}
        <Section title="Professional Introduction" icon={Edit3} defaultOpen={false} accent="violet">
          <form onSubmit={savePersonal} className="mt-5 space-y-4">
            <Textarea label="Professional Summary" value={personal.professional_summary} onChange={(v: string) => setPersonal({...personal, professional_summary: v})} rows={3}
              placeholder="Summarize your professional background, key strengths and what you bring to the table…" />
            <Textarea label="About Me" value={personal.about_me} onChange={(v: string) => setPersonal({...personal, about_me: v})} rows={3}
              placeholder="Share something personal — your passions, values, and what drives you…" />
            <Textarea label="Career Objective" value={personal.career_objective} onChange={(v: string) => setPersonal({...personal, career_objective: v})} rows={3}
              placeholder="What kind of role are you looking for? What do you aspire to achieve?" />
            <SaveBtn loading={savingP} saved={savedP} />
          </form>
        </Section>

        {/* ── EDUCATION ─────────────────────────────────────── */}
        <Section title="Education" icon={GraduationCap} defaultOpen={false} accent="indigo">
          <div className="mt-5 space-y-3">
            {educations.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">No education added yet</div>
            )}
            {educations.map(edu => (
              <div key={edu.id} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{edu.degree}{edu.specialization ? ` — ${edu.specialization}` : ''}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{edu.institute}{edu.university ? ` · ${edu.university}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {edu.qualification && <span className="mr-2">{edu.qualification}</span>}
                      {edu.passing_year && <span className="mr-2">Class of {edu.passing_year}</span>}
                      {edu.percentage  && <span className="mr-2">{edu.percentage}%</span>}
                      {edu.cgpa        && <span>{edu.cgpa} CGPA</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEduForm({...edu}); setEditEduId(edu.id) }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteEdu(edu.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <form onSubmit={saveEducation} className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-indigo-50/60 to-white">
              <p className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> {editEduId ? 'Edit' : 'Add'} Education
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Qualification*" value={eduForm.qualification} onChange={(v: string) => setEduForm({...eduForm, qualification: v})} placeholder="e.g. Graduate, Post Graduate" required />
                <Input label="Degree*" value={eduForm.degree} onChange={(v: string) => setEduForm({...eduForm, degree: v})} placeholder="e.g. B.Tech, MBA" required />
                <Input label="Specialization" value={eduForm.specialization} onChange={(v: string) => setEduForm({...eduForm, specialization: v})} placeholder="e.g. Computer Science" />
                <Input label="Institute*" value={eduForm.institute} onChange={(v: string) => setEduForm({...eduForm, institute: v})} placeholder="College Name" required />
                <Input label="University" value={eduForm.university} onChange={(v: string) => setEduForm({...eduForm, university: v})} placeholder="University Name" />
                <Input label="Passing Year" type="number" value={eduForm.passing_year} onChange={(v: string) => setEduForm({...eduForm, passing_year: v})} placeholder="2022" />
                <Input label="Percentage (%)" type="number" value={eduForm.percentage} onChange={(v: string) => setEduForm({...eduForm, percentage: v})} placeholder="75.5" />
                <Input label="CGPA" type="number" value={eduForm.cgpa} onChange={(v: string) => setEduForm({...eduForm, cgpa: v})} placeholder="8.2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingEdu}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5 font-medium">
                  {savingEdu ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {editEduId ? 'Update' : 'Add Education'}
                </button>
                {editEduId && (
                  <button type="button" onClick={() => { setEditEduId(null); setEduForm({ qualification:'',degree:'',specialization:'',institute:'',university:'',passing_year:'',percentage:'',cgpa:'' }) }}
                    className="px-4 py-2 bg-white border border-gray-200 text-sm rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                )}
              </div>
            </form>
          </div>
        </Section>

        {/* ── EXPERIENCE ────────────────────────────────────── */}
        <Section title="Employment History" icon={Briefcase} defaultOpen={false} accent="emerald">
          <div className="mt-5 space-y-3">
            {experiences.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">No experience added yet</div>
            )}
            {experiences.map(exp => (
              <div key={exp.id} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{exp.designation}</p>
                      {exp.is_current ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Current</span> : null}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{exp.company_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(exp.joining_date)} — {exp.is_current ? 'Present' : (fmtDate(exp.relieving_date) || '—')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setExpForm({...exp, joining_date: fmtDate(exp.joining_date), relieving_date: fmtDate(exp.relieving_date) }); setEditExpId(exp.id) }}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteExp(exp.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <form onSubmit={saveExperience} className="border border-emerald-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-emerald-50/60 to-white">
              <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> {editExpId ? 'Edit' : 'Add'} Experience
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Company Name*" value={expForm.company_name} onChange={(v: string) => setExpForm({...expForm, company_name: v})} required placeholder="Company Name" />
                <Input label="Designation*" value={expForm.designation} onChange={(v: string) => setExpForm({...expForm, designation: v})} required placeholder="Software Engineer" />
                <Input label="Joining Date*" type="date" value={expForm.joining_date} onChange={(v: string) => setExpForm({...expForm, joining_date: v})} required />
                {!expForm.is_current && (
                  <Input label="Relieving Date" type="date" value={expForm.relieving_date} onChange={(v: string) => setExpForm({...expForm, relieving_date: v})} />
                )}
              </div>
              <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                <input type="checkbox" checked={!!expForm.is_current} onChange={e => setExpForm({...expForm, is_current: e.target.checked ? 1 : 0})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="font-medium">Currently working here</span>
              </label>
              <Textarea label="Roles & Responsibilities" value={expForm.roles_responsibilities} onChange={(v: string) => setExpForm({...expForm, roles_responsibilities: v})}
                rows={3} placeholder="Key responsibilities and achievements…" maxLength={2000} />
              <div className="flex gap-2">
                <button type="submit" disabled={savingExp}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5 font-medium">
                  {savingExp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {editExpId ? 'Update' : 'Add Experience'}
                </button>
                {editExpId && (
                  <button type="button" onClick={() => { setEditExpId(null); setExpForm({ company_name:'',designation:'',joining_date:'',relieving_date:'',is_current:0,roles_responsibilities:'' }) }}
                    className="px-4 py-2 bg-white border border-gray-200 text-sm rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                )}
              </div>
            </form>
          </div>
        </Section>

        {/* ── SKILLS ────────────────────────────────────────── */}
        <Section title="Skills" icon={Star} defaultOpen={false} accent="violet">
          <div className="mt-5 space-y-4">
            {skills.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">No skills added yet</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map(sk => (
                  <div key={sk.id}
                    className="flex items-center gap-2 bg-white border border-violet-200 rounded-full px-3.5 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-sm font-semibold text-gray-800">{sk.skill_name}</span>
                    {sk.experience_years && (
                      <span className="text-xs text-gray-400">{sk.experience_years}y</span>
                    )}
                    <LevelBadge level={sk.skill_level} />
                    <button onClick={async () => { await portalApi.delete(`/me/skills/${sk.id}`); loadSkills(); refreshCompletion() }}
                      className="text-gray-300 hover:text-red-500 transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={saveSkill} className="border border-violet-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-violet-50/60 to-white">
              <p className="text-sm font-semibold text-violet-700 flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Skill</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Skill Name*" value={skillForm.skill_name} onChange={(v: string) => setSkillForm({...skillForm, skill_name: v})} required placeholder="e.g. React.js" />
                <Input label="Experience (years)" type="number" value={skillForm.experience_years} onChange={(v: string) => setSkillForm({...skillForm, experience_years: v})} placeholder="2" />
                <Select label="Level" value={skillForm.skill_level} onChange={(v: string) => setSkillForm({...skillForm, skill_level: v})}
                  options={[{value:'beginner',label:'Beginner'},{value:'intermediate',label:'Intermediate'},{value:'advanced',label:'Advanced'},{value:'expert',label:'Expert'}]} />
              </div>
              <button type="submit" disabled={savingSkill}
                className="px-4 py-2 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5 font-medium">
                {savingSkill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Skill
              </button>
            </form>
          </div>
        </Section>

        {/* ── CERTIFICATIONS ────────────────────────────────── */}
        <Section title="Certifications & Courses" icon={Award} defaultOpen={false} accent="amber">
          <div className="mt-5 space-y-3">
            {certs.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">No certifications added yet</div>
            )}
            {certs.map(cert => (
              <div key={cert.id} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cert.certification_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{cert.issuing_organization}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(cert.issue_date)}{cert.expiry_date ? ` — ${fmtDate(cert.expiry_date)}` : ''}
                    </p>
                    {cert.certificate_url && (
                      <a href={cert.certificate_url} target="_blank" rel="noopener" className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3" /> View Certificate
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setCertForm({...cert}); setEditCertId(cert.id) }}
                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={async () => { await portalApi.delete(`/me/certifications/${cert.id}`); loadCerts() }}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <form onSubmit={saveCert} className="border border-amber-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-amber-50/60 to-white">
              <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><Plus className="h-4 w-4" /> {editCertId ? 'Edit' : 'Add'} Certification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Certification Name*" value={certForm.certification_name} onChange={(v: string) => setCertForm({...certForm, certification_name: v})} required placeholder="AWS Solutions Architect" />
                <Input label="Issuing Organization*" value={certForm.issuing_organization} onChange={(v: string) => setCertForm({...certForm, issuing_organization: v})} required placeholder="Amazon Web Services" />
                <Input label="Issue Date" type="date" value={fmtDate(certForm.issue_date)} onChange={(v: string) => setCertForm({...certForm, issue_date: v})} />
                <Input label="Expiry Date" type="date" value={fmtDate(certForm.expiry_date)} onChange={(v: string) => setCertForm({...certForm, expiry_date: v})} />
                <Input label="Certificate URL" value={certForm.certificate_url} onChange={(v: string) => setCertForm({...certForm, certificate_url: v})} placeholder="https://..." className="sm:col-span-2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingCert}
                  className="px-4 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 disabled:opacity-60 flex items-center gap-1.5 font-medium">
                  {savingCert ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {editCertId ? 'Update' : 'Add Certification'}
                </button>
                {editCertId && (
                  <button type="button" onClick={() => { setEditCertId(null); setCertForm({ certification_name:'',issuing_organization:'',issue_date:'',expiry_date:'',certificate_url:'' }) }}
                    className="px-4 py-2 bg-white border border-gray-200 text-sm rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                )}
              </div>
            </form>
          </div>
        </Section>

        {/* ── LANGUAGES ─────────────────────────────────────── */}
        <Section title="Languages" icon={Languages} defaultOpen={false} accent="sky">
          <div className="mt-5 space-y-3">
            {languages.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">No languages added yet</div>
            )}
            {languages.map(lang => (
              <div key={lang.id} className="flex items-center justify-between p-4 rounded-xl bg-sky-50/60 border border-sky-100">
                <div className="flex items-center gap-5">
                  <span className="font-semibold text-gray-900 text-sm min-w-24">{lang.language}</span>
                  <div className="flex gap-3">
                    {[{k:'can_read',l:'Read'},{k:'can_write',l:'Write'},{k:'can_speak',l:'Speak'}].map(({k,l}) => (
                      <span key={k} className={`text-xs px-2 py-0.5 rounded-full font-medium ${lang[k] ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-400'}`}>{l}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 capitalize font-medium">{lang.proficiency}</span>
                </div>
                <button onClick={async () => { await portalApi.delete(`/me/languages/${lang.id}`); loadLangs() }}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <form onSubmit={saveLang} className="border border-sky-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-sky-50/60 to-white">
              <p className="text-sm font-semibold text-sky-700 flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Language</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Language*" value={langForm.language} onChange={(v: string) => setLangForm({...langForm, language: v})} required placeholder="e.g. English" />
                <Select label="Proficiency" value={langForm.proficiency} onChange={(v: string) => setLangForm({...langForm, proficiency: v})}
                  options={[{value:'basic',label:'Basic'},{value:'conversational',label:'Conversational'},{value:'proficient',label:'Proficient'},{value:'fluent',label:'Fluent'},{value:'native',label:'Native'}]} />
              </div>
              <div className="flex gap-4 flex-wrap">
                {[{k:'can_read',l:'Can Read'},{k:'can_write',l:'Can Write'},{k:'can_speak',l:'Can Speak'}].map(({k,l}) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" checked={!!langForm[k]} onChange={e => setLangForm({...langForm, [k]: e.target.checked ? 1 : 0})}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    <span className="font-medium">{l}</span>
                  </label>
                ))}
              </div>
              <button type="submit" disabled={savingLang}
                className="px-4 py-2 bg-sky-600 text-white text-sm rounded-xl hover:bg-sky-700 disabled:opacity-60 flex items-center gap-1.5 font-medium">
                {savingLang ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Language
              </button>
            </form>
          </div>
        </Section>

        {/* Bottom spacer */}
        <div className="h-8" />
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
