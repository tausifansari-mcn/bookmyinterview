import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Phone, Mail, MapPin, Briefcase, Calendar, CheckCircle2 } from 'lucide-react'

export default function CandidateDetailPage() {
  const { id } = useParams()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/candidates" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-xl font-bold">Rahul Sharma</h1>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">HR Round</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile */}
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700 mb-3">RS</div>
            <h2 className="font-bold text-lg">Rahul Sharma</h2>
            <p className="text-sm text-muted-foreground">Sr. Customer Care Executive Applicant</p>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { icon: Phone,    label: '9876543210' },
              { icon: Mail,     label: 'rahul@gmail.com' },
              { icon: MapPin,   label: 'Mumbai, Maharashtra' },
              { icon: Briefcase,label: '2.5 years experience' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t space-y-2">
            <button className="w-full text-sm bg-primary text-white py-2 rounded-lg hover:bg-primary/90">Schedule Interview</button>
            <button className="w-full text-sm border py-2 rounded-lg hover:bg-accent">Send Offer</button>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold">AI Analysis</h2>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-brand-600">82%</div>
            <p className="text-sm text-muted-foreground">Match Score</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Communication',  score: 85 },
              { label: 'Experience Fit', score: 78 },
              { label: 'Skill Match',    score: 90 },
              { label: 'Culture Fit',    score: 75 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.score}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-brand-50 rounded-lg">
            <p className="text-xs text-brand-800">
              <strong>AI Summary:</strong> Strong candidate with good communication skills. 2.5 years relevant BPO experience. Slightly below expected on technical skills but compensated by attitude scores.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Application Timeline</h2>
          <div className="space-y-3">
            {[
              { stage: 'Applied',      date: '14 Jun',  done: true },
              { stage: 'AI Screened',  date: '14 Jun',  done: true },
              { stage: 'HR Round',     date: '15 Jun',  done: true, active: true },
              { stage: 'Ops Round',    date: '—',       done: false },
              { stage: 'Offer',        date: '—',       done: false },
              { stage: 'Joined',       date: '—',       done: false },
            ].map(s => (
              <div key={s.stage} className={`flex items-center gap-3 ${s.active ? 'text-primary font-medium' : s.done ? '' : 'text-muted-foreground'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${s.done ? s.active ? 'text-primary' : 'text-green-500' : 'text-muted-foreground/30'}`} />
                <span className="flex-1 text-sm">{s.stage}</span>
                <span className="text-xs">{s.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
