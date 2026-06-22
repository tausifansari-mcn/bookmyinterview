import { useEffect, useState } from 'react'
import { clientApi } from '@/lib/clientApi'
import {
  ClipboardCheck, Plus, Loader2, X, Clock, Target, CheckCircle2,
  BookOpen, ChevronRight, Trash2, AlertCircle, Sparkles,
  HelpCircle, GripVertical, Settings2, FileEdit,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assessment {
  id: string
  title: string
  description: string | null
  time_limit_mins: number
  total_marks: number
  passing_score: number
  created_at: string
}

interface Question {
  id: string
  title: string
  question_type: string
  options: string[] | null
  correct_index: number
  marks: number
  difficulty: string
  order_no: number
}

type QType = 'single_choice' | 'multi_choice' | 'true_false' | 'short_text'

const QTYPE_LABELS: Record<QType, string> = {
  single_choice: 'Single Choice',
  multi_choice:  'Multiple Choice',
  true_false:    'True / False',
  short_text:    'Short Answer',
}

const DIFF_LABELS = ['easy', 'medium', 'hard']

const DIFF_COLORS: Record<string, string> = {
  easy:   'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  hard:   'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default function ClientAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const [form, setForm] = useState({ title: '', description: '', time_limit_mins: 30 })

  // Question builder
  const [selected, setSelected] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [qLoading, setQLoading]   = useState(false)
  const [addingQ, setAddingQ]     = useState(false)
  const [qError, setQError]       = useState('')
  const [deleting, setDeleting]   = useState<string | null>(null)

  const EMPTY_Q = { text: '', type: 'single_choice' as QType, options: ['', '', '', ''], correct_index: 0, marks: 1, difficulty: 'medium' }
  const [qForm, setQForm] = useState({ ...EMPTY_Q })

  const totalQuestions = questions.length
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0)

  function load() {
    setLoading(true)
    clientApi.get('/assessments')
      .then(r => setAssessments(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function setF(key: keyof typeof form, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await clientApi.post('/assessments', form)
      setShowModal(false)
      setForm({ title: '', description: '', time_limit_mins: 30 })
      setSuccess('Assessment created successfully!')
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create assessment')
    } finally {
      setSaving(false)
    }
  }

  async function openAssessment(a: Assessment) {
    setSelected(a)
    setQLoading(true)
    setQuestions([])
    try {
      const r = await clientApi.get(`/assessments/${a.id}`)
      setQuestions(r.data.data.questions ?? [])
    } catch {}
    finally { setQLoading(false) }
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setAddingQ(true); setQError('')
    try {
      const opts =
        qForm.type === 'true_false'   ? ['True', 'False'] :
        qForm.type === 'short_text'   ? null :
        qForm.options.filter(o => o.trim())
      await clientApi.post(`/assessments/${selected.id}/questions`, {
        text: qForm.text,
        question_type: qForm.type,
        options: opts,
        correct_index: qForm.correct_index,
        marks: qForm.marks,
        difficulty: qForm.difficulty,
      })
      const r = await clientApi.get(`/assessments/${selected.id}`)
      setQuestions(r.data.data.questions ?? [])
      setAssessments(prev => prev.map(a => a.id === selected.id ? { ...a, total_marks: (r.data.data.questions as Question[]).reduce((s, q) => s + q.marks, 0) } : a))
      setQForm({ ...EMPTY_Q })
    } catch (err: any) {
      setQError(err?.response?.data?.message ?? 'Failed to add question')
    } finally {
      setAddingQ(false)
    }
  }

  async function deleteQuestion(qid: string) {
    if (!selected) return
    setDeleting(qid)
    try {
      await clientApi.delete(`/assessments/${selected.id}/questions/${qid}`)
      const r = await clientApi.get(`/assessments/${selected.id}`)
      setQuestions(r.data.data.questions ?? [])
      setAssessments(prev => prev.map(a => a.id === selected.id ? { ...a, total_marks: (r.data.data.questions as Question[]).reduce((s, q) => s + q.marks, 0) } : a))
    } catch {}
    finally { setDeleting(null) }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[14px] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all'
  const labelCls = 'block text-[12px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide'
  const qInputCls = 'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all'
  const qLabelCls = 'block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide'

  const optionLabels = ['A', 'B', 'C', 'D']
  const tfOptions    = ['True', 'False']

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Assessments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
          <Plus className="h-4 w-4" /> Create Assessment
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-[13px] text-emerald-700 dark:text-emerald-300 font-medium">{success}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 animate-pulse">
              <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded mb-3" />
              <div className="h-3 w-full bg-zinc-50 dark:bg-zinc-800 rounded mb-4" />
              <div className="flex gap-3">
                <div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                <div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-50 dark:bg-amber-900/30">
            <ClipboardCheck className="h-8 w-8 text-amber-500" />
          </div>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No assessments yet</p>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mb-5">Create your first assessment to evaluate candidates</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            <Plus className="h-4 w-4" /> Create Assessment
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map(a => (
            <button key={a.id} onClick={() => openAssessment(a)} className="text-left w-full">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all group h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-900/30">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-hover:text-amber-400 shrink-0 mt-0.5 transition-colors" />
                </div>

                {a.description && (
                  <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">{a.description}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Clock className="h-3 w-3" />
                    <span className="text-[11px] font-semibold">{a.time_limit_mins} mins</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Target className="h-3 w-3" />
                    <span className="text-[11px] font-semibold">{a.total_marks} marks</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[11px] font-semibold">Pass {a.passing_score}%</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Create Assessment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
                  <ClipboardCheck className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-[17px] font-bold text-zinc-900 dark:text-white">Create Assessment</h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Assessment Title *</label>
                <input value={form.title} onChange={e => setF('title', e.target.value)}
                  required placeholder="e.g. React Developer Test" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description ?? ''} onChange={e => setF('description', e.target.value)}
                  placeholder="Brief description…" rows={3} className={cn(inputCls, 'resize-none')} />
              </div>

              <div>
                <label className={labelCls}>Time Limit (minutes) *</label>
                <input type="number" min={5} max={180} value={form.time_limit_mins}
                  onChange={e => setF('time_limit_mins', parseInt(e.target.value) || 30)}
                  className={inputCls} />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: saving ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Question Builder Slide-over ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col z-10">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold text-zinc-900 dark:text-white">{selected.title}</p>
                <p className="text-[12px] text-zinc-400">
                  {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {totalMarks} marks total
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Question count summary */}
              {!qLoading && questions.length > 0 && (
                <div className="flex items-center gap-4 text-[12px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {totalQuestions} Questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    {totalMarks} Marks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {selected.time_limit_mins} min limit
                  </span>
                </div>
              )}

              {/* Existing questions */}
              {qLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : questions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                    <FileEdit className="h-3.5 w-3.5" />
                    Questions
                  </p>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">{q.title}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10.5px] font-semibold">
                              {QTYPE_LABELS[q.question_type as QType] ?? q.question_type}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10.5px] font-semibold">
                              {q.marks} mark{q.marks !== 1 ? 's' : ''}
                            </span>
                            <span className={cn('px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold capitalize', DIFF_COLORS[q.difficulty] ?? 'bg-zinc-100 text-zinc-500')}>
                              {q.difficulty}
                            </span>
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]',
                                  oi === q.correct_index
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium'
                                    : 'text-zinc-500 dark:text-zinc-400'
                                )}>
                                  <span className={cn(
                                    'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 text-[8px] font-bold',
                                    oi === q.correct_index
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-zinc-300 dark:border-zinc-600'
                                  )}>
                                    {oi === q.correct_index ? '✓' : optionLabels[oi]}
                                  </span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteQuestion(q.id)} disabled={deleting === q.id}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0">
                          {deleting === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                  <div className="h-12 w-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <ClipboardCheck className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-[13px] text-zinc-400 dark:text-zinc-500">No questions yet</p>
                  <p className="text-[11px] text-zinc-300 dark:text-zinc-600 mt-1">Add your first question below</p>
                </div>
              )}

              {/* Add Question Form */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-[12px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Add Question</p>
                </div>
                <form onSubmit={addQuestion} className="space-y-4">

                  <div>
                    <label className={qLabelCls}>Question Text *</label>
                    <textarea value={qForm.text} onChange={e => setQForm(p => ({ ...p, text: e.target.value }))}
                      required placeholder="Enter your question…" rows={2}
                      className={cn(qInputCls, 'resize-none')} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={qLabelCls}>Type</label>
                      <select value={qForm.type} onChange={e => setQForm(p => ({ ...p, type: e.target.value as QType, correct_index: 0 }))}
                        className={qInputCls}>
                        {(Object.entries(QTYPE_LABELS) as [QType, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={qLabelCls}>Marks</label>
                      <input type="number" min={1} max={20} value={qForm.marks}
                        onChange={e => setQForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))}
                        className={qInputCls} />
                    </div>
                    <div>
                      <label className={qLabelCls}>Difficulty</label>
                      <select value={qForm.difficulty} onChange={e => setQForm(p => ({ ...p, difficulty: e.target.value }))}
                        className={qInputCls}>
                        {DIFF_LABELS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Options for choice-based questions */}
                  {(qForm.type === 'single_choice' || qForm.type === 'multi_choice') && (
                    <div className="space-y-2">
                      <label className={qLabelCls}>Options <span className="font-normal normal-case text-zinc-400">(click radio to mark correct)</span></label>
                      {qForm.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button type="button" onClick={() => setQForm(p => ({ ...p, correct_index: oi }))}
                            className={cn(
                              'h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                              qForm.correct_index === oi
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400'
                            )}>
                            {qForm.correct_index === oi && <span className="h-2 w-2 rounded-full bg-white" />}
                          </button>
                          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 w-5 shrink-0">{optionLabels[oi]}.</span>
                          <input value={opt}
                            onChange={e => {
                              const opts = [...qForm.options]
                              opts[oi] = e.target.value
                              setQForm(p => ({ ...p, options: opts }))
                            }}
                            placeholder={`Option ${optionLabels[oi]}`}
                            className={cn(qInputCls, 'flex-1')} />
                        </div>
                      ))}
                    </div>
                  )}

                  {qForm.type === 'true_false' && (
                    <div>
                      <label className={qLabelCls}>Correct Answer</label>
                      <div className="flex gap-3">
                        {tfOptions.map((opt, oi) => (
                          <button key={opt} type="button" onClick={() => setQForm(p => ({ ...p, correct_index: oi }))}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-all',
                              qForm.correct_index === oi
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-emerald-300'
                            )}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {qForm.type === 'short_text' && (
                    <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-3 py-2.5">
                      <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-blue-700 dark:text-blue-300">Short-text answers require manual review — no auto-scoring.</p>
                    </div>
                  )}

                  {qError && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[12.5px] text-red-700 dark:text-red-300">{qError}</p>
                    </div>
                  )}

                  <button type="submit" disabled={addingQ || !qForm.text.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: addingQ ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                    {addingQ ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add Question</>}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
