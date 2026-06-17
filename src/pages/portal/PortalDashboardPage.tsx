import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { portalApi } from '@/lib/portalApi'
import {
  User, Briefcase, FileText, Star, ChevronRight, AlertCircle, CheckCircle2,
  Sparkles, LogOut, Settings
} from 'lucide-react'

interface CompletionItem {
  label: string; pct: number; done: boolean
}
interface Completion {
  profile_completion: number
  breakdown: Record<string, CompletionItem>
}

interface Application {
  id: string; job_title: string; job_type: string; current_stage_name: string
  status: string; applied_at: string; ai_match_score: number | null
}

const STATUS_COLORS: Record<string, string> = {
  active:         'bg-blue-100 text-blue-700',
  selected:       'bg-green-100 text-green-700',
  rejected:       'bg-red-100 text-red-700',
  on_hold:        'bg-yellow-100 text-yellow-700',
  offer_extended: 'bg-purple-100 text-purple-700',
  offer_accepted: 'bg-green-200 text-green-800',
  withdrawn:      'bg-gray-100 text-gray-600',
}

export default function PortalDashboardPage() {
  const { candidate, logout } = useCandidateAuth()
  const [completion, setCompletion]   = useState<Completion | null>(null)
  const [applications, setApps]       = useState<Application[]>([])
  const [loadingComp, setLoadingComp] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)

  useEffect(() => {
    portalApi.get('/me/completion').then(r => setCompletion(r.data.data)).finally(() => setLoadingComp(false))
    portalApi.get('/applications').then(r => setApps(r.data.data)).finally(() => setLoadingApps(false))
  }, [])

  const pct = completion?.profile_completion ?? 0
  const breakdown = completion ? Object.values(completion.breakdown) : []
  const completedItems = breakdown.filter(i => i.done).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Book My Interview</span>
            <span className="text-gray-300 text-sm">|</span>
            <span className="text-gray-500 text-sm">Candidate Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/portal/jobs" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Jobs</Link>
            <Link to="/portal/applications" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Applications</Link>
            <Link to="/portal/profile" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100">Profile</Link>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <p className="text-indigo-200 text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold">{candidate?.full_name ?? 'Candidate'}</h1>
          <p className="text-indigo-200 text-sm mt-1">{candidate?.email}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Completion */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Profile Completion</h2>
              <Link to="/portal/profile" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Complete Profile <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingComp ? (
              <div className="h-20 flex items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-indigo-600'}`}>
                    {pct}%
                  </span>
                </div>

                {pct === 100 ? (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="h-4 w-4" /> Congratulations! Your profile is 100% complete.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">
                    {completedItems} of {breakdown.length} sections completed
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {breakdown.map(item => (
                    <div key={item.label} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {item.done
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        : <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      <span>{item.label}</span>
                      <span className="ml-auto text-xs font-medium">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{loadingApps ? '…' : applications.length}</p>
                </div>
              </div>
              <Link to="/portal/applications" className="text-xs text-indigo-600 hover:underline">View all →</Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="h-4.5 w-4.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shortlisted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingApps ? '…' : applications.filter(a => a.status === 'selected').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Profile Score</p>
                  <p className="text-2xl font-bold text-gray-900">{pct}%</p>
                </div>
              </div>
              <Link to="/portal/profile" className="text-xs text-indigo-600 hover:underline">Edit profile →</Link>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/portal/applications" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>

          {loadingApps ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No applications yet.</p>
              <Link to="/portal/jobs" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Browse jobs →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{app.job_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Stage: {app.current_stage_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.ai_match_score != null && (
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        AI: {app.ai_match_score}%
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {app.status.replace(/_/g,' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/portal/jobs" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Browse Jobs</p>
              <p className="text-xs text-gray-500">Find your next opportunity</p>
            </div>
          </Link>

          <Link to="/portal/profile" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Edit Profile</p>
              <p className="text-xs text-gray-500">Update your information</p>
            </div>
          </Link>

          <Link to="/portal/applications" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Track Applications</p>
              <p className="text-xs text-gray-500">See your application status</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
