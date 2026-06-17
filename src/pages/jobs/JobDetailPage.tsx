import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, Clock, Sparkles, Plus } from 'lucide-react'

const stages = ['Applied', 'AI Screened', 'HR Round', 'Ops Round', 'Offer', 'Joined']

const pipeline: Record<string, { id: string; name: string; score?: number; status: string }[]> = {
  'Applied':     [{ id: '1', name: 'Rahul Sharma', score: 82, status: 'applied' }, { id: '2', name: 'Priya Mehta', score: 75, status: 'applied' }],
  'AI Screened': [{ id: '3', name: 'Amit Kumar', score: 91, status: 'screened' }],
  'HR Round':    [{ id: '4', name: 'Sneha Patel', status: 'hr_round' }],
  'Ops Round':   [],
  'Offer':       [{ id: '5', name: 'Vikram Singh', status: 'offer' }],
  'Joined':      [],
}

export default function JobDetailPage() {
  const { id } = useParams()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/jobs" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-xl font-bold">Sr. Customer Care Executive</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Mumbai</span>
            <span>Operations</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />25 openings</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />3 days open</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-1.5 text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-medium hover:bg-brand-100 border border-brand-200">
            <Sparkles className="h-4 w-4" /> Run AI Screen
          </button>
          <button className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map(stage => (
          <div key={stage} className="min-w-[200px] flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</p>
              <span className="text-xs bg-muted rounded-full px-2 py-0.5">{pipeline[stage]?.length ?? 0}</span>
            </div>
            <div className="space-y-2">
              {(pipeline[stage] ?? []).map(c => (
                <Link key={c.id} to={`/candidates/${c.id}`} className="block bg-card border rounded-lg p-3 hover:border-primary/40 hover:shadow-sm transition-all">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.score !== undefined && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Sparkles className="h-3 w-3 text-brand-500" />
                      <span className="text-xs font-semibold text-brand-700">{c.score}% match</span>
                    </div>
                  )}
                </Link>
              ))}
              {(pipeline[stage]?.length ?? 0) === 0 && (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                  Drop candidates here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
