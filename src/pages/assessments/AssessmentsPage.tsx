import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { Plus, Pencil, Trash2, ClipboardCheck, X, Check } from 'lucide-react'

type QType = 'single_choice' | 'multi_choice' | 'true_false' | 'short_text' | 'paragraph' | 'scenario' | 'technical' | 'aptitude'

interface Question {
  id: string; title: string; question_type: QType; category: string | null
  difficulty: 'easy' | 'medium' | 'hard'; options: string[] | null
  correct_options: string[] | null; explanation: string | null
  marks: number; negative_marks: number
}
interface Job { id: string; title: string; job_code: string }

const Q_TYPES: { value: QType; label: string }[] = [
  { value: 'single_choice', label: 'Single Choice' }, { value: 'multi_choice', label: 'Multiple Choice' },
  { value: 'true_false',    label: 'True / False' },  { value: 'short_text',   label: 'Short Answer' },
  { value: 'paragraph',     label: 'Paragraph' },     { value: 'scenario',     label: 'Scenario' },
  { value: 'technical',     label: 'Technical' },     { value: 'aptitude',     label: 'Aptitude' },
]

const BLANK_Q = {
  title: '', question_type: 'single_choice' as QType, category: '', difficulty: 'medium' as const,
  options: ['', '', '', ''], correct_options: [] as string[], explanation: '', marks: 1, negative_marks: 0,
}

export default function AssessmentsPage() {
  const [tab, setTab] = useState<'bank' | 'jobs'>('bank')
  const [questions, setQuestions] = useState<Question[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobAssessments, setJobAssessments] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('')
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [bankTotal, setBankTotal] = useState(0)
  const [showQModal, setShowQModal] = useState(false)
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ ...BLANK_Q })
  const [saving, setSaving] = useState(false)
  const [asmtModal, setAsmtModal] = useState<Job | null>(null)
  const [asmtForm, setAsmtForm] = useState({
    title: '', time_limit_mins: 30, passing_score: 60, shuffle_qs: false, instructions: '', question_ids: [] as string[],
  })

  const loadBank = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/assessments/bank', { params: { category: catFilter || undefined, limit: 100 } })
      setQuestions(data.data.questions.map((q: any) => ({
        ...q,
        options:         q.options         ? (typeof q.options         === 'string' ? JSON.parse(q.options)         : q.options)         : null,
        correct_options: q.correct_options ? (typeof q.correct_options === 'string' ? JSON.parse(q.correct_options) : q.correct_options) : null,
      })))
      setBankTotal(data.data.total)
    } catch { setQuestions([]) } finally { setLoading(false) }
  }, [catFilter])

  useEffect(() => { if (tab === 'bank') loadBank() }, [tab, loadBank])

  useEffect(() => {
    api.get('/assessments/bank/categories').then(({ data }) => setCategories(data.data)).catch(() => {})
    api.get('/jobs').then(({ data }) => setJobs(data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'jobs' || jobs.length === 0) return
    jobs.forEach(j => {
      api.get(`/assessments/job/${j.id}`).then(({ data }) => {
        if (data.data) setJobAssessments(prev => ({ ...prev, [j.id]: data.data }))
      }).catch(() => {})
    })
  }, [tab, jobs])

  function hasOptions(type: QType) { return ['single_choice','multi_choice','true_false'].includes(type) }

  function openCreate() {
    setEditQ(null); setQForm({ ...BLANK_Q }); setShowQModal(true)
  }

  function openEdit(q: Question) {
    setEditQ(q)
    setQForm({
      title: q.title, question_type: q.question_type, category: q.category ?? '',
      difficulty: q.difficulty, options: q.options ?? ['', '', '', ''],
      correct_options: q.correct_options ?? [], explanation: q.explanation ?? '',
      marks: q.marks, negative_marks: q.negative_marks,
    })
    setShowQModal(true)
  }

  async function saveQ() {
    setSaving(true)
    try {
      const payload = {
        ...qForm,
        options:         hasOptions(qForm.question_type) ? qForm.options.filter(o => o.trim()) : undefined,
        correct_options: hasOptions(qForm.question_type) ? qForm.correct_options : undefined,
      }
      if (editQ) { await api.put(`/assessments/bank/${editQ.id}`, payload) }
      else       { await api.post('/assessments/bank', payload) }
      setShowQModal(false); loadBank()
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Failed') } finally { setSaving(false) }
  }

  async function deleteQ(id: string) {
    if (!confirm('Delete this question?')) return
    await api.delete(`/assessments/bank/${id}`)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  function toggleCorrect(opt: string) {
    if (qForm.question_type === 'single_choice' || qForm.question_type === 'true_false') {
      setQForm(f => ({ ...f, correct_options: [opt] }))
    } else {
      setQForm(f => ({
        ...f,
        correct_options: f.correct_options.includes(opt) ? f.correct_options.filter(o => o !== opt) : [...f.correct_options, opt],
      }))
    }
  }

  function openAsmtModal(job: Job) {
    setAsmtModal(job)
    const existing = jobAssessments[job.id]
    if (existing) {
      setAsmtForm({
        title: existing.title, time_limit_mins: existing.time_limit_mins,
        passing_score: existing.passing_score, shuffle_qs: !!existing.shuffle_qs,
        instructions: existing.instructions ?? '',
        question_ids: (existing.questions ?? []).map((q: any) => q.id),
      })
    } else {
      setAsmtForm({ title: `${job.title} Assessment`, time_limit_mins: 30, passing_score: 60, shuffle_qs: false, instructions: '', question_ids: [] })
    }
  }

  async function saveAssessment() {
    if (!asmtModal) return
    setSaving(true)
    try {
      await api.post(`/assessments/job/${asmtModal.id}`, { ...asmtForm, shuffle_qs: asmtForm.shuffle_qs ? 1 : 0 })
      const { data } = await api.get(`/assessments/job/${asmtModal.id}`)
      if (data.data) setJobAssessments(prev => ({ ...prev, [asmtModal.id]: data.data }))
      setAsmtModal(null)
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-muted-foreground text-sm">Manage question bank and configure job assessments</p>
        </div>
        {tab === 'bank' && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="h-4 w-4" />Add Question
          </button>
        )}
      </div>

      <div className="flex border-b">
        {(['bank', 'jobs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'bank' ? `Question Bank (${bankTotal})` : 'Job Assessments'}
          </button>
        ))}
      </div>

      {tab === 'bank' && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCatFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!catFilter ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}>All</button>
            {categories.map(c => (
              <button key={c.category} onClick={() => setCatFilter(c.category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c.category ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}>
                {c.category} ({c.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
          ) : questions.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">No questions yet</p>
              <button onClick={openCreate} className="text-primary text-sm font-medium">+ Add first question</button>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map(q => {
                const qt = Q_TYPES.find(t => t.value === q.question_type)
                return (
                  <div key={q.id} className="bg-card border rounded-lg p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1.5 line-clamp-2">{q.title}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{qt?.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>
                        {q.category && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{q.category}</span>}
                        <span className="text-xs text-muted-foreground">{q.marks}m</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(q)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteQ(q.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No jobs found. Create a job first.</p>
          ) : jobs.map(job => {
            const a = jobAssessments[job.id]
            return (
              <div key={job.id} className="bg-card border rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{job.job_code} — {job.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {a ? `${a.title} · ${(a.questions ?? []).length} questions · ${a.time_limit_mins} min · Pass: ${a.passing_score}%` : 'No assessment configured'}
                  </p>
                </div>
                <button onClick={() => openAsmtModal(job)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-white rounded-lg shrink-0">
                  <Plus className="h-3.5 w-3.5" />{a ? 'Edit' : 'Configure'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Question Modal */}
      {showQModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl w-full max-w-xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editQ ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowQModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question *</label>
                <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" rows={3}
                  value={qForm.title} onChange={e => setQForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter question..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={qForm.question_type}
                    onChange={e => {
                      const t = e.target.value as QType
                      setQForm(f => ({ ...f, question_type: t, correct_options: [], options: t === 'true_false' ? ['True','False'] : ['','','',''] }))
                    }}>
                    {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    value={qForm.category} onChange={e => setQForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Verbal Ability" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={qForm.difficulty}
                    onChange={e => setQForm(f => ({ ...f, difficulty: e.target.value as any }))}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Marks</label>
                  <input type="number" min={1} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    value={qForm.marks} onChange={e => setQForm(f => ({ ...f, marks: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Neg. Marks</label>
                  <input type="number" min={0} step={0.25} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    value={qForm.negative_marks} onChange={e => setQForm(f => ({ ...f, negative_marks: +e.target.value }))} />
                </div>
              </div>

              {hasOptions(qForm.question_type) && (
                <div>
                  <label className="text-sm font-medium">Options <span className="text-muted-foreground font-normal">(click ✓ to mark correct)</span></label>
                  <div className="mt-2 space-y-2">
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button type="button" onClick={() => opt.trim() && toggleCorrect(opt)}
                          className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${qForm.correct_options.includes(opt) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400'}`}>
                          {qForm.correct_options.includes(opt) && <Check className="h-3 w-3" />}
                        </button>
                        <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background"
                          value={opt} readOnly={qForm.question_type === 'true_false'}
                          placeholder={`Option ${i + 1}`}
                          onChange={e => {
                            const newOpts = [...qForm.options]
                            const oldVal = newOpts[i]
                            newOpts[i] = e.target.value
                            setQForm(f => ({ ...f, options: newOpts, correct_options: f.correct_options.map(co => co === oldVal ? e.target.value : co) }))
                          }} />
                        {qForm.question_type !== 'true_false' && (
                          <button type="button" onClick={() => setQForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i), correct_options: f.correct_options.filter(co => co !== opt) }))}
                            className="text-muted-foreground hover:text-red-500 shrink-0"><X className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                    {qForm.question_type !== 'true_false' && (
                      <button type="button" onClick={() => setQForm(f => ({ ...f, options: [...f.options, ''] }))}
                        className="text-primary text-sm">+ Add option</button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Explanation (optional)</label>
                <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" rows={2}
                  value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Explain the correct answer..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowQModal(false)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={saveQ} disabled={saving || !qForm.title.trim()} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editQ ? 'Update' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Config Modal */}
      {asmtModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl w-full max-w-xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Configure — {asmtModal.title}</h2>
              <button onClick={() => setAsmtModal(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Assessment Title *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={asmtForm.title} onChange={e => setAsmtForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Time Limit (min)</label>
                  <input type="number" min={5} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={asmtForm.time_limit_mins} onChange={e => setAsmtForm(f => ({ ...f, time_limit_mins: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Passing Score (%)</label>
                  <input type="number" min={0} max={100} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background" value={asmtForm.passing_score} onChange={e => setAsmtForm(f => ({ ...f, passing_score: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" rows={2} value={asmtForm.instructions} onChange={e => setAsmtForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Instructions shown to candidates..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={asmtForm.shuffle_qs} onChange={e => setAsmtForm(f => ({ ...f, shuffle_qs: e.target.checked }))} />
                <span className="text-sm">Shuffle question order</span>
              </label>

              <div>
                <label className="text-sm font-medium">Select Questions ({asmtForm.question_ids.length} selected)</label>
                <div className="mt-2 max-h-56 overflow-y-auto border rounded-lg divide-y bg-background">
                  {questions.length === 0
                    ? <p className="text-sm text-muted-foreground p-4 text-center">No questions in bank yet.</p>
                    : questions.map(q => (
                        <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                          <input type="checkbox" className="mt-0.5"
                            checked={asmtForm.question_ids.includes(q.id)}
                            onChange={e => setAsmtForm(f => ({ ...f, question_ids: e.target.checked ? [...f.question_ids, q.id] : f.question_ids.filter(id => id !== q.id) }))} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-1">{q.title}</p>
                            <p className="text-xs text-muted-foreground">{Q_TYPES.find(t => t.value === q.question_type)?.label} · {q.marks}m · {q.difficulty}</p>
                          </div>
                        </label>
                      ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAsmtModal(null)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={saveAssessment} disabled={saving || !asmtForm.title || asmtForm.question_ids.length === 0}
                className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
