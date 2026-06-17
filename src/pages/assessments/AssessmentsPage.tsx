import { ClipboardCheck, Sparkles, Plus } from 'lucide-react'

const assessments = [
  { title: 'BPO Aptitude Test',     type: 'MCQ',    duration: 30, questions: 25, pass_pct: 60, used: 48 },
  { title: 'Communication Skills',  type: 'MCQ',    duration: 20, questions: 15, pass_pct: 70, used: 32 },
  { title: 'Customer Handling',     type: 'mcq',    duration: 25, questions: 20, pass_pct: 65, used: 21 },
]

export default function AssessmentsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 text-sm border px-3 py-2 rounded-lg hover:bg-accent">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Assessment
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        {assessments.map((a, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 flex items-center gap-5">
            <div className="p-3 bg-brand-50 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.type} · {a.questions} questions · {a.duration} min · Pass: {a.pass_pct}%</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{a.used}</p>
              <p className="text-xs text-muted-foreground">attempts</p>
            </div>
            <button className="text-sm text-primary font-medium hover:underline">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}
