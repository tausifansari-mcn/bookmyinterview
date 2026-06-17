import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, Users, FileText,
  Calendar, Gift, ClipboardCheck, BarChart2,
  Settings, Sparkles, UserCog,
} from 'lucide-react'

const nav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    roles: null },
  { to: '/jobs',         icon: Briefcase,        label: 'Jobs',         roles: null },
  { to: '/candidates',   icon: Users,            label: 'Candidates',   roles: null },
  { to: '/applications', icon: FileText,         label: 'Applications', roles: null },
  { to: '/interviews',   icon: Calendar,         label: 'Interviews',   roles: null },
  { to: '/offers',       icon: Gift,             label: 'Offers',       roles: null },
  { to: '/assessments',  icon: ClipboardCheck,   label: 'Assessments',  roles: null },
  { to: '/analytics',    icon: BarChart2,        label: 'Analytics',    roles: null },
  { to: '/users',        icon: UserCog,          label: 'Team',         roles: ['super_admin','admin','hr_manager'] },
  { to: '/settings',     icon: Settings,         label: 'Settings',     roles: null },
]

export default function Sidebar() {
  const { user } = useAuth()
  const userRole = user?.role ?? ''

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="flex items-center gap-2 p-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">Book My Interview</p>
          <p className="text-xs text-muted-foreground mt-0.5">AI Hiring OS</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav
          .filter(({ roles }) => !roles || roles.includes(userRole))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="p-3 border-t">
        <div className="rounded-lg bg-brand-50 p-3">
          <p className="text-xs font-medium text-brand-700">AI Credits</p>
          <p className="text-lg font-bold text-brand-900">850 left</p>
          <div className="mt-1 h-1.5 rounded-full bg-brand-200">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: '85%' }} />
          </div>
        </div>
      </div>
    </aside>
  )
}
