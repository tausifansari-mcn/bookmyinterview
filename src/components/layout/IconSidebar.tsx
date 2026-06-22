import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ChevronRight, ChevronLeft, Bell, Moon, Sun, LogOut, Command } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { NotificationPanel, NotificationItem } from '@/components/ui/NotificationPanel'

export interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  short: string
}

interface IconSidebarProps {
  navItems: NavItem[]
  userName: string
  userEmail: string
  onLogout: () => void
  brandLabel?: string
  logoSrc?: string
  notificationItems?: NotificationItem[]
  onMarkAllRead?: () => void
  onOpenChange?: (open: boolean) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function SideTooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  if (!show) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={8}
            className="z-[60] bg-zinc-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg select-none"
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export function IconSidebar({
  navItems,
  userName,
  userEmail,
  onLogout,
  brandLabel = 'Book My Interview',
  logoSrc,
  notificationItems = [],
  onMarkAllRead,
  onOpenChange,
}: IconSidebarProps) {
  const [isOpen, setIsOpen]       = useState(true)
  const [isDark, setIsDark]       = useState(() => document.documentElement.classList.contains('dark'))
  const [cmdOpen, setCmdOpen]     = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggleDark() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bmi_dark_mode', next ? '1' : '0')
  }

  const unread = notificationItems.filter(n => !n.read).length
  const cmdItems = navItems.map(n => ({ label: n.label, to: n.to, icon: n.icon }))

  return (
    <>
      <motion.aside
        animate={{ width: isOpen ? 220 : 52 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-zinc-900 flex-col z-40 overflow-hidden border-r border-zinc-800"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 h-14 px-3 shrink-0 border-b border-zinc-800">
          <div className="h-7 w-7 rounded-lg shrink-0 overflow-hidden">
            <img src={logoSrc || '/logo.png'} alt="" className="h-full w-full object-cover" />
          </div>
          <motion.span
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden"
          >
            {brandLabel}
          </motion.span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <SideTooltip key={to} label={label} show={!isOpen}>
              <NavLink
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group border-l-2',
                  isActive
                    ? 'bg-zinc-700/60 border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-white')} />
                    <motion.span
                      animate={{ opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  </>
                )}
              </NavLink>
            </SideTooltip>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-2 pb-3 pt-2 space-y-0.5 border-t border-zinc-800">
          {/* ⌘K */}
          <SideTooltip label="Command palette (⌘K)" show={!isOpen}>
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Command className="h-4 w-4 shrink-0" />
              <motion.span animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden flex items-center gap-2">
                Search <kbd className="text-[10px] bg-zinc-700 px-1 py-0.5 rounded">⌘K</kbd>
              </motion.span>
            </button>
          </SideTooltip>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <SideTooltip label="Notifications" show={!isOpen}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
              >
                <div className="relative shrink-0">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <motion.span animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.15 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  Notifications {unread > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unread}</span>}
                </motion.span>
              </button>
            </SideTooltip>
            {notifOpen && (
              <NotificationPanel
                items={notificationItems}
                onMarkAllRead={onMarkAllRead}
                onClose={() => setNotifOpen(false)}
                isExpanded={isOpen}
              />
            )}
          </div>

          {/* Dark mode */}
          <SideTooltip label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} show={!isOpen}>
            <button
              onClick={toggleDark}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
            >
              {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              <motion.span animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden">
                {isDark ? 'Light mode' : 'Dark mode'}
              </motion.span>
            </button>
          </SideTooltip>

          {/* User row */}
          <SideTooltip label={`${userName} — click to sign out`} show={!isOpen}>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {getInitials(userName)}
              </div>
              <motion.div animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-zinc-500 truncate">{userEmail}</p>
              </motion.div>
              {isOpen && (
                <button onClick={onLogout} className="text-zinc-500 hover:text-red-400 transition-colors shrink-0">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </SideTooltip>

          {/* Expand/collapse toggle */}
          <SideTooltip label="Expand sidebar" show={!isOpen}>
            <button
              onClick={() => { const next = !isOpen; setIsOpen(next); onOpenChange?.(next) }}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all"
            >
              {isOpen
                ? <ChevronLeft className="h-4 w-4 shrink-0" />
                : <ChevronRight className="h-4 w-4 shrink-0" />}
              <motion.span animate={{ opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.15 }}
                className="text-xs text-zinc-500 whitespace-nowrap overflow-hidden">
                Collapse sidebar
              </motion.span>
            </button>
          </SideTooltip>
        </div>
      </motion.aside>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} items={cmdItems} />
    </>
  )
}
