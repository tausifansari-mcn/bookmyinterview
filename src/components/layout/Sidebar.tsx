import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Briefcase, Users, FileText,
  Calendar, Gift, ClipboardCheck, BarChart2,
  Settings, UserCog, LogOut, Zap,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    roles: null },
      { to: '/jobs',         icon: Briefcase,        label: 'Jobs',         roles: null },
      { to: '/candidates',   icon: Users,            label: 'Candidates',   roles: null },
      { to: '/applications', icon: FileText,         label: 'Applications', roles: null },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { to: '/interviews',  icon: Calendar,      label: 'Interviews',  roles: null },
      { to: '/offers',      icon: Gift,          label: 'Offers',      roles: null },
      { to: '/assessments', icon: ClipboardCheck, label: 'Assessments', roles: null },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/analytics', icon: BarChart2, label: 'Analytics', roles: null },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/users',    icon: UserCog, label: 'Team',     roles: ['super_admin', 'admin', 'hr_manager'] },
      { to: '/settings', icon: Settings, label: 'Settings', roles: null },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const userRole = user?.role ?? ''

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col select-none"
      style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-[18px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}
        >
          <Zap className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white leading-none tracking-tight truncate">
            BookMyInterview
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#475569' }}>
            AI Hiring OS
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(
            (item) => !item.roles || item.roles.includes(userRole),
          )
          if (!visible.length) return null

          return (
            <div key={group.label}>
              <p
                className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#334155' }}
              >
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visible.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                          isActive
                            ? 'text-white nav-active-glow'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                        )
                      }
                      style={({ isActive }) =>
                        isActive
                          ? {
                              background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                            }
                          : {}
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* ── User profile ── */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <div
            className="h-8 w-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name ?? ''} className="h-full w-full object-cover" />
            ) : (
              user ? getInitials(user.full_name) : '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white truncate leading-none">
              {user?.full_name}
            </p>
            <p className="text-[11px] mt-0.5 capitalize truncate" style={{ color: '#475569' }}>
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
