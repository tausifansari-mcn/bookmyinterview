import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

interface Question {
  id: string
  title: string
  question_type: string
  options: string[] | null
  marks: number
  difficulty: string
  order_no: number
}

interface Attempt {
  id: string
  status: string
  title: string
  instructions: string | null
  time_limit_mins: number
  total_marks: number
}

type Answer = { selected_options?: string[]; text_answer?: string }

const BASE = '/api/v1'
const SECS_PER_QUESTION = 60

export default function PortalAssessmentPage() {
  const { token } = useParams<{ token: string }>()

  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [attempt, setAttempt]     = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [phase, setPhase]         = useState<'instructions' | 'test' | 'submitted'>('instructions')
  const [currentQ, setCurrentQ]   = useState(0)
  const [answers, setAnswers]     = useState<Record<string, Answer>>({})
  const [qTimer, setQTimer]       = useState(SECS_PER_QUESTION)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]       = useState<{ scored: number; totalMarks: number; percentage: number; passed: boolean } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    axios.get(`${BASE}/assessments/attempt/${token}`).then(({ data }) => {
      setAttempt(data.data.attempt)
      setQuestions(data.data.questions.map((q: any) => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      })))
      if (data.data.attempt.status === 'completed') setPhase('submitted')
    }).catch(e => {
      setError(e?.response?.data?.message ?? 'Invalid or expired assessment link.')
    }).finally(() => setLoading(false))
  }, [token])

  const goNext = useCallback(() => {
    setCurrentQ(c => {
      if (c < questions.length - 1) {
        setQTimer(SECS_PER_QUESTION)
        return c + 1
      }
      // last question auto-submit
      handleSubmit(true)
      return c
    })
  }, [questions.length])

  useEffect(() => {
    if (phase !== 'test') return
    setQTimer(SECS_PER_QUESTION)
    timerRef.current = setInterval(() => {
      setQTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          goNext()
          return SECS_PER_QUESTION
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase, currentQ])

  async function startTest() {
    try {
      await axios.post(`${BASE}/assessments/attempt/${token}/start`)
      setPhase('test')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to start.')
    }
  }

  async function handleSubmit(auto = false) {
    if (!auto && !confirm('Submit assessment? You cannot change answers after submitting.')) return
    clearInterval(timerRef.current!)
    setSubmitting(true)
    try {
      const answersArr = questions.map(q => ({
        question_id:      q.id,
        selected_options: answers[q.id]?.selected_options,
        text_answer:      answers[q.id]?.text_answer,
      }))
      const { data } = await axios.post(`${BASE}/assessments/attempt/${token}/submit`, { answers: answersArr })
      setResult(data.data)
      setPhase('submitted')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Submission failed.')
    } finally { setSubmitting(false) }
  }

  function setAnswer(qId: string, type: string, value: string) {
    if (type === 'single_choice' || type === 'true_false') {
      setAnswers(prev => ({ ...prev, [qId]: { selected_options: [value] } }))
    } else if (type === 'multi_choice') {
      setAnswers(prev => {
        const curr = prev[qId]?.selected_options ?? []
        const next = curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value]
        return { ...prev, [qId]: { selected_options: next } }
      })
    } else {
      setAnswers(prev => ({ ...prev, [qId]: { text_answer: value } }))
    }
  }

  const timerPct  = (qTimer / SECS_PER_QUESTION) * 100
  const timerRed  = qTimer <= 10
  const timerAmb  = qTimer <= 20 && !timerRed
  const timerColor = timerRed ? '#ef4444' : timerAmb ? '#f59e0b' : '#6366f1'

  const answered = questions.filter(q => {
    const a = answers[q.id]
    return (a?.selected_options?.length ?? 0) > 0 || (a?.text_answer ?? '').trim().length > 0
  }).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Assessment Unavailable</h1>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (phase === 'submitted') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">Assessment Complete!</h1>
        {result ? (
          <>
            <div className="my-6">
              <div className={`text-6xl font-black mb-2 ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                {result.percentage.toFixed(0)}%
              </div>
              <p className="text-slate-500">{result.scored} / {result.totalMarks} marks</p>
            </div>
            <div className={`rounded-xl p-4 mb-6 ${result.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold text-sm ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.passed ? '🎉 You passed! Moving to the next stage.' : 'You did not meet the 80% passing threshold.'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-slate-500 my-6 text-sm">Your assessment has been submitted. Results will be communicated soon.</p>
        )}
        <p className="text-xs text-slate-400">You can safely close this window.</p>
      </div>
    </div>
  )

  if (phase === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg w-full shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{attempt?.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
            <Clock className="h-4 w-4 text-indigo-500" />
            {SECS_PER_QUESTION}s per question
          </span>
          <span className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
            {questions.length} questions
          </span>
          <span className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
            {attempt?.total_marks} total marks
          </span>
        </div>
        {attempt?.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Instructions</p>
            <p className="text-sm text-blue-700 whitespace-pre-line">{attempt.instructions}</p>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Important Rules</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Each question has a <strong>60-second timer</strong> — it auto-advances when time expires</li>
            <li>You cannot go back to a previous question once the timer ran out</li>
            <li>You need <strong>80%</strong> or above to pass</li>
            <li>Ensure stable internet before starting</li>
          </ul>
        </div>
        <button onClick={startTest}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
          Start Assessment →
        </button>
      </div>
    </div>
  )

  // ── Test phase ────────────────────────────────────────────────
  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <p className="font-semibold text-sm text-slate-800">{attempt?.title}</p>
          <p className="text-xs text-slate-400">{answered}/{questions.length} answered</p>
        </div>

        {/* Per-question circular timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPct / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-sm" style={{ color: timerColor }}>{qTimer}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">sec left</p>
        </div>

        <button onClick={() => handleSubmit()} disabled={submitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
          {submitting ? 'Submitting…' : 'Submit Test'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigator */}
        <div className="w-20 border-r bg-white p-3 overflow-y-auto hidden sm:flex flex-col gap-1.5 shadow-sm">
          {questions.map((_, i) => {
            const a    = answers[questions[i].id]
            const done = (a?.selected_options?.length ?? 0) > 0 || (a?.text_answer ?? '').trim().length > 0
            return (
              <button key={i} onClick={() => { setCurrentQ(i); setQTimer(SECS_PER_QUESTION) }}
                className={`h-8 w-full rounded-lg text-xs font-semibold transition-colors ${
                  i === currentQ ? 'bg-indigo-600 text-white shadow-sm'
                  : done ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400 font-medium">Question {currentQ + 1} of {questions.length}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                q.difficulty === 'easy'   ? 'bg-emerald-100 text-emerald-700'
                : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
              }`}>{q.difficulty}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5 shadow-sm">
              <p className="text-[15px] font-semibold text-slate-800 leading-relaxed mb-2">{q.title}</p>
              <p className="text-xs text-indigo-500 font-semibold">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
            </div>

            {/* Options */}
            {(q.question_type === 'single_choice' || q.question_type === 'true_false' || q.question_type === 'multi_choice') && q.options && (
              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isMulti  = q.question_type === 'multi_choice'
                  const selected = isMulti
                    ? (answers[q.id]?.selected_options ?? []).includes(opt)
                    : answers[q.id]?.selected_options?.[0] === opt
                  return (
                    <button key={i} onClick={() => setAnswer(q.id, q.question_type, opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700'
                      }`}>
                      <span className="inline-flex items-center gap-3">
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                        }`}>
                          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        {opt}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Text answer */}
            {(q.question_type === 'short_text' || q.question_type === 'paragraph' || q.question_type === 'scenario' || q.question_type === 'technical' || q.question_type === 'aptitude') && (
              <textarea
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm bg-white resize-none focus:outline-none focus:border-indigo-400 transition-colors"
                rows={q.question_type === 'short_text' ? 3 : 6}
                placeholder="Type your answer here…"
                value={answers[q.id]?.text_answer ?? ''}
                onChange={e => setAnswer(q.id, q.question_type, e.target.value)}
              />
            )}

            {/* Nav */}
            <div className="flex justify-between mt-6">
              <button onClick={() => { setCurrentQ(c => Math.max(0, c - 1)); setQTimer(SECS_PER_QUESTION) }}
                disabled={currentQ === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />Prev
              </button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => { setCurrentQ(c => c + 1); setQTimer(SECS_PER_QUESTION) }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => handleSubmit()} disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                  {submitting ? 'Submitting…' : 'Submit Test ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
