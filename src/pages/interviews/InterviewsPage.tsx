import { Calendar } from 'lucide-react'

const interviews = [
  { candidate: 'Rahul Sharma',  job: 'Sr. CCE',         time: '10:00 AM', date: '2026-06-17', type: 'HR Round',  status: 'scheduled' },
  { candidate: 'Amit Kumar',    job: 'Team Leader',      time: '11:30 AM', date: '2026-06-17', type: 'Ops Round', status: 'scheduled' },
  { candidate: 'Sneha Patel',   job: 'Quality Analyst',  time: '2:00 PM',  date: '2026-06-17', type: 'HR Round',  status: 'confirmed' },
]

const statusColor: Record<string,string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  confirmed:  'bg-green-50 text-green-700',
  completed:  'bg-gray-50 text-gray-600',
}

export default function InterviewsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
          <Calendar className="h-4 w-4" /> Schedule Interview
        </button>
      </div>
      <div className="grid gap-3">
        {interviews.map((i, idx) => (
          <div key={idx} className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="text-center min-w-[60px]">
              <p className="text-xs text-muted-foreground">Jun 17</p>
              <p className="font-bold text-lg">{i.time.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">{i.time.split(' ')[1]}</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="flex-1">
              <p className="font-medium">{i.candidate}</p>
              <p className="text-sm text-muted-foreground">{i.job} · {i.type}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[i.status]}`}>{i.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
