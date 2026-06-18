import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Calendar, Clock, Video, MapPin, Phone } from 'lucide-react'

interface Interview {
  id: string
  round_name: string
  interview_type: string
  mode: string
  scheduled_at: string
  duration_mins: number
  location: string | null
  meeting_link: string | null
  status: string
  feedback: string | null
  rating: number | null
  recommendation: string | null
  full_name: string
  email: string
  profile_photo_url: string | null
  job_title: string
  job_code: string
}

const STATUS_COLOR: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:  'bg-gray-50 text-gray-600 border-gray-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
  no_show:    'bg-orange-50 text-orange-700 border-orange-200',
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) return <img src={photo} className="h-10 w-10 rounded-full object-cover shrink-0" alt={name} />
  const i = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-primary">{i}</span>
    </div>
  )
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('upcoming')

  useEffect(() => {
    setLoading(true)
    api.get('/interviews')
      .then(({ data }) => setInterviews(data.data ?? []))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const filtered = interviews.filter(i => {
    const d = new Date(i.scheduled_at)
    if (dateFilter === 'upcoming') return d >= now && i.status === 'scheduled'
    if (dateFilter === 'today') return d.toDateString() === now.toDateString()
    if (dateFilter === 'past') return d < now || ['completed','cancelled','no_show'].includes(i.status)
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-muted-foreground text-sm">{interviews.length} scheduled</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {[['upcoming','Upcoming'],['today','Today'],['past','Completed'],['all','All']] .map(([v, l]) => (
          <button key={v} onClick={() => setDateFilter(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${dateFilter === v ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No interviews found</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule interviews from the Applications page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(iv => {
            const dt = new Date(iv.scheduled_at)
            const ModeIcon = iv.mode === 'online' ? Video : iv.mode === 'phone' ? Phone : MapPin
            return (
              <div key={iv.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className="text-center min-w-16">
                  <p className="text-xs text-muted-foreground">{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  <p className="font-bold text-lg">{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-xs text-muted-foreground">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                </div>
                <div className="w-px h-12 bg-border shrink-0" />
                <Avatar name={iv.full_name} photo={iv.profile_photo_url} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{iv.full_name}</p>
                  <p className="text-sm text-muted-foreground">{iv.job_title} · {iv.round_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{iv.duration_mins} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                      <ModeIcon className="h-3 w-3" />{iv.mode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {iv.meeting_link && (
                    <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer"
                       className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Join Meeting
                    </a>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${STATUS_COLOR[iv.status] ?? 'bg-muted text-muted-foreground border-muted'}`}>
                    {iv.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
