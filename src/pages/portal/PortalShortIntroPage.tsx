import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { portalApi } from '@/lib/portalApi'
import {
  Mic, Video, Upload, Square, CheckCircle, AlertCircle, Star,
  ArrowLeft, RotateCcw, Send, Camera, Volume2, Lightbulb,
} from 'lucide-react'

type RecordMode = 'video' | 'audio'
type Step = 'choose' | 'record' | 'review' | 'scoring' | 'result'

function getBestMimeType(isVideo: boolean): string {
  const types = isVideo
    ? ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return types.find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) ?? ''
}

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function PortalShortIntroPage() {
  const navigate = useNavigate()
  const [mode, setMode]           = useState<RecordMode>('video')
  const [step, setStep]           = useState<Step>('choose')
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime]     = useState(0)
  const [recordedBlob, setRecordedBlob]       = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl]         = useState('')
  const [uploadedFile, setUploadedFile]       = useState<File | null>(null)
  const [transcript, setTranscript]           = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [result, setResult]                   = useState<{ score: number; feedback: string } | null>(null)
  const [error, setError]                     = useState('')

  const liveVideoRef  = useRef<HTMLVideoElement>(null)
  const mediaRecRef   = useRef<MediaRecorder | null>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const chunksRef     = useRef<Blob[]>([])
  const timerRef      = useRef<ReturnType<typeof setInterval>>()
  const speechRef     = useRef<any>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)

  const hasSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      speechRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (recording && recordingTime >= 90) stopRecording()
  }, [recordingTime, recording])

  function startSpeechRecognition() {
    if (!hasSpeech) return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const sr = new SR()
    sr.continuous     = true
    sr.interimResults = true
    sr.lang           = 'en-US'
    sr.onresult = (e: any) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interim += t
      }
      if (final) setTranscript(prev => prev + final)
      setInterimTranscript(interim)
    }
    sr.onerror = () => setInterimTranscript('')
    sr.onend   = () => setInterimTranscript('')
    sr.start()
    speechRef.current = sr
  }

  async function handleStartRecording() {
    setError('')
    try {
      const constraints: MediaStreamConstraints = mode === 'video'
        ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true }
        : { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (liveVideoRef.current && mode === 'video') {
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.muted = true
        liveVideoRef.current.play().catch(() => {})
      }

      chunksRef.current = []
      const mimeType = getBestMimeType(mode === 'video')
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const type = mimeType || (mode === 'video' ? 'video/webm' : 'audio/webm')
        const blob = new Blob(chunksRef.current, { type })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null
        setStep('review')
      }
      mr.start(250)
      mediaRecRef.current = mr
      setStep('record')
      setRecording(true)
      setRecordingTime(0)
      setTranscript('')
      setInterimTranscript('')
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
      startSpeechRecognition()
    } catch (err: any) {
      const name = err?.name ?? ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Camera/microphone access denied. Please allow permissions in your browser and try again.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No camera/microphone detected. Please check your device.')
      } else {
        setError('Could not start recording. Please try Chrome or Edge.')
      }
    }
  }

  function stopRecording() {
    speechRef.current?.stop()
    mediaRecRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setRecordedBlob(null)
    setRecordedUrl(URL.createObjectURL(file))
    setTranscript('')
    setStep('review')
  }

  function reset() {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    speechRef.current?.abort()
    setStep('choose')
    setRecording(false)
    setRecordingTime(0)
    setRecordedBlob(null)
    setRecordedUrl('')
    setUploadedFile(null)
    setTranscript('')
    setInterimTranscript('')
    setResult(null)
    setError('')
  }

  function authHdr() {
    const t = localStorage.getItem('bmi_candidate_token')
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  async function handleSubmit() {
    const fullTranscript = (transcript + ' ' + interimTranscript).trim()
    const fileToUpload   = recordedBlob ?? uploadedFile
    if (!fileToUpload) return

    if (!fullTranscript && step === 'review') {
      // If no transcript and it's an upload, require at least some text
      if (uploadedFile && !recordedBlob) {
        setError('Please add a transcript — type what you said in your recording.')
        return
      }
    }

    setStep('scoring')
    setError('')

    try {
      // 1. Upload the media file
      const fd  = new FormData()
      const ext = recordedBlob
        ? (recordedBlob.type.split(';')[0].split('/')[1] || 'webm')
        : (uploadedFile!.name.split('.').pop() || 'webm')
      fd.append('media', fileToUpload, `intro.${ext}`)
      fd.append('duration', String(recordingTime))
      // Do NOT set Content-Type manually — axios sets multipart/form-data + boundary automatically
      await axios.post('/api/v1/upload/media', fd, { headers: authHdr() })

      // 2. Score via transcript (pad if too short)
      const textToScore = fullTranscript.length >= 20
        ? fullTranscript
        : fullTranscript.length > 0
          ? fullTranscript + ' The candidate submitted a voice/video introduction.'
          : 'The candidate submitted a voice/video introduction without a transcript.'

      const { data } = await portalApi.post('/me/intro', { intro_text: textToScore })
      setResult(data.data)
      setStep('result')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Submission failed. Please try again.')
      setStep('review')
    }
  }

  const scoreColor = result
    ? result.score >= 80 ? 'text-emerald-600'
    : result.score >= 60 ? 'text-amber-600'
    : 'text-red-500'
    : ''

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-3"
        style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Link to="/portal/applications"
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-indigo-600 transition-colors w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Link>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold text-slate-900">Short Introduction</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Record a 30–90 second voice or video introduction. Our AI will evaluate your communication and give a score.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-violet-700 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
            <Star className="h-3 w-3" /> Gate 3 of 3
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-indigo-700 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200">
            Target: 80+ to pass
          </span>
        </div>
      </div>

      {/* ── CHOOSE STEP ── */}
      {step === 'choose' && (
        <div className="space-y-4">

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <p className="text-[12.5px] font-bold text-blue-800">What to say (30–90 seconds)</p>
            </div>
            <ul className="space-y-1">
              {['Your name and current role', 'Key skills and years of experience', '1–2 notable achievements', 'What you\'re looking for in your next role'].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-blue-700">
                  <span className="h-4 w-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Mode toggle */}
          <div className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <p className="text-[12.5px] font-bold text-slate-700 mb-3">Choose recording type</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {([
                { id: 'video' as RecordMode, icon: Camera, label: 'Video', sub: 'Camera + mic — recruiters can see you' },
                { id: 'audio' as RecordMode, icon: Volume2, label: 'Audio Only', sub: 'Microphone only' },
              ] as const).map(opt => (
                <button key={opt.id} onClick={() => setMode(opt.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                  style={{
                    borderColor: mode === opt.id ? '#6366f1' : '#e8edf8',
                    background:  mode === opt.id ? '#eef2ff' : '#fafafa',
                  }}>
                  <opt.icon className="h-6 w-6" style={{ color: mode === opt.id ? '#6366f1' : '#94a3b8' }} />
                  <div>
                    <p className={`text-[13px] font-bold ${mode === opt.id ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button onClick={handleStartRecording}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13.5px] font-bold transition-colors">
                {mode === 'video' ? <Camera className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} /> : <Mic className="h-4 w-4" />}
                Start {mode === 'video' ? 'Video' : 'Audio'} Recording
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <p className="text-[11px] text-slate-400 font-medium">OR</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-xl text-[13px] font-semibold transition-colors">
                <Upload className="h-4 w-4" />
                Upload Existing Recording
              </button>
              <input ref={fileInputRef} type="file" className="hidden"
                accept="audio/*,video/*" onChange={handleFileChange} />

              <p className="text-[11px] text-slate-400 text-center">
                Supported: MP4, WebM, MP3, WAV, M4A · Max 25 MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── RECORD STEP ── */}
      {step === 'record' && (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

          {/* Recording indicator */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[13px] font-bold text-red-600">Recording</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-mono font-bold text-slate-700">{fmtTime(recordingTime)}</span>
              <span className="text-[11px] text-slate-400">/ 01:30</span>
            </div>
          </div>

          {/* Camera preview */}
          {mode === 'video' ? (
            <div className="relative bg-zinc-900">
              <video ref={liveVideoRef} autoPlay playsInline muted
                className="w-full max-h-72 object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                <Camera className="h-3 w-3" /> Live Preview
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 bg-gradient-to-br from-indigo-50 to-violet-50">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Mic className="h-9 w-9 text-indigo-500" />
                </div>
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500" />
              </div>
              <p className="text-[13px] font-semibold text-indigo-700">Listening…</p>
            </div>
          )}

          {/* Live transcript */}
          <div className="px-5 py-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Live Transcript</p>
            <div className="min-h-[60px] max-h-28 overflow-y-auto bg-slate-50 rounded-xl px-3 py-2.5 text-[12.5px] text-slate-700 leading-relaxed">
              {transcript || interimTranscript
                ? <>{transcript}<span className="text-slate-400 italic">{interimTranscript}</span></>
                : <span className="text-slate-300 italic">
                    {hasSpeech ? 'Your words will appear here as you speak…' : 'Transcript will be available after recording'}
                  </span>
              }
            </div>
            {!hasSpeech && (
              <p className="text-[11px] text-amber-600 mt-1.5">
                Live transcription requires Chrome/Edge. You can type your transcript after recording.
              </p>
            )}
          </div>

          {/* Stop button */}
          <div className="px-5 pb-5">
            <button onClick={stopRecording}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13.5px] font-bold transition-colors">
              <Square className="h-4 w-4 fill-white" />
              Stop Recording
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">Auto-stops at 1:30</p>
          </div>
        </div>
      )}

      {/* ── REVIEW STEP ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <p className="text-[14px] font-bold text-slate-900 mb-4">Review Your Recording</p>

            {/* Playback */}
            {recordedUrl && (
              <div className="mb-4">
                {mode === 'video' || (uploadedFile && uploadedFile.type.startsWith('video/')) ? (
                  <video controls src={recordedUrl}
                    className="w-full rounded-xl bg-zinc-900 max-h-64" style={{ transform: mode === 'video' && recordedBlob ? 'scaleX(-1)' : 'none' }} />
                ) : (
                  <div className="bg-indigo-50 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Volume2 className="h-5 w-5 text-indigo-500" />
                    </div>
                    <audio controls src={recordedUrl} className="flex-1" />
                  </div>
                )}
                {recordingTime > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5 text-right">Duration: {fmtTime(recordingTime)}</p>
                )}
              </div>
            )}

            {/* Transcript / edit box */}
            <div className="mb-4">
              <label className="block text-[12.5px] font-bold text-slate-700 mb-2">
                Transcript {hasSpeech && recordedBlob ? '(captured automatically — edit if needed)' : '(type what you said)'}
                {!hasSpeech && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={5}
                placeholder="Type what you said in your recording here…"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-800 focus:outline-none focus:border-indigo-400 resize-none transition-colors placeholder:text-slate-300"
              />
              <p className={`text-[11px] mt-1 ${transcript.trim().split(/\s+/).filter(Boolean).length < 20 ? 'text-amber-500' : 'text-slate-400'}`}>
                {transcript.trim().split(/\s+/).filter(Boolean).length} words
                {transcript.trim().split(/\s+/).filter(Boolean).length < 20 && ' — add more for a better score'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex items-center gap-1.5 px-4 py-3 border-2 border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 rounded-xl text-[13px] font-semibold transition-colors">
                <RotateCcw className="h-4 w-4" /> Re-record
              </button>
              <button onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13.5px] font-bold transition-colors">
                <Send className="h-4 w-4" /> Submit for AI Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCORING STEP ── */}
      {step === 'scoring' && (
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-4"
          style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: 260 }}>
          <div className="h-14 w-14 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="text-center">
            <p className="text-[15px] font-bold text-slate-800">AI is evaluating your introduction…</p>
            <p className="text-[12.5px] text-slate-400 mt-1">Uploading and scoring. This may take a few seconds.</p>
          </div>
        </div>
      )}

      {/* ── RESULT STEP ── */}
      {step === 'result' && result && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-5"
          style={{ border: '1px solid #e8edf8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

          {/* Score circle */}
          <div className="text-center py-4">
            <div className={`inline-flex items-center justify-center h-32 w-32 rounded-full border-4 mb-3 ${
              result.score >= 80 ? 'border-emerald-400 bg-emerald-50'
              : result.score >= 60 ? 'border-amber-400 bg-amber-50'
              : 'border-red-400 bg-red-50'
            }`}>
              <div>
                <div className={`text-4xl font-black ${scoreColor}`}>{result.score}</div>
                <div className="text-xs text-slate-400 font-semibold">/100</div>
              </div>
            </div>
            <h2 className="text-[18px] font-bold text-slate-900">
              {result.score >= 80 ? '🎉 Gate 3 Passed!' : result.score >= 60 ? '⚠️ Almost There' : '❌ Below Threshold'}
            </h2>
            <p className={`text-[13px] font-semibold mt-1 ${scoreColor}`}>
              {result.score >= 80
                ? 'Excellent! You cleared the introduction gate.'
                : `Score ${result.score}/100 — Need 80 to pass`}
            </p>
          </div>

          {/* Feedback */}
          <div className={`rounded-xl p-4 border ${
            result.score >= 80 ? 'bg-emerald-50 border-emerald-200'
            : result.score >= 60 ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-slate-500 mb-1">AI Feedback</p>
            <p className="text-[13px] text-slate-700 leading-relaxed">{result.feedback}</p>
          </div>

          {/* Transcript used */}
          {transcript.trim() && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[11.5px] font-bold text-slate-500 mb-2">Transcript Evaluated</p>
              <p className="text-[12.5px] text-slate-600 italic leading-relaxed line-clamp-4">"{transcript.trim()}"</p>
            </div>
          )}

          {result.score >= 80 ? (
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-[13px] font-bold">All 3 gates cleared — interview scheduling unlocked!</span>
              </div>
              <button onClick={() => navigate('/portal/applications')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13.5px] font-bold transition-colors">
                Go to Applications → Pick Interview Slot
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-[12.5px] text-slate-500">
                Re-record with more detail about your experience and goals.
              </p>
              <button onClick={reset}
                className="w-full py-3 border-2 border-indigo-300 text-indigo-700 rounded-xl text-[13.5px] font-bold hover:bg-indigo-50 transition-colors">
                <RotateCcw className="h-4 w-4 inline mr-1.5" />Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
