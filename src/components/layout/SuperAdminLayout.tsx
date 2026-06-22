import { useEffect, useState, useRef } from 'react'
import { Outlet, Navigate, NavLink, useNavigate, Link } from 'react-router-dom'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import {
  LayoutDashboard, Building2, Users, Settings,
  LogOut, ChevronDown, Menu, X, Moon, Sun, Video, BookOpen,
  Bell, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { superAdminApi } from '@/lib/superAdminApi'

interface NavItem { to: string; icon: React.ElementType; label: string; short: string }

const NAV: NavItem[] = [
  { to: '/super-admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    short: 'Home'    },
  { to: '/super-admin/interviews',   icon: Video,           label: 'Interviews',   short: 'IV'      },
  { to: '/super-admin/question-bank',icon: BookOpen,        label: 'Question Bank',short: 'QB'      },
  { to: '/super-admin/clients',      icon: Building2,       label: 'Clients',      short: 'Clients' },
  { to: '/super-admin/candidates',   icon: Users,           label: 'Candidates',   short: 'People'  },
]

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return '—'
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function SuperAdminLayout() {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<{ id: string; message: string; status: string; created_at: string; company_name: string }[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    setNotifLoading(true)
    superAdminApi.get('/notifications?page=1&limit=8')
      .then(r => setNotifs(r.data?.data?.notifications ?? []))
      .catch(() => {})
      .finally(() => setNotifLoading(false))
  }, [])

  if (!admin) return <Navigate to="/super-admin/login" replace />

  function handleLogout() { logout(); navigate('/super-admin/login'); setProfileOpen(false) }

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bmi_dark_mode', next ? '1' : '0')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: logo + brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src="/mas-call-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white hidden sm:block">
              Super Admin
            </span>
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, icon: Icon, label }) => (
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
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button onClick={() => setNotifOpen(o => !o)}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative">
                <Bell className="h-4 w-4" />
                {notifs.filter(n => n.status === 'sent').length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                    {notifs.filter(n => n.status === 'sent').length > 0 && (
                      <span className="text-[11px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                        {notifs.filter(n => n.status === 'sent').length} unread
                      </span>
                    )}
                  </div>
                  {notifLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    </div>
                  ) : notifs.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-400">No notifications</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
                      {notifs.map(n => {
                        const isUnread = n.status === 'sent'
                        return (
                          <div key={n.id} className={`px-4 py-3 ${isUnread ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                            <p className={`text-xs leading-snug ${isUnread ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{n.company_name} · {timeAgo(n.created_at)}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {admin ? getInitials(admin.full_name) : 'A'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {admin?.full_name?.split(' ')[0] ?? 'Admin'}
                </span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-400 transition-transform', profileOpen && 'rotate-180')} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{admin?.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{admin?.email}</p>
                  </div>

                  <Link to="/super-admin/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
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
