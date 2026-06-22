import { useEffect, useState, useCallback } from 'react'
import { questionBankApi } from '@/lib/questionBankApi'
import {
  Loader2, Search, Plus, Pencil, Trash2, X, Check, ChevronDown,
  Filter, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  question_type: 'single_choice' | 'multi_choice' | 'true_false'
  options: string
  correct_answer: string
  skills: string
  category: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  marks: number
  explanation: string | null
  is_active: number
  created_by_name: string | null
  created_at: string
  updated_at: string
}

const emptyForm = {
  question_text: '',
  question_type: 'single_choice' as const,
  options: ['', '', '', ''],
  correct_answer: [0] as number[],
  skills: [] as string[],
  category: '',
  difficulty: 'medium' as const,
  marks: 1,
  explanation: '',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  hard:   'bg-red-50 text-red-600 ring-1 ring-red-200',
}

export default function SuperAdminQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [allSkills, setAllSkills] = useState<string[]>([])
  const [allCats, setAllCats] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      if (skillFilter) params.set('skill', skillFilter)
      if (catFilter) params.set('category', catFilter)
      if (diffFilter) params.set('difficulty', diffFilter)
      const { data } = await questionBankApi.get(`/questions?${params}`)
      setQuestions(data.data.questions)
      setTotal(data.data.total)
    } catch {} finally { setLoading(false) }
  }, [search, skillFilter, catFilter, diffFilter, page])

  const loadMeta = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        questionBankApi.get('/skills'),
        questionBankApi.get('/categories'),
      ])
      setAllSkills(sRes.data.data)
      setAllCats(cRes.data.data)
    } catch {}
  }, [])

  useEffect(() => { load(); loadMeta() }, [load, loadMeta])

  function resetForm() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setSkillInput('')
  }

  function openEdit(q: Question) {
    let opts: string[] = []
    try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? []) } catch { opts = [] }
    let ans: number[] = []
    try { ans = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : (q.correct_answer ?? [0]) } catch { ans = [0] }
    let skills: string[] = []
    try { skills = typeof q.skills === 'string' ? JSON.parse(q.skills) : (q.skills ?? []) } catch { skills = [] }

    setForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: opts.length >= 2 ? opts : ['', '', '', ''],
      correct_answer: ans,
      skills,
      category: q.category ?? '',
      difficulty: q.difficulty,
      marks: q.marks,
      explanation: q.explanation ?? '',
    })
    setEditingId(q.id)
    setShowForm(true)
  }

  function addSkill(skill: string) {
    const s = skill.trim()
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }))
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
  }

  function setOption(index: number, value: string) {
    const opts = [...form.options]
    opts[index] = value
    setForm(f => ({ ...f, options: opts }))
  }

  function addOption() {
    setForm(f => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(index: number) {
    if (form.options.length <= 2) return
    const opts = form.options.filter((_, i) => i !== index)
    const ans = form.correct_answer.filter(a => a !== index).map(a => a > index ? a - 1 : a)
    setForm(f => ({ ...f, options: opts, correct_answer: ans.length ? ans : [0] }))
  }

  function toggleCorrect(index: number) {
    if (form.question_type === 'single_choice' || form.question_type === 'true_false') {
      setForm(f => ({ ...f, correct_answer: [index] }))
    } else {
      const set = new Set(form.correct_answer)
      if (set.has(index)) set.delete(index)
      else set.add(index)
      setForm(f => ({ ...f, correct_answer: Array.from(set).sort() }))
    }
  }

  async function handleSave() {
    if (!form.question_text || form.options.some(o => !o.trim()) || form.skills.length === 0) return
    setSaving(true)
    try {
      const payload = {
        question_text: form.question_text,
        question_type: form.question_type,
        options: form.options.filter(o => o.trim()),
        correct_answer: form.correct_answer,
        skills: form.skills,
        category: form.category || null,
        difficulty: form.difficulty,
        marks: form.marks,
        explanation: form.explanation || null,
      }
      if (editingId) {
        await questionBankApi.put(`/questions/${editingId}`, payload)
      } else {
        await questionBankApi.post('/questions', payload)
      }
      setShowForm(false)
      resetForm()
      load()
      loadMeta()
    } catch {} finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this question? It will be soft-deleted.')) return
    try {
      await questionBankApi.delete(`/questions/${id}`)
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Question Bank</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{total} questions total</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search questions..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={skillFilter} onChange={e => { setSkillFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm">
          <option value="">All Skills</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm">
          <option value="">All Categories</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={diffFilter} onChange={e => { setDiffFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
          <p className="font-medium">No questions found</p>
          <p className="text-sm mt-1">Create your first question to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Question</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Difficulty</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Skills</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500">Category</th>
                  <th className="text-center px-4 py-3 font-medium text-zinc-500">Marks</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => {
                  let skills: string[] = []
                  try { skills = typeof q.skills === 'string' ? JSON.parse(q.skills) : (q.skills ?? []) } catch {}
                  return (
                    <tr key={q.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-white line-clamp-2">{q.question_text}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{q.question_type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-block px-2 py-0.5 rounded-md text-[11px] font-medium', DIFFICULTY_STYLES[q.difficulty])}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map(s => (
                            <span key={s} className="inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-medium">
                              {s}
                            </span>
                          ))}
                          {skills.length > 3 && <span className="text-[10px] text-zinc-400">+{skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{q.category ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">{q.marks}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(q)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Page {page} of {Math.ceil(total / limit)}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm disabled:opacity-40">
                  Previous
                </button>
                <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingId ? 'Edit Question' : 'New Question'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm() }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Question Text *</label>
                <textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Enter the question..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                  <select value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as any, correct_answer: e.target.value === 'multi_choice' ? [] : [0] }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                    <option value="single_choice">Single Choice</option>
                    <option value="multi_choice">Multi Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                {/* Marks */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Marks</label>
                  <input type="number" min={1} value={form.marks} onChange={e => setForm(f => ({ ...f, marks: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
                </div>
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Options *</label>
                  {form.question_type !== 'true_false' && (
                    <button onClick={addOption} className="text-xs text-indigo-600 hover:underline">+ Add option</button>
                  )}
                </div>
                <div className="space-y-2">
                  {(form.question_type === 'true_false' ? ['True', 'False'] : form.options).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button onClick={() => toggleCorrect(i)}
                        className={cn(
                          'h-5 w-5 rounded flex items-center justify-center shrink-0 border transition-colors',
                          form.question_type === 'multi_choice' ? 'rounded-md' : 'rounded-full',
                          form.correct_answer.includes(i)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        )}>
                        {form.correct_answer.includes(i) && <Check className="h-3 w-3" />}
                      </button>
                      <input value={opt}
                        onChange={e => setOption(i, e.target.value)}
                        disabled={form.question_type === 'true_false'}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
                          form.question_type === 'true_false'
                            ? 'bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed border-zinc-200 dark:border-zinc-700'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        )}
                        placeholder={`Option ${i + 1}`} />
                      {form.question_type !== 'true_false' && form.options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="p-1 text-zinc-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {form.question_type === 'single_choice' ? 'Click the circle to mark correct answer' :
                   form.question_type === 'multi_choice' ? 'Click boxes to select correct answers' :
                   'True/False — click the circle to mark correct'}
                </p>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Skills *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                    placeholder="Type a skill and press Enter..."
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {allSkills.length > 0 && (
                    <select onChange={e => { if (e.target.value) { addSkill(e.target.value); e.target.value = '' } }}
                      className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                      <option value="">From list</option>
                      {allSkills.filter(s => !form.skills.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <div className="flex gap-2">
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Frontend, Backend, DevOps..."
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {allCats.length > 0 && (
                    <select onChange={e => { if (e.target.value) { setForm(f => ({ ...f, category: e.target.value })) } }}
                      className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                      <option value="">From list</option>
                      {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Explanation (optional)</label>
                <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Explain the correct answer..." />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-200 dark:border-zinc-800">
              <button onClick={() => { setShowForm(false); resetForm() }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.question_text || form.skills.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
