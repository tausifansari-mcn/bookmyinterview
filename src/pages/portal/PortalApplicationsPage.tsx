import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { Sparkles, FileText, Briefcase, MapPin, ArrowLeft, Loader2, LogOut, Home } from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:          { label: 'Under Review',    color: 'bg-blue-100 text-blue-700' },
  selected:        { label: 'Selected',         color: 'bg-green-100 text-green-700' },
  rejected:        { label: 'Not Selected',     color: 'bg-red-100 text-red-700' },
  withdrawn:       { label: 'Withdrawn',        color: 'bg-gray-100 text-gray-600' },
  on_hold:         { label: 'On Hold',          color: 'bg-yellow-100 text-yellow-700' },
  offer_extended:  { label: 'Offer Extended',   color: 'bg-purple-100 text-purple-700' },
  offer_accepted:  { label: 'Offer Accepted',   color: 'bg-green-100 text-green-800' },
  offer_declined:  { label: 'Offer Declined',   color: 'bg-orange-100 text-orange-700' },
  joined:          { label: 'Joined',           color: 'bg-emerald-100 text-emerald-700' },
}

export default function PortalApplicationsPage() {
  const { candidate, logout } = useCandidateAuth()
  const navigate = useNavigate()
  const [apps, setApps]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!candidate) { navigate('/portal/login'); return }
    portalApi.get('/applications')
      .then(r => setApps(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [candidate])

  function handleLogout() { logout(); navigate('/portal/login') }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/portal/dashboard" className="text-gray-400 hover:text-gray-600">
              <Home className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">My Applications</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{candidate?.full_name}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 p-1" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track the status of all your job applications</p>
          </div>
          <Link to="/portal/jobs"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >Browse Jobs</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-900 mb-1">No applications yet</p>
            <p className="text-sm text-gray-500 mb-4">Start applying to jobs that match your profile</p>
            <Link to="/portal/jobs"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Briefcase className="h-4 w-4" /> Browse Open Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => {
              const s = STATUS_LABEL[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-0.5">{app.job_title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                        {app.department_name && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{app.department_name}</span>}
                        {app.location_city   && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.location_city}</span>}
                        <span>Applied {formatDate(app.applied_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                        <span className="text-xs text-gray-400">Stage: {app.current_stage_name}</span>
                        {app.ai_match_score && (
                          <span className="text-xs text-indigo-600 font-medium">AI Match: {app.ai_match_score}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
