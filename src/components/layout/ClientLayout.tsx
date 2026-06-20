import { useEffect, useState } from 'react'
import { Outlet, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useClientAuth } from '@/contexts/ClientAuthContext'
import { IconSidebar, NavItem } from '@/components/layout/IconSidebar'
import { NotificationItem } from '@/components/ui/NotificationPanel'
import { LayoutDashboard, Briefcase, Users, FileText, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: NavItem[] = [
  { to: '/client/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    short: 'Home'   },
  { to: '/client/jobs',         icon: Briefcase,       label: 'Jobs',         short: 'Jobs'   },
  { to: '/client/applications', icon: FileText,        label: 'Applications', short: 'Apps'   },
  { to: '/client/candidates',   icon: Users,           label: 'Candidates',   short: 'People' },
  { to: '/client/assessments',  icon: ClipboardCheck,  label: 'Assessments',  short: 'Assess' },
]

export default function ClientLayout() {
  const { client, tenant, logout } = useClientAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [notifs]  = useState<NotificationItem[]>([])

  useEffect(() => {
    if (localStorage.getItem('bmi_dark_mode') === '1') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (!client) return <Navigate to="/client/login" replace />
  if (tenant && !tenant.onboarding_completed && location.pathname !== '/client/onboarding') {
    return <Navigate to="/client/onboarding" replace />
  }

  function handleLogout() { logout(); navigate('/client/login') }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex">
      <IconSidebar
        navItems={NAV}
        userName={client.full_name ?? 'User'}
        userEmail={client.email ?? ''}
        onLogout={handleLogout}
        brandLabel={tenant?.company_name ?? 'Book My Interview'}
        logoSrc={tenant?.logo_url ?? undefined}
        notificationItems={notifs}
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
