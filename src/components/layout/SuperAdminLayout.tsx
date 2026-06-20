import { useEffect, useState } from 'react'
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { IconSidebar, NavItem } from '@/components/layout/IconSidebar'
import { LayoutDashboard, Building2, Users, Settings, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: NavItem[] = [
  { to: '/super-admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard',   short: 'Home'    },
  { to: '/super-admin/clients',    icon: Building2,       label: 'Clients',     short: 'Clients' },
  { to: '/super-admin/candidates', icon: Users,           label: 'Candidates',  short: 'People'  },
  { to: '/super-admin/analytics',  icon: BarChart3,       label: 'Analytics',   short: 'Stats'   },
  { to: '/super-admin/settings',   icon: Settings,        label: 'Settings',    short: 'Config'  },
]

export default function SuperAdminLayout() {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('bmi_dark_mode') === '1') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (!admin) return <Navigate to="/super-admin/login" replace />

  function handleLogout() { logout(); navigate('/super-admin/login') }

  return (
    <div className="min-h-screen bg-[#f8f8f7] dark:bg-zinc-950 flex">
      <IconSidebar
        navItems={NAV}
        userName={admin.full_name ?? 'Admin'}
        userEmail={admin.email ?? ''}
        onLogout={handleLogout}
        brandLabel="Super Admin"
        onOpenChange={setSidebarOpen}
      />

      <div className={cn("flex-1 flex flex-col min-h-screen transition-[padding] duration-200 ease-in-out", sidebarOpen ? "md:pl-[220px]" : "md:pl-[52px]")}>
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
