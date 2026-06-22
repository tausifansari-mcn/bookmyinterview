import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'

const PAGE_MAP: Record<string, { title: string; sub: string }> = {
  '/dashboard':    { title: 'Dashboard',    sub: 'Your hiring pipeline at a glance' },
  '/jobs':         { title: 'Jobs',         sub: 'Manage open positions' },
  '/candidates':   { title: 'Candidates',   sub: 'Talent pool & profiles' },
  '/applications': { title: 'Applications', sub: 'Review & advance applicants' },
  '/interviews':   { title: 'Interviews',   sub: 'Scheduled sessions' },
  '/offers':       { title: 'Offers',       sub: 'Offer letter management' },
  '/assessments':  { title: 'Assessments',  sub: 'Skills evaluation' },
  '/analytics':    { title: 'Analytics',    sub: 'Hiring insights & trends' },
  '/users':        { title: 'Team',         sub: 'User roles & access' },
  '/settings':     { title: 'Settings',     sub: 'Workspace configuration' },
}

export default function Header() {
  const { user, updateUser } = useAuth()
  const location = useLocation()
  const fileRef  = useRef<HTMLInputElement>(null)

  const base = '/' + (location.pathname.split('/')[1] || 'dashboard')
  const page = PAGE_MAP[base] ?? { title: 'Page', sub: '' }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      const token = localStorage.getItem('bmi_token')
      const { data } = await axios.post('/api/v1/upload/admin-photo', fd, {
        headers: { Authorization: `Bearer ${token}` },
      })
      updateUser({ avatar_url: data.data.url })
    } catch { /* silent */ }
    e.target.value = ''
  }

  return (
    <header className="h-[60px] shrink-0 flex items-center justify-between px-6 bg-white/90 backdrop-blur-sm z-20"
      style={{ borderBottom: '1px solid #e8edf3' }}>

      {/* Left: Page title */}
      <div>
        <h1 className="text-[15px] font-semibold text-slate-900 leading-none">{page.title}</h1>
        {page.sub && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-none">{page.sub}</p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">

        {/* Search hint */}
        <div className="hidden sm:flex items-center gap-2 border rounded-xl px-3 py-2 cursor-pointer
                        transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50/50 group"
          style={{ borderColor: '#e8edf3', background: '#f8fafc', width: 200 }}>
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400 flex-1">Quick search…</span>
          <span className="text-[10px] font-medium bg-white border rounded-md px-1.5 py-0.5 text-slate-400
                           group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors"
            style={{ borderColor: '#e8edf3' }}>
            ⌘K
          </span>
        </div>

        {/* Bell */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-100 mx-1" />

        {/* Avatar + user */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden" onChange={handleAvatar} />
        <button
          title="Click to update photo"
          onClick={() => fileRef.current?.click()}
          className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-transparent
                     hover:ring-indigo-400/50 transition-all shrink-0"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name ?? ''} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user ? getInitials(user.full_name) : '?'}
            </div>
          )}
        </button>
        <div className="hidden sm:block">
          <p className="text-[13px] font-semibold text-slate-900 leading-none">{user?.full_name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 capitalize leading-none">
            {user?.role?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
    </header>
  )
}
