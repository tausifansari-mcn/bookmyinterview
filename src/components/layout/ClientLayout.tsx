import { useEffect, useState, useRef } from 'react'
import { Outlet, NavLink, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import ClientLandingPage from '@/pages/client/ClientLandingPage'
import { clientApi } from '@/lib/clientApi'
import {
  LayoutDashboard, Briefcase, FileText,
  Building2, Settings, LogOut, ChevronDown, Menu, X, Moon, Sun,
  Camera, Loader2, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string; icon: React.ElementType; label: string; short: string
}

const NAV: NavItem[] = [
  { to: '/client/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    short: 'Home' },
  { to: '/client/jobs',         icon: Briefcase,       label: 'Post a Job',   short: 'Jobs' },
  { to: '/client/applications', icon: FileText,        label: 'Applications', short: 'Apps' },
]

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function ClientLayout() {
  const { client, tenant, logout, updateClient } = useClientAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [uploading, setUploading] = useState(false)
  const [photoMsg, setPhotoMsg] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (localStorage.getItem('bmi_dark_mode') === '1') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (!client) {
    if (location.pathname === '/client' || location.pathname === '/client/') {
      return <ClientLandingPage />
    }
    return <Navigate to="/client/login" replace />
  }
  if (tenant && !tenant.onboarding_completed && location.pathname !== '/client/onboarding') {
    return <Navigate to="/client/onboarding" replace />
  }

  function handleLogout() { logout(); navigate('/client/login'); setProfileOpen(false) }

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bmi_dark_mode', next ? '1' : '0')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setPhotoMsg('')
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await clientApi.post('/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateClient({ avatar_url: data.data.url })
      setPhotoMsg('Photo updated!')
      setTimeout(() => setPhotoMsg(''), 3000)
    } catch {
      setPhotoMsg('Upload failed')
      setTimeout(() => setPhotoMsg(''), 3000)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: logo + brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={tenant?.logo_url || '/logo.png'} alt="" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white hidden sm:block">
              {tenant?.company_name || 'Book My Interview'}
            </span>
          </div>

          {/* Center: nav links (desktop, scrollable if needed) */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center px-4">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-4 w-4', isActive ? 'text-amber-500' : '')} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 ring-2 ring-zinc-100 dark:ring-zinc-800">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br from-amber-500 to-orange-600">
                      {getInitials(client.full_name ?? 'U')}
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {client.full_name?.split(' ')[0] ?? 'User'}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50">
                  {/* User info + avatar upload */}
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-3">
                    <div className="relative group shrink-0">
                      <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-zinc-100 dark:ring-zinc-800">
                        {client.avatar_url ? (
                          <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-amber-500 to-orange-600">
                            {getInitials(client.full_name ?? 'U')}
                          </div>
                        )}
                      </div>
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading
                          ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                          : <Camera className="h-4 w-4 text-white" />}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={handlePhotoUpload} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{client.full_name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{client.email}</p>
                      {photoMsg && (
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium mt-1',
                          photoMsg === 'Photo updated!' ? 'text-emerald-600' : 'text-red-500')}>
                          {photoMsg === 'Photo updated!' ? <CheckCircle2 className="h-3 w-3" /> : null}
                          {photoMsg}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to="/client/company-profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                    <Building2 className="h-4 w-4" />
                    Company Profile
                  </Link>

                  <Link to="/client/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <button onClick={toggleDark}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileNavOpen(o => !o)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <nav className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 space-y-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            {/* Mobile-only: Company Profile & Settings */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1 mt-1">
              <Link to="/client/company-profile" onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Building2 className="h-4 w-4" />
                Company Profile
              </Link>
              <Link to="/client/settings" onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex h-14">
          {NAV.map(({ to, icon: Icon, short }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                cn('flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                  isActive ? 'text-amber-600' : 'text-zinc-400')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive ? 'text-amber-600' : 'text-zinc-400')} />
                  <span className="text-[9px] font-semibold">{short}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="md:hidden" style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }} />
    </div>
  )
}
