import { useRef } from 'react'
import { Bell, Search, LogOut, User } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'

export default function Header() {
  const { user, logout, updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
    } catch {
      // silently fail — avatar is not critical
    }
    e.target.value = ''
  }

  return (
    <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3 w-64">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search candidates, jobs…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-md hover:bg-accent">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            title="Click to change photo"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/50 transition-all flex-shrink-0"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {user ? getInitials(user.full_name) : <User className="h-4 w-4" />}
              </div>
            )}
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="p-1.5 ml-1 rounded-md hover:bg-accent text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
