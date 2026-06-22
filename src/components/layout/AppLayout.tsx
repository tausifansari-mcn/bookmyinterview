import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, Users, FileText, Calendar, Gift, ClipboardCheck,
  BarChart2, UserCog, Settings, LogOut, ChevronDown, Menu, X, Moon, Sun, MoreHorizontal,
} from 'lucide-react'

interface NavItem {
  to: string; icon: React.ElementType; label: string
}

const NAV: NavItem[] = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/jobs',         icon: Briefcase,       label: 'Jobs'         },
  { to: '/candidates',   icon: Users,           label: 'Candidates'   },
  { to: '/applications', icon: FileText,        label: 'Applications' },
  { to: '/interviews',   icon: Calendar,        label: 'Interviews'   },
  { to: '/offers',       icon: Gift,            label: 'Offers'       },
  { to: '/assessments',  icon: ClipboardCheck,  label: 'Assessments'  },
  { to: '/analytics',    icon: BarChart2,       label: 'Analytics'    },
  { to: '/users',        icon: UserCog,         label: 'Team'         },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [moreOpen, setMoreOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const userRole = user?.role ?? ''

  // Items visible in top bar + overflow
  const visibleItems = NAV.filter(item => {
    if (item.to === '/users') return ['super_admin', 'admin', 'hr_manager'].includes(userRole)
    return true
  })

  // Show first 5, rest in "More"
  const MAX_VISIBLE = 5
  const primaryItems = visibleItems.slice(0, MAX_VISIBLE)
  const moreItems = visibleItems.slice(MAX_VISIBLE)

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bmi_dark_mode', next ? '1' : '0')
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-zinc-950 flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: logo + brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="Book My Interview" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white hidden sm:block">Book My Interview</span>
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
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

            {/* More dropdown */}
            {moreItems.length > 0 && (
              <div ref={moreRef} className="relative">
                <button onClick={() => setMoreOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                  <ChevronDown className={cn('h-3 w-3 transition-transform', moreOpen && 'rotate-180')} />
                </button>
                {moreOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50">
                    {moreItems.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) => cn(
                          'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dark mode toggle */}
            <button onClick={toggleDark}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                      {user ? getInitials(user.full_name) : '?'}
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {user?.full_name?.split(' ')[0] ?? 'User'}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate capitalize">{user?.role?.replace(/_/g, ' ')}</p>
                  </div>

                  <NavLink to="/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                  </NavLink>

                  <button onClick={toggleDark}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                    <button onClick={() => { logout(); navigate('/login'); setProfileOpen(false) }}
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
          <nav className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 space-y-1 max-h-80 overflow-y-auto">
            {visibleItems.map(({ to, icon: Icon, label }) => (
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto px-6 py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
