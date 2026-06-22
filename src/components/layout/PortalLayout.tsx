import { useEffect, useState, useRef } from 'react'
import { Outlet, NavLink, Navigate, useNavigate, Link, useLocation } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import CandidateLandingPage from '@/pages/portal/CandidateLandingPage'
import {
  LayoutDashboard, Briefcase, FileText, User, Loader2, LogOut,
  ChevronDown, Moon, Sun, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string; icon: React.ElementType; label: string; short: string
}

const NAV: NavItem[] = [
  { to: '/portal/dashboard',    icon: LayoutDashboard, label: 'Dashboard',       short: 'Home'  },
  { to: '/portal/jobs',         icon: Briefcase,       label: 'Browse Jobs',     short: 'Jobs'  },
  { to: '/portal/applications', icon: FileText,        label: 'My Applications', short: 'Apps'  },
]

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function PortalLayout() {
  const { candidate, loading, logout } = useCandidateAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const profileRef = useRef<HTMLDivElement>(null)

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

  function handleLogout() {
    logout(); navigate('/portal'); setProfileOpen(false)
  }

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bmi_dark_mode', next ? '1' : '0')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!candidate) {
    if (location.pathname === '/portal' || location.pathname === '/portal/') {
      return <CandidateLandingPage />
    }
    return <Navigate to="/portal/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: logo + brand */}
          <Link to="/portal" className="flex items-center gap-2.5 shrink-0">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white hidden sm:block">Book My Interview</span>
          </Link>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-500' : '')} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2">

            {/* Dark mode toggle (desktop) */}
            <button onClick={toggleDark}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {getInitials(candidate.full_name ?? 'C')}
                </div>
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {candidate.full_name?.split(' ')[0] ?? 'User'}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{candidate.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{candidate.email}</p>
                  </div>

                  <Link to="/portal/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <User className="h-4 w-4" />
                    My Profile
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
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
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
                  isActive ? 'text-indigo-600' : 'text-zinc-400')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-zinc-400')} />
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
