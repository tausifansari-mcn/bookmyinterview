import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import {
  Sparkles, Search, MapPin, Briefcase, Clock, BadgeIndianRupee,
  LogOut, User, FileText, Loader2, Home, X, Mic, Video,
  Upload, CheckCircle, AlertCircle,
} from 'lucide-react'

const authHdr = () => ({ Authorization: 'Bearer ' + (localStorage.getItem('bmi_candidate_token') ?? '') })

export default function PortalJobsPage() {
  const { candidate, logout, updateCandidate } = useCandidateAuth()
  const navigate = useNavigate()
  const [jobs, setJobs]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [workMode, setWorkMode] = useState('')
  const [message, setMessage]   = useState<{text: string; type: 'success'|'error'} | null>(null)

  // Apply modal
  const [applyJob, setApplyJob]         = useState<any | null>(null)
  const [profile, setProfile]           = useState<any | null>(null)
  const [coverLetter, setCoverLetter]   = useState('')
  const [answers, setAnswers]           = useState<Record<string, string>>({})
  const [submitting, setSubmitting]     = useState(false)

  // Video recording in modal
  const [recordMode, setRecordMode]     = useState<'audio'|'video'>('audio')
  const [recording, setRecording]       = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl]   = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [introUrl, setIntroUrl]         = useState('')
  const [uploadFile, setUploadFile]     = useState<File | null>(null)
  const mediaRecorderRef                = useRef<MediaRecorder | null>(null)
  const chunksRef                       = useRef<Blob[]>([])
  const timerRef                        = useRef<ReturnType<typeof setInterval>>()
  const liveVideoRef                    = useRef<HTMLVideoElement>(null)
  const streamRef                       = useRef<MediaStream | null>(null)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  async function fetchJobs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.set('search', search)
      if (workMode) params.set('work_mode', workMode)
      const { data } = await portalApi.get(`/jobs?${params}`)
      setJobs(data.data.jobs)
    } catch {
      setMessage({ text: 'Failed to load jobs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [workMode])

  function handleLogout() { logout(); navigate('/portal/login') }

  const formatSalary = (min: number, max: number) => {
    const fmt = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(0)}L` : `₹${(n/1000).toFixed(0)}K`
    if (!min && !max) return null
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `${fmt(min)}+`
    return fmt(max)
  }

  const workModeLabel: Record<string, string> = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
  const jobTypeLabel:  Record<string, string>  = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship' }

  // ─── Open apply modal, pre-load profile ─────────────────
  async function openApplyModal(job: any) {
    if (!candidate) { navigate('/portal/login'); return }
    setApplyJob(job)
    setCoverLetter('')
    setAnswers({})
    setRecordedBlob(null); setRecordedUrl(''); setIntroUrl(''); setUploadFile(null)
    setProfile(null)
    try {
      const { data } = await portalApi.get('/me')
      setProfile(data.data)
    } catch {}
  }

  function closeModal() {
    setApplyJob(null)
    stopRecording()
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(''); setRecordedBlob(null)
  }

  async function handleApply() {
    if (!applyJob) return
    setSubmitting(true)
    setMessage(null)
    try {
      // Upload intro media if recorded or file selected
      let mediaUrl = introUrl
      if (recordedBlob && !mediaUrl) {
        mediaUrl = await uploadIntro(recordedBlob)
      } else if (uploadFile && !mediaUrl) {
        mediaUrl = await uploadIntro(uploadFile)
      }

      const payload: any = {}
      if (Object.keys(answers).length > 0) {
        payload.answers = Object.entries(answers).map(([question_id, answer_text]) => ({ question_id, answer_text }))
      }

      const { data } = await portalApi.post(`/jobs/${applyJob.id}/apply`, payload)
      setMessage({ text: data.message, type: 'success' })
      closeModal()
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.message ?? 'Failed to apply', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function uploadIntro(blob: Blob | File): Promise<string> {
    setUploadingMedia(true)
    try {
      const fd = new FormData()
      fd.append('media', blob, blob instanceof File ? blob.name : `intro.webm`)
      fd.append('duration', String(recordingTime))
      const { data } = await axios.post('/api/v1/upload/media', fd, { headers: authHdr() })
      setIntroUrl(data.data.url)
      if (candidate && data.data.url) {
        updateCandidate({ profile_photo_url: candidate.profile_photo_url })
      }
      return data.data.url
    } finally {
      setUploadingMedia(false)
    }
  }

  // ─── Recording ───────────────────────────────────────────
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
      let msg = 'Could not start recording. Please check your device.'
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') msg = 'Camera/microphone access denied. Please allow permissions in your browser.'
      else if (name === 'NotFoundError') msg = 'No camera/microphone found. Please check your device.'
      else if (name === 'NotSupportedError') msg = 'Recording not supported. Please try Chrome or Firefox.'
      setMessage({ text: msg, type: 'error' })
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploadFile(f)
    setRecordedBlob(null); setRecordedUrl('')
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Book My Interview</span>
          </div>
          <div className="flex items-center gap-3">
            {candidate ? (
              <>
                <Link to="/portal/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                  <Home className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/portal/applications" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                  <FileText className="h-4 w-4" /> My Applications
                </Link>
                <Link to="/portal/profile" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {candidate.profile_photo_url ? (
                    <img src={candidate.profile_photo_url} alt={candidate.full_name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                  )}
                  <span className="hidden sm:inline">{candidate.full_name}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 p-1" title="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/portal/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400">Login</Link>
                <Link to="/portal/register" className="text-sm bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Opportunity</h1>
          <p className="text-gray-500">AI-powered job matching — discover roles that fit your profile</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchJobs()}
                placeholder="Search job title or skills..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <select value={workMode} onChange={e => setWorkMode(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="">All modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <button onClick={fetchJobs}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >Search</button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => {
              const salary = formatSalary(job.salary_min, job.salary_max)
              const skills: string[] = typeof job.skills_required === 'string'
                ? JSON.parse(job.skills_required) : job.skills_required ?? []
              return (
                <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                        {job.priority === 'urgent' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Urgent</span>
                        )}
                      </div>
                      {job.department_name && <p className="text-sm text-gray-500 mb-2">{job.department_name}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        {job.location_city && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location_city}{job.location_state ? `, ${job.location_state}` : ''}</span>
                        )}
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{jobTypeLabel[job.job_type] ?? job.job_type}</span>
                        <span className="flex items-center gap-1">
                          <span className={`inline-block h-2 w-2 rounded-full ${job.work_mode === 'remote' ? 'bg-green-500' : job.work_mode === 'hybrid' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                          {workModeLabel[job.work_mode] ?? job.work_mode}
                        </span>
                        {(job.experience_min_years || job.experience_max_years) && (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                            {job.experience_min_years}–{job.experience_max_years ?? '+'} yrs
                          </span>
                        )}
                        {salary && (
                          <span className="flex items-center gap-1"><BadgeIndianRupee className="h-3.5 w-3.5" />{salary} /yr</span>
                        )}
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 6).map(s => (
                            <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                          {skills.length > 6 && <span className="text-xs text-gray-400">+{skills.length - 6} more</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openApplyModal(job)}
                      className="flex-shrink-0 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Apply Modal ───────────────────────────────────── */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-900">Apply for Position</h2>
                <p className="text-sm text-gray-500 mt-0.5">{applyJob.title}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-md hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Auto-filled profile summary */}
              {profile ? (
                <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Your Profile (Auto-filled)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500 text-xs">Name</span><p className="font-medium">{profile.full_name}</p></div>
                    <div><span className="text-gray-500 text-xs">Email</span><p className="font-medium truncate">{profile.email}</p></div>
                    {profile.mobile && <div><span className="text-gray-500 text-xs">Mobile</span><p className="font-medium">{profile.mobile}</p></div>}
                    {profile.current_designation && <div><span className="text-gray-500 text-xs">Current Role</span><p className="font-medium">{profile.current_designation}</p></div>}
                    {(profile.experience_years || profile.total_experience_years) && (
                      <div><span className="text-gray-500 text-xs">Experience</span><p className="font-medium">{profile.total_experience_years ?? profile.experience_years} yrs</p></div>
                    )}
                    {profile.current_location && <div><span className="text-gray-500 text-xs">Location</span><p className="font-medium">{profile.current_location}</p></div>}
                  </div>
                  {!profile.resume_url && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-2">
                      No resume uploaded. <Link to="/portal/profile" className="underline font-medium">Upload resume</Link> to strengthen your application.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
                </div>
              )}

              {/* Cover letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Letter <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                  rows={3} placeholder="Briefly explain why you're a great fit for this role…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Intro recording / upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro Video / Voice <span className="text-gray-400 font-normal">(optional)</span></label>
                <p className="text-xs text-gray-500 mb-3">Record a 60-second intro or upload a video/audio file.</p>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-3">
                  {(['audio', 'video'] as const).map(m => (
                    <button key={m} onClick={() => setRecordMode(m)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${recordMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {m === 'audio' ? <Mic className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                      {m === 'audio' ? 'Voice' : 'Video'}
                    </button>
                  ))}
                </div>

                {/* Live preview */}
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
                  <div className="mb-3 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-sm text-indigo-700 font-medium">Recording… {60 - recordingTime}s remaining</span>
                  </div>
                )}

                {/* Playback */}
                {recordedUrl && !recording && (
                  <div className="mb-3">
                    {recordMode === 'video'
                      ? <video src={recordedUrl} controls className="w-full rounded-xl max-h-36 bg-black" />
                      : <audio src={recordedUrl} controls className="w-full" />}
                  </div>
                )}

                {/* Upload file success */}
                {uploadFile && !recordedBlob && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{uploadFile.name}</span>
                    <button onClick={() => setUploadFile(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}

                {introUrl && (
                  <p className="mb-3 text-xs text-green-700 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Intro uploaded successfully</p>
                )}

                {/* Controls */}
                <div className="flex gap-2 flex-wrap">
                  {!recording && !recordedUrl && (
                    <button onClick={startRecording}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                      <div className="h-2 w-2 rounded-full bg-white" />
                      Start Recording
                    </button>
                  )}
                  {recording && (
                    <button onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-semibold hover:bg-gray-800">
                      <div className="h-2 w-2 rounded-sm bg-white" />
                      Stop
                    </button>
                  )}
                  {recordedUrl && !recording && !introUrl && (
                    <>
                      <button onClick={() => { setRecordedBlob(null); setRecordedUrl('') }}
                        className="px-3.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-gray-50">
                        Re-record
                      </button>
                      <button onClick={() => recordedBlob && uploadIntro(recordedBlob)} disabled={uploadingMedia}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60">
                        {uploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Save Intro
                      </button>
                    </>
                  )}
                  {!recording && (
                    <>
                      <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-gray-50">
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 border-t">
                <button onClick={closeModal}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleApply} disabled={submitting || uploadingMedia}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
