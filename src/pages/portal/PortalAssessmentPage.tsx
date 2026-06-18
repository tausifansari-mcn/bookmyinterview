import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

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

const baseURL = '/api/v1'

export default function PortalAssessmentPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [phase, setPhase] = useState<'instructions' | 'test' | 'submitted'>('instructions')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ scored: number; totalMarks: number; percentage: number; passed: boolean } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    axios.get(`${baseURL}/assessments/attempt/${token}`).then(({ data }) => {
      setAttempt(data.data.attempt)
      setQuestions(data.data.questions.map((q: any) => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
      })))
      setTimeLeft(data.data.attempt.time_limit_mins * 60)
      if (data.data.attempt.status === 'completed') setPhase('submitted')
    }).catch(e => {
      setError(e?.response?.data?.message ?? 'Invalid or expired assessment link.')
    }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (phase !== 'test') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  async function startTest() {
    try {
      await axios.post(`${baseURL}/assessments/attempt/${token}/start`)
      setPhase('test')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to start assessment.')
    }
  }

  async function handleSubmit(auto = false) {
    if (!auto && !confirm('Submit assessment? You cannot change answers after submitting.')) return
    clearInterval(timerRef.current!)
    setSubmitting(true)
    try {
      const answersArr = questions.map(q => ({
        question_id: q.id,
        selected_options: answers[q.id]?.selected_options,
        text_answer: answers[q.id]?.text_answer,
      }))
      const { data } = await axios.post(`${baseURL}/assessments/attempt/${token}/submit`, { answers: answersArr })
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

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const timerColor = timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-amber-600' : 'text-foreground'

  const answered = questions.filter(q => {
    const a = answers[q.id]
    return (a?.selected_options?.length ?? 0) > 0 || (a?.text_answer ?? '').trim().length > 0
  }).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border rounded-xl p-8 max-w-md w-full text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Assessment Unavailable</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    </div>
  )

  if (phase === 'submitted') return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border rounded-xl p-8 max-w-md w-full text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Assessment Submitted!</h1>
        {result ? (
          <>
            <div className="my-6">
              <div className={`text-5xl font-bold mb-2 ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.percentage.toFixed(0)}%
              </div>
              <p className="text-muted-foreground">{result.scored} / {result.totalMarks} marks</p>
            </div>
            <div className={`rounded-xl p-4 mb-6 ${result.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.passed ? 'Congratulations! You passed the assessment.' : 'Unfortunately, you did not meet the passing criteria.'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground my-6">Your assessment has been submitted successfully. Results will be communicated to you.</p>
        )}
        <p className="text-sm text-muted-foreground">You can now close this window.</p>
      </div>
    </div>
  )

  if (phase === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border rounded-xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-2">{attempt?.title}</h1>
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{attempt?.time_limit_mins} minutes</span>
          <span>{questions.length} questions</span>
          <span>{attempt?.total_marks} marks</span>
        </div>
        {attempt?.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-blue-800 mb-1">Instructions</p>
            <p className="text-sm text-blue-700 whitespace-pre-line">{attempt.instructions}</p>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">Important</p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Ensure stable internet before starting</li>
            <li>Timer starts as soon as you click "Start Test"</li>
            <li>You cannot pause or restart once started</li>
            <li>Complete all questions before time runs out</li>
          </ul>
        </div>
        <button onClick={startTest} className="w-full py-3 bg-primary text-white rounded-lg font-semibold">
          Start Test →
        </button>
      </div>
    </div>
  )

  // Test phase
  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-semibold text-sm">{attempt?.title}</p>
          <p className="text-xs text-muted-foreground">{answered}/{questions.length} answered</p>
        </div>
        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
          <Clock className="h-5 w-5" />{mm}:{ss}
        </div>
        <button
          onClick={() => handleSubmit()}
          disabled={submitting}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigator */}
        <div className="w-20 border-r bg-card p-3 overflow-y-auto hidden sm:flex flex-col gap-1.5">
          {questions.map((_, i) => {
            const a = answers[questions[i].id]
            const done = (a?.selected_options?.length ?? 0) > 0 || (a?.text_answer ?? '').trim().length > 0
            return (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`h-8 w-full rounded text-xs font-medium transition-colors ${i === currentQ ? 'bg-primary text-white' : done ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-muted hover:bg-muted/80'}`}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>
            </div>

            <div className="bg-card border rounded-xl p-6 mb-6">
              <p className="text-base font-medium mb-1">{q.title}</p>
              <p className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
            </div>

            {/* Single/Multi Choice */}
            {(q.question_type === 'single_choice' || q.question_type === 'true_false' || q.question_type === 'multi_choice') && q.options && (
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isMulti = q.question_type === 'multi_choice'
                  const selected = isMulti
                    ? (answers[q.id]?.selected_options ?? []).includes(opt)
                    : answers[q.id]?.selected_options?.[0] === opt
                  return (
                    <button key={i} onClick={() => setAnswer(q.id, q.question_type, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}>
                      <span className="text-sm">{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Text answer */}
            {(q.question_type === 'short_text' || q.question_type === 'paragraph' || q.question_type === 'scenario' || q.question_type === 'technical' || q.question_type === 'aptitude') && (
              <textarea
                className="w-full border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={q.question_type === 'short_text' ? 3 : 6}
                placeholder="Type your answer here..."
                value={answers[q.id]?.text_answer ?? ''}
                onChange={e => setAnswer(q.id, q.question_type, e.target.value)}
              />
            )}

            {/* Nav */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(c => c + 1)}
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm">
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => handleSubmit()} disabled={submitting}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
