import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadApi } from '@/lib/portalApi'
import { cn } from '@/lib/utils'

export interface ParsedResumeData {
  full_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  email?: string | null
  mobile?: string | null
  current_location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  current_designation?: string | null
  current_company?: string | null
  total_experience_years?: number | null
  professional_summary?: string | null
  career_objective?: string | null
  skills?: Array<{ skill_name: string; skill_level?: string }>
  education?: Array<{
    qualification?: string; degree?: string; specialization?: string | null
    institute?: string; university?: string | null
    passing_year?: number | null; percentage?: number | null
  }>
  experience?: Array<{
    company_name?: string; designation?: string
    joining_date?: string; relieving_date?: string | null
    is_current?: number; roles_responsibilities?: string | null
  }>
  certifications?: Array<{
    certification_name?: string; issuing_organization?: string; issue_date?: string | null
  }>
}

interface ResumeUploadProps {
  onParseComplete: (data: ParsedResumeData) => void
  className?: string
}

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

type UploadState = 'idle' | 'parsing' | 'success' | 'error'

export function ResumeUpload({ onParseComplete, className }: ResumeUploadProps) {
  const [state, setState]       = useState<UploadState>('idle')
  const [file, setFile]         = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(f: File): string | null {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Only PDF, DOC, or DOCX files are supported'
    if (f.size > MAX_SIZE) return `File is too large (${fmtBytes(f.size)}). Max 5 MB.`
    return null
  }

  const process = useCallback(async (f: File) => {
    const err = validate(f)
    if (err) { setErrorMsg(err); setState('error'); return }
    setFile(f)
    setState('parsing')
    setErrorMsg('')
    const fd = new FormData()
    fd.append('resume', f)
    try {
      const res = await uploadApi.post('/parse-resume-file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onParseComplete(res.data.data as ParsedResumeData)
      setState('success')
      toast.success("We've pre-filled your profile! Please review and edit if needed.")
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message ?? 'Failed to parse resume. Please try again.')
      setState('error')
    }
  }, [onParseComplete])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) process(f)
  }, [process])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (f) process(f)
  }, [process])

  function reset() { setFile(null); setState('idle'); setErrorMsg(''); setDragging(false) }

  return (
    <div className={cn('w-full', className)}>
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onChange} />

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed cursor-pointer select-none transition-all duration-200',
              dragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            )}
          >
            <motion.div
              animate={{ scale: dragging ? 1.2 : 1, rotate: dragging ? 8 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center"
            >
              <Upload className="h-7 w-7 text-indigo-500" />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {dragging ? 'Drop to auto-fill ✨' : 'Upload your resume'}
              </p>
              <p className="text-xs text-zinc-400">Drag & drop or click · PDF or DOCX · max 5 MB</p>
              <p className="text-xs text-indigo-500 font-medium">AI will pre-fill your entire profile</p>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200 dark:shadow-none pointer-events-none">
              <FileText className="h-4 w-4" />
              Browse file
            </div>
          </motion.div>
        )}

        {state === 'parsing' && (
          <motion.div
            key="parsing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{file?.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">AI is reading your resume…</p>
              </div>
              <span className="text-xs text-zinc-400 shrink-0">{file ? fmtBytes(file.size) : ''}</span>
            </div>
            <div className="space-y-2.5">
              {[90, 70, 85, 55, 75].map((w, i) => (
                <div key={i} className="relative h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${w}%`,
                      background: 'linear-gradient(90deg, #e0e7ff, #6366f1, #e0e7ff)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                    transition={{ repeat: Infinity, duration: 1.2 + i * 0.15, ease: 'linear' }}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-400 text-center">Extracting name, skills, experience, education…</p>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 truncate">{file?.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Profile pre-filled! Review and edit as needed.</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); reset() }}
              className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline underline-offset-2 shrink-0 transition-colors"
            >
              Upload another
            </button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{errorMsg || 'Failed to parse resume'}</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Please try again or fill in your details manually.</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); reset() }}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 shrink-0 mt-1 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
