import { useEffect } from 'react'
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { IconSidebar, NavItem } from '@/components/layout/IconSidebar'
import { LayoutDashboard, Briefcase, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: NavItem[] = [
  { to: '/portal/dashboard',    icon: LayoutDashboard, label: 'Dashboard',       short: 'Home'  },
  { to: '/portal/jobs',         icon: Briefcase,       label: 'Browse Jobs',     short: 'Jobs'  },
  { to: '/portal/applications', icon: FileText,        label: 'My Applications', short: 'Apps'  },
  { to: '/portal/profile',      icon: User,            label: 'My Profile',      short: 'Me'    },
]

export default function PortalLayout() {
  const { candidate, logout } = useCandidateAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('bmi_dark_mode') === '1') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (!candidate) return <Navigate to="/portal/login" replace />

  function handleLogout() { logout(); navigate('/portal/login') }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex">
      <IconSidebar
        navItems={NAV}
        userName={candidate.full_name ?? 'Candidate'}
        userEmail={candidate.email ?? ''}
        onLogout={handleLogout}
        brandLabel="Book My Interview"
      />

      <div className="flex-1 md:pl-[52px] flex flex-col min-h-screen">
        <main className="flex-1 px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14">
          {NAV.map(({ to, icon: Icon, short }) => (
            <NavLink
              key={to}
              to={to}
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
