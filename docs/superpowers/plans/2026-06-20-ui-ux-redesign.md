# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all three portals (Candidate /portal, Client /client, Super Admin /super-admin) to a world-class warm-neutral SaaS aesthetic with a collapsible icon-rail sidebar, ⌘K command palette, notification panel, and dark mode.

**Architecture:** Shared `IconSidebar` component used by all three portal layouts; shared `StatCard`, `StatusBadge`, `CommandPalette`, `NotificationPanel` utility components. All existing API calls, routes, and auth logic stay 100% unchanged — only JSX/CSS is replaced.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, framer-motion (new), cmdk (installed), @radix-ui/react-tooltip (installed), recharts (installed), lucide-react (installed)

---

## File Map

### New files
- `src/components/layout/IconSidebar.tsx` — shared collapsible sidebar
- `src/components/ui/CommandPalette.tsx` — ⌘K overlay (wraps cmdk)
- `src/components/ui/NotificationPanel.tsx` — bell dropdown
- `src/components/ui/StatCard.tsx` — KPI metric card
- `src/components/ui/StatusBadge.tsx` — colour-coded status pill
- `src/pages/portal/PortalJobDetailPage.tsx` — candidate job detail view

### Modified files
- `package.json` / `package-lock.json` — add framer-motion
- `src/components/layout/SuperAdminLayout.tsx` — replace top-nav with IconSidebar
- `src/components/layout/ClientLayout.tsx` — replace top-nav with IconSidebar
- `src/components/layout/PortalLayout.tsx` — replace top-nav with IconSidebar
- `src/App.tsx` — add `/portal/jobs/:id` route
- `src/pages/super-admin/SuperAdminDashboardPage.tsx` — full rewrite
- `src/pages/client/ClientDashboardPage.tsx` — full rewrite
- `src/pages/portal/PortalJobsPage.tsx` — full rewrite (job grid)
- `src/pages/client/ClientApplicationsPage.tsx` — full rewrite (Kanban)
- `src/pages/portal/PortalProfilePage.tsx` — full rewrite (restyled)

---

## Task 1: Install framer-motion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install package**

```bash
cd "C:/Users/MAS60358/Desktop/Interview Project"
npm install framer-motion
```

Expected: `added N packages` with no errors. `framer-motion` appears in `package.json` dependencies.

- [ ] **Step 2: Verify TypeScript can import it**

Create a temp check — in any existing TSX file, add `import { motion } from 'framer-motion'` and run:

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors about framer-motion. Remove the temp import if you added one.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install framer-motion for sidebar animation"
```

---

## Task 2: StatusBadge and StatCard components

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/StatCard.tsx`

- [ ] **Step 1: Create StatusBadge**

Create `src/components/ui/StatusBadge.tsx` with this exact content:

```tsx
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  'application received': { label: 'Applied',      className: 'bg-blue-50 text-blue-700 border-blue-200'     },
  applied:                { label: 'Applied',      className: 'bg-blue-50 text-blue-700 border-blue-200'     },
  shortlisted:            { label: 'Shortlisted',  className: 'bg-amber-50 text-amber-700 border-amber-200'  },
  'interview scheduled':  { label: 'Interview',    className: 'bg-purple-50 text-purple-700 border-purple-200'},
  'offer made':           { label: 'Offer Made',   className: 'bg-indigo-50 text-indigo-700 border-indigo-200'},
  hired:                  { label: 'Hired',        className: 'bg-green-50 text-green-700 border-green-200'  },
  rejected:               { label: 'Rejected',     className: 'bg-red-50 text-red-700 border-red-200'        },
  active:                 { label: 'Active',       className: 'bg-green-50 text-green-700 border-green-200'  },
  open:                   { label: 'Open',         className: 'bg-green-50 text-green-700 border-green-200'  },
  closed:                 { label: 'Closed',       className: 'bg-zinc-50 text-zinc-500 border-zinc-200'     },
  paused:                 { label: 'Paused',       className: 'bg-amber-50 text-amber-700 border-amber-200'  },
  passed:                 { label: 'Passed',       className: 'bg-green-50 text-green-700 border-green-200'  },
  failed:                 { label: 'Failed',       className: 'bg-red-50 text-red-700 border-red-200'        },
  pending:                { label: 'Pending',      className: 'bg-amber-50 text-amber-700 border-amber-200'  },
  active_subscription:    { label: 'Active',       className: 'bg-green-50 text-green-700 border-green-200'  },
  trial:                  { label: 'Trial',        className: 'bg-blue-50 text-blue-700 border-blue-200'     },
  expired:                { label: 'Expired',      className: 'bg-red-50 text-red-700 border-red-200'        },
}

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase().trim() ?? ''
  const config = STATUS_MAP[key] ?? { label: status ?? 'Unknown', className: 'bg-zinc-50 text-zinc-500 border-zinc-200' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 2: Create StatCard**

Create `src/components/ui/StatCard.tsx` with this exact content:

```tsx
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; label: string }
  accent?: 'indigo' | 'green' | 'amber' | 'red' | 'purple'
  className?: string
}

const ACCENTS = {
  indigo: 'bg-indigo-100 text-indigo-600',
  green:  'bg-green-100  text-green-600',
  amber:  'bg-amber-100  text-amber-600',
  red:    'bg-red-100    text-red-600',
  purple: 'bg-purple-100 text-purple-600',
}

export function StatCard({ label, value, icon: Icon, trend, accent = 'indigo', className }: StatCardProps) {
  return (
    <div className={cn('bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', ACCENTS[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {trend && (
        <div className="flex items-center gap-1.5">
          {trend.value >= 0
            ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-zinc-400">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "StatusBadge|StatCard|error"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/StatusBadge.tsx src/components/ui/StatCard.tsx
git commit -m "feat: add StatusBadge and StatCard shared components"
```

---

## Task 3: CommandPalette component

**Files:**
- Create: `src/components/ui/CommandPalette.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ui/CommandPalette.tsx`:

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'

interface CmdItem {
  label: string
  to: string
  icon: React.ElementType
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CmdItem[]
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  function handleSelect(to: string) {
    navigate(to)
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Command>
          <div className="border-b border-zinc-100 dark:border-zinc-800 px-4">
            <Command.Input
              autoFocus
              placeholder="Search pages..."
              className="w-full py-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 bg-transparent outline-none"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-sm text-zinc-400">No results found.</Command.Empty>
            <Command.Group>
              {items.map(item => (
                <Command.Item
                  key={item.to}
                  value={item.label}
                  onSelect={() => handleSelect(item.to)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300 data-[selected=true]:bg-indigo-50 dark:data-[selected=true]:bg-indigo-900/30 data-[selected=true]:text-indigo-700 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-zinc-400" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "CommandPalette|cmdk|error" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CommandPalette.tsx
git commit -m "feat: add CommandPalette component (cmdk-powered ⌘K overlay)"
```

---

## Task 4: NotificationPanel component

**Files:**
- Create: `src/components/ui/NotificationPanel.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ui/NotificationPanel.tsx`:

```tsx
export interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  read: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface NotificationPanelProps {
  items: NotificationItem[]
  onMarkAllRead?: () => void
  onClose: () => void
  isExpanded: boolean
}

export function NotificationPanel({ items, onMarkAllRead }: NotificationPanelProps) {
  const hasUnread = items.some(n => !n.read)
  return (
    <div className="absolute left-full ml-2 bottom-0 z-50 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</span>
        {hasUnread && onMarkAllRead && (
          <button onClick={onMarkAllRead} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
            Mark all read
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-400">No notifications yet</div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
          {items.map(n => (
            <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">{n.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/NotificationPanel.tsx
git commit -m "feat: add NotificationPanel component"
```

---

## Task 5: IconSidebar component

**Files:**
- Create: `src/components/layout/IconSidebar.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/layout/IconSidebar.tsx`:

```tsx
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
}: IconSidebarProps) {
  const [isOpen, setIsOpen]   = useState(false)
  const [isDark, setIsDark]   = useState(() => document.documentElement.classList.contains('dark'))
  const [cmdOpen, setCmdOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // ⌘K shortcut
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

  // Close notif on outside click
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
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            {logoSrc
              ? <img src={logoSrc} alt="" className="h-6 w-6 rounded-md object-cover" />
              : <span className="text-white text-xs font-bold">B</span>}
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
              onClick={() => setIsOpen(o => !o)}
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "IconSidebar|error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/IconSidebar.tsx
git commit -m "feat: add IconSidebar collapsible sidebar component with framer-motion"
```

---

## Task 6: Update SuperAdminLayout

**Files:**
- Modify: `src/components/layout/SuperAdminLayout.tsx`

The current file uses a top navigation bar. Replace the entire file with an IconSidebar-based layout.

- [ ] **Step 1: Read the current file to understand auth context shape**

Read `src/components/layout/SuperAdminLayout.tsx` to see what `useSuperAdminAuth()` returns (look for `admin` object fields used: `admin.full_name`, `admin.email`, etc.) and what the current NAV items are.

- [ ] **Step 2: Rewrite the file**

Replace the entire content of `src/components/layout/SuperAdminLayout.tsx`:

```tsx
import { useEffect } from 'react'
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import { IconSidebar, NavItem } from '@/components/layout/IconSidebar'
import { LayoutDashboard, Building2, Users, ClipboardCheck, Settings, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: NavItem[] = [
  { to: '/super-admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard',   short: 'Home'    },
  { to: '/super-admin/clients',    icon: Building2,       label: 'Clients',     short: 'Clients' },
  { to: '/super-admin/candidates', icon: Users,           label: 'Candidates',  short: 'People'  },
  { to: '/super-admin/analytics',  icon: BarChart3,       label: 'Analytics',   short: 'Stats'   },
  { to: '/super-admin/settings',   icon: Settings,        label: 'Settings',    short: 'Config'  },
]

const MOBILE_NAV = NAV.slice(0, 5)

export default function SuperAdminLayout() {
  const { admin, logout } = useSuperAdminAuth()
  const navigate = useNavigate()

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
      />

      {/* Main — offset by collapsed sidebar width on desktop */}
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
          {MOBILE_NAV.map(({ to, icon: Icon, short }) => (
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
```

- [ ] **Step 3: Check that `useSuperAdminAuth` exposes `admin.full_name` and `admin.email`**

Read `src/contexts/SuperAdminAuthContext.tsx`, confirm the `admin` object has `full_name` and `email`. If the field names differ, adjust the JSX above to match. Common alternative: `admin.name` instead of `admin.full_name`.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "SuperAdminLayout|error" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/SuperAdminLayout.tsx
git commit -m "feat: replace super-admin top nav with IconSidebar"
```

---

## Task 7: Update ClientLayout

**Files:**
- Modify: `src/components/layout/ClientLayout.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire content of `src/components/layout/ClientLayout.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/components/layout/ClientLayout.tsx
git commit -m "feat: replace client portal top nav with IconSidebar"
```

---

## Task 8: Update PortalLayout

**Files:**
- Modify: `src/components/layout/PortalLayout.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/layout/PortalLayout.tsx` to confirm the auth context name (`useCandidateAuth`) and what fields `candidate` exposes (look for `candidate.full_name`, `candidate.email`).

- [ ] **Step 2: Rewrite the file**

Replace entire content of `src/components/layout/PortalLayout.tsx`:

```tsx
import { useEffect } from 'react'
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { IconSidebar, NavItem } from '@/components/layout/IconSidebar'
import { LayoutDashboard, Briefcase, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: NavItem[] = [
  { to: '/portal/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    short: 'Home'  },
  { to: '/portal/jobs',         icon: Briefcase,       label: 'Browse Jobs',  short: 'Jobs'  },
  { to: '/portal/applications', icon: FileText,        label: 'My Applications', short: 'Apps' },
  { to: '/portal/profile',      icon: User,            label: 'My Profile',   short: 'Me'    },
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
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/components/layout/PortalLayout.tsx
git commit -m "feat: replace candidate portal top nav with IconSidebar"
```

---

## Task 9: Super Admin Dashboard page

**Files:**
- Modify: `src/pages/super-admin/SuperAdminDashboardPage.tsx`

**API used:** `GET /api/v1/super-admin/dashboard`
**Response shape:**
```ts
{
  total_clients: number
  total_candidates: number
  total_jobs: number
  total_applications: number
  active_jobs: number
  clients_this_month: number
  monthly_trend: Array<{ month: string; clients: number; jobs: number }>
  top_clients: Array<{ id: string; company_name: string; logo_url: string | null; subscription_status: string; jobs: number; candidates: number; applications: number }>
}
```

- [ ] **Step 1: Rewrite the page**

Replace the entire file content with:

```tsx
import { useEffect, useState } from 'react'
import { superAdminApi } from '@/lib/superAdminApi'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Building2, Users, Briefcase, FileText, TrendingUp, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface DashData {
  total_clients: number
  total_candidates: number
  total_jobs: number
  total_applications: number
  active_jobs: number
  clients_this_month: number
  monthly_trend: Array<{ month: string; clients: number; jobs: number }>
  top_clients: Array<{
    id: string; company_name: string; logo_url: string | null
    subscription_status: string; jobs: number; candidates: number; applications: number
  }>
}

export default function SuperAdminDashboardPage() {
  const [data, setData]     = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    superAdminApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-6">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Platform overview across all clients</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients"     value={data.total_clients}     icon={Building2} accent="indigo"
          trend={{ value: data.clients_this_month, label: 'this month' }} />
        <StatCard label="Total Candidates"  value={data.total_candidates}  icon={Users}     accent="purple" />
        <StatCard label="Active Jobs"       value={data.active_jobs}       icon={Briefcase} accent="green" />
        <StatCard label="Total Applications" value={data.total_applications} icon={FileText} accent="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Monthly Growth</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.monthly_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="jobGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="clients" name="New Clients" stroke="#6366f1" fill="url(#clientGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="jobs"    name="New Jobs"    stroke="#10b981" fill="url(#jobGrad)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top clients bar chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Top Clients by Applications</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top_clients.slice(0, 6)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="company_name" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top clients table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">All Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jobs</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Candidates</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {data.top_clients.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                        {c.logo_url
                          ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
                          : <Building2 className="h-3.5 w-3.5 text-indigo-400" />}
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-white">{c.company_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.subscription_status} /></td>
                  <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.jobs}</td>
                  <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-400">{c.candidates}</td>
                  <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-white">{c.applications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/super-admin/SuperAdminDashboardPage.tsx
git commit -m "feat: redesign super-admin dashboard with KPI cards and charts"
```

---

## Task 10: Client Dashboard page

**Files:**
- Modify: `src/pages/client/ClientDashboardPage.tsx`

**API used:** `GET /api/v1/client/dashboard`
**Response shape:**
```ts
{
  active_jobs: number
  total_candidates: number
  total_applications: number
  this_week_applications: number
  interviews_scheduled: number
  offers_sent: number
  shortlisted: number
  applications_trend: Array<{ week: string; applications: number }>
  top_jobs: Array<{ id: string; title: string; status: string; application_count: number }>
  stage_breakdown: Array<{ stage: string; count: number }>
  hiring_funnel: { applied: number; reviewed: number; shortlisted: number; offered: number; joined: number }
}
```

- [ ] **Step 1: Read current file briefly to confirm import patterns**

Check what `clientApi` is imported from — it should be `@/lib/clientApi`.

- [ ] **Step 2: Rewrite the file**

Replace entire `src/pages/client/ClientDashboardPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientApi } from '@/lib/clientApi'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Briefcase, Users, FileText, CalendarCheck, Plus, ArrowRight, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'

interface DashData {
  active_jobs: number
  total_candidates: number
  total_applications: number
  this_week_applications: number
  interviews_scheduled: number
  offers_sent: number
  shortlisted: number
  applications_trend: Array<{ week: string; applications: number }>
  top_jobs: Array<{ id: string; title: string; status: string; application_count: number }>
  stage_breakdown: Array<{ stage: string; count: number }>
}

export default function ClientDashboardPage() {
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    clientApi.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Your hiring activity at a glance</p>
        </div>
        <Link
          to="/client/jobs"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" /> Post a Job
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Jobs"         value={data.active_jobs}              icon={Briefcase}     accent="indigo" />
        <StatCard label="Total Candidates"  value={data.total_candidates}         icon={Users}         accent="purple" />
        <StatCard label="Applications"      value={data.total_applications}       icon={FileText}      accent="amber"
          trend={{ value: data.this_week_applications, label: 'this week' }} />
        <StatCard label="Interviews"        value={data.interviews_scheduled}     icon={CalendarCheck} accent="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications trend */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Applications Over Time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.applications_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stage breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.stage_breakdown} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: '#a1a1aa' }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
              <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top jobs + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top jobs by applications */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Top Jobs</h2>
            <Link to="/client/jobs" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {data.top_jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{job.title}</p>
                  <StatusBadge status={job.status} />
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{job.application_count}</p>
                  <p className="text-xs text-zinc-400">applicants</p>
                </div>
              </div>
            ))}
            {data.top_jobs.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">No jobs posted yet</div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Post a New Job',          to: '/client/jobs',         icon: Briefcase    },
              { label: 'Review Applications',      to: '/client/applications', icon: FileText     },
              { label: 'Browse Candidates',        to: '/client/candidates',   icon: Users        },
              { label: 'Manage Assessments',       to: '/client/assessments',  icon: CalendarCheck},
            ].map(a => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
              >
                <a.icon className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{a.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-400 ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/client/ClientDashboardPage.tsx
git commit -m "feat: redesign client dashboard with KPI cards, charts, and quick actions"
```

---

## Task 11: Candidate Job Board (PortalJobsPage)

**Files:**
- Modify: `src/pages/portal/PortalJobsPage.tsx`

**API:** `GET /api/v1/portal/jobs?search=&job_type=&work_mode=&page=1&limit=12`
**Response:** `{ jobs: Job[], total: number, page: number, limit: number }`
**Job fields:** `id, job_code, title, job_type, work_mode, experience_min_years, experience_max_years, salary_min, salary_max, description, posted_at, closes_at, company_name, company_logo_url, department_name, location_city, location_state`

- [ ] **Step 1: Rewrite the file**

Replace the entire content of `src/pages/portal/PortalJobsPage.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Search, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight, Loader2, Building2 } from 'lucide-react'

interface Job {
  id: string; job_code: string; title: string; job_type: string; work_mode: string
  experience_min_years: number | null; experience_max_years: number | null
  salary_min: number | null; salary_max: number | null
  description: string; posted_at: string
  company_name: string; company_logo_url: string | null
  department_name: string | null; location_city: string | null; location_state: string | null
}

function daysSince(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export default function PortalJobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [jobType, setJobType] = useState('')
  const [workMode, setWorkMode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const LIMIT = 12

  const fetchJobs = useCallback(() => {
    setLoading(true)
    portalApi.get('/jobs', { params: { search, job_type: jobType, work_mode: workMode, page, limit: LIMIT } })
      .then(r => { setJobs(r.data.data.jobs); setTotal(r.data.data.total) })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false))
  }, [search, jobType, workMode, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Browse Jobs</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{total} open positions available</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search jobs or companies..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={jobType}
          onChange={e => { setJobType(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Job Types</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <select
          value={workMode}
          onChange={e => { setWorkMode(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Work Modes</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No jobs found</p>
          <p className="text-xs mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map(job => {
            const salary = salaryLabel(job.salary_min, job.salary_max)
            const location = [job.location_city, job.location_state].filter(Boolean).join(', ')
            return (
              <Link
                key={job.id}
                to={`/portal/jobs/${job.id}`}
                className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col gap-4"
              >
                {/* Company */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {job.company_logo_url
                      ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                      : <Building2 className="h-5 w-5 text-zinc-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500 truncate">{job.company_name}</p>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h3>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {job.job_type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {job.work_mode}
                    </span>
                  )}
                  {salary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      {salary}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-50 dark:border-zinc-800">
                  {location ? (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </div>
                  ) : <span />}
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {daysSince(job.posted_at)}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/portal/PortalJobsPage.tsx
git commit -m "feat: redesign candidate job board as responsive card grid with filters"
```

---

## Task 12: Job Detail Page + App.tsx route

**Files:**
- Create: `src/pages/portal/PortalJobDetailPage.tsx`
- Modify: `src/App.tsx`

**API:** `GET /api/v1/portal/jobs/:jobId`
**Response:** All job fields + `about_company`, `culture_description`, `achievements_json`, `company_city`, `company_state`, `industry`, `company_size`, `website`, `questions: Array<{id, question, question_type, options, is_mandatory, sort_order}>`, `company_media`

- [ ] **Step 1: Create PortalJobDetailPage**

Create `src/pages/portal/PortalJobDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { portalApi } from '@/lib/portalApi'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { ArrowLeft, MapPin, Briefcase, Building2, Globe, Users, Loader2, CheckCircle2 } from 'lucide-react'

interface JobDetail {
  id: string; title: string; job_type: string; work_mode: string
  experience_min_years: number | null; experience_max_years: number | null
  salary_min: number | null; salary_max: number | null
  description: string; about_job: string | null
  posted_at: string; closes_at: string | null
  company_name: string; company_logo_url: string | null
  about_company: string | null; industry: string | null; company_size: string | null
  website: string | null; company_city: string | null; company_state: string | null
  location_city: string | null; location_state: string | null
  department_name: string | null
  questions: Array<{ id: string; question: string; is_mandatory: boolean }>
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)} / year`
  if (min) return `From ${fmt(min)} / year`
  return `Up to ${fmt(max!)} / year`
}

export default function PortalJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { candidate } = useCandidateAuth()
  const [job, setJob]           = useState<JobDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [applyErr, setApplyErr] = useState('')

  useEffect(() => {
    if (!id) return
    portalApi.get(`/jobs/${id}`)
      .then(r => setJob(r.data.data))
      .catch(() => setError('Job not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleApply() {
    if (!candidate) { navigate('/portal/login'); return }
    setApplying(true); setApplyErr('')
    try {
      await portalApi.post(`/jobs/${id}/apply`, {})
      setApplied(true)
    } catch (e: any) {
      setApplyErr(e.response?.data?.message ?? 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error || !job) return (
    <div className="text-center py-16">
      <p className="text-zinc-500 text-sm">{error || 'Job not found'}</p>
      <Link to="/portal/jobs" className="text-indigo-500 text-sm mt-2 inline-block hover:underline">← Back to jobs</Link>
    </div>
  )

  const salary = salaryLabel(job.salary_min, job.salary_max)
  const location = [job.location_city, job.location_state].filter(Boolean).join(', ')
  const companyLocation = [job.company_city, job.company_state].filter(Boolean).join(', ')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job header card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {job.company_logo_url
                  ? <img src={job.company_logo_url} alt="" className="h-full w-full object-cover" />
                  : <Building2 className="h-6 w-6 text-zinc-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{job.title}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{job.company_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {job.job_type && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Briefcase className="h-3 w-3" />
                      {job.job_type.replace('_', ' ')}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      {job.work_mode}
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About this role */}
          {(job.about_job || job.description) && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">About this role</h2>
              <div className="prose prose-sm max-w-none text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed">
                {job.about_job || job.description}
              </div>
            </div>
          )}

          {/* About the company */}
          {job.about_company && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">About {job.company_name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{job.about_company}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                {job.industry && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.industry}
                  </div>
                )}
                {job.company_size && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {job.company_size}
                  </div>
                )}
                {companyLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {companyLocation}
                  </div>
                )}
                {job.website && (
                  <a href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Apply CTA — sticky on desktop */}
        <div className="space-y-4">
          <div className="sticky top-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            {/* Salary */}
            {salary && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Salary</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{salary}</p>
              </div>
            )}

            {/* Experience */}
            {(job.experience_min_years !== null || job.experience_max_years !== null) && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Experience</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">
                  {job.experience_min_years ?? 0}
                  {job.experience_max_years ? ` – ${job.experience_max_years}` : '+'} years
                </p>
              </div>
            )}

            {/* Department */}
            {job.department_name && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Department</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white mt-0.5">{job.department_name}</p>
              </div>
            )}

            {/* Apply */}
            {applied ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Application submitted!</span>
              </div>
            ) : (
              <>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
                {applyErr && <p className="text-xs text-red-500 text-center">{applyErr}</p>}
                {!candidate && (
                  <p className="text-xs text-zinc-400 text-center">
                    <Link to="/portal/login" className="text-indigo-500 hover:underline">Sign in</Link> to apply
                  </p>
                )}
              </>
            )}

            {/* Closing date */}
            {job.closes_at && (
              <p className="text-xs text-zinc-400 text-center">
                Closes {new Date(job.closes_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.tsx**

In `src/App.tsx`, inside the `/portal` layout route group (around line 113–115, after the `profile` route), add:

```tsx
import PortalJobDetailPage from '@/pages/portal/PortalJobDetailPage'
```

(Add this import near the other portal imports at the top of the file.)

Then add this route inside `<Route path="/portal" element={<PortalLayout />}>`:

```tsx
<Route path="jobs/:id" element={<PortalJobDetailPage />} />
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/portal/PortalJobDetailPage.tsx src/App.tsx
git commit -m "feat: add candidate job detail page with apply CTA"
```

---

## Task 13: Client Applications Kanban

**Files:**
- Modify: `src/pages/client/ClientApplicationsPage.tsx`

**API GET:** `GET /api/v1/client/applications?page=1&limit=50`
**API PATCH:** `PATCH /api/v1/client/applications/:id/stage` — body: `{ stage: string }`
**Valid stages:** `'Application Received'`, `'Shortlisted'`, `'Interview Scheduled'`, `'Offer Made'`, `'Rejected'`, `'Hired'`
**Application fields:** `id, current_stage_name, status, applied_at, candidate_id, full_name, email, profile_photo_url, current_designation, current_company, experience_years, job_id, job_title, job_code`

- [ ] **Step 1: Read current file to note any slide-over logic to preserve**

Read `src/pages/client/ClientApplicationsPage.tsx`. Note if there is a candidate detail slide-over already present — keep that logic, only replace the list/table layout with the Kanban board.

- [ ] **Step 2: Rewrite the file**

Replace the entire content of `src/pages/client/ClientApplicationsPage.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { clientApi } from '@/lib/clientApi'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Loader2, User, Briefcase, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Application {
  id: string; current_stage_name: string; status: string; applied_at: string
  candidate_id: string; full_name: string; email: string
  profile_photo_url: string | null; current_designation: string | null
  current_company: string | null; experience_years: number | null
  job_id: string; job_title: string; job_code: string
}

const COLUMNS: Array<{ stage: string; label: string; color: string; dot: string }> = [
  { stage: 'Application Received', label: 'Applied',     color: 'border-blue-200 bg-blue-50/50',    dot: 'bg-blue-400'   },
  { stage: 'Shortlisted',          label: 'Shortlisted', color: 'border-amber-200 bg-amber-50/50',  dot: 'bg-amber-400'  },
  { stage: 'Interview Scheduled',  label: 'Interview',   color: 'border-purple-200 bg-purple-50/50',dot: 'bg-purple-400' },
  { stage: 'Offer Made',           label: 'Offer Made',  color: 'border-indigo-200 bg-indigo-50/50',dot: 'bg-indigo-400' },
  { stage: 'Hired',                label: 'Hired',       color: 'border-green-200 bg-green-50/50',  dot: 'bg-green-400'  },
  { stage: 'Rejected',             label: 'Rejected',    color: 'border-red-200 bg-red-50/50',      dot: 'bg-red-400'    },
]

const STAGE_TRANSITIONS: Record<string, string[]> = {
  'Application Received': ['Shortlisted', 'Rejected'],
  'Shortlisted':          ['Interview Scheduled', 'Rejected'],
  'Interview Scheduled':  ['Offer Made', 'Rejected'],
  'Offer Made':           ['Hired', 'Rejected'],
  'Hired':                [],
  'Rejected':             [],
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function daysSince(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`
}

export default function ClientApplicationsPage() {
  const [apps, setApps]       = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [moving, setMoving]   = useState<string | null>(null)

  const fetchApps = useCallback(() => {
    setLoading(true)
    clientApi.get('/applications', { params: { limit: 100 } })
      .then(r => setApps(r.data.data.applications))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function moveStage(appId: string, stage: string) {
    setMoving(appId)
    try {
      await clientApi.patch(`/applications/${appId}/stage`, { stage })
      setApps(prev => prev.map(a => a.id === appId ? { ...a, current_stage_name: stage } : a))
    } catch {
      // ignore — could show toast
    } finally {
      setMoving(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
    </div>
  )
  if (error) return <div className="text-red-500 text-sm p-4">{error}</div>

  const byStage = (stage: string) => apps.filter(a => a.current_stage_name === stage)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Applications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{apps.length} total · Kanban view</p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => {
          const colApps = byStage(col.stage)
          return (
            <div key={col.stage} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('h-2 w-2 rounded-full', col.dot)} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{col.label}</span>
                <span className="ml-auto text-xs text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                  {colApps.length}
                </span>
              </div>

              {/* Cards */}
              <div className={cn('rounded-xl border p-2 space-y-2 min-h-[120px]', col.color)}>
                {colApps.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-400">No candidates</div>
                )}
                {colApps.map(app => {
                  const nextStages = STAGE_TRANSITIONS[app.current_stage_name] ?? []
                  return (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm space-y-2"
                    >
                      {/* Candidate info */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold shrink-0 overflow-hidden">
                          {app.profile_photo_url
                            ? <img src={app.profile_photo_url} alt="" className="h-full w-full object-cover" />
                            : getInitials(app.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{app.full_name}</p>
                          {app.current_designation && (
                            <p className="text-[10px] text-zinc-400 truncate">{app.current_designation}</p>
                          )}
                        </div>
                      </div>

                      {/* Job */}
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{app.job_title}</span>
                      </div>

                      {/* Applied date */}
                      <p className="text-[10px] text-zinc-400">{daysSince(app.applied_at)}</p>

                      {/* Move buttons */}
                      {nextStages.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-50 dark:border-zinc-800">
                          {nextStages.map(next => (
                            <button
                              key={next}
                              onClick={() => moveStage(app.id, next)}
                              disabled={moving === app.id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 border border-zinc-100 dark:border-zinc-700 rounded-md transition-colors disabled:opacity-40"
                            >
                              {moving === app.id
                                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                : <ArrowRight className="h-2.5 w-2.5" />}
                              {next === 'Hired' ? 'Hire' : next === 'Rejected' ? 'Reject' : next.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/client/ClientApplicationsPage.tsx
git commit -m "feat: replace applications list with Kanban board (click-to-move stages)"
```

---

## Task 14: Candidate Profile Page restyle

**Files:**
- Modify: `src/pages/portal/PortalProfilePage.tsx`

The existing file is 1315 lines and contains all the data-fetching logic, form state, photo/voice/video upload, and section components. The goal is to restyle the wrapping shell and section cards to match the new design language — **do not touch any API call, upload logic, or form state management.**

- [ ] **Step 1: Read the current file structure**

Read `src/pages/portal/PortalProfilePage.tsx` lines 1–100 to understand the outer component structure. Identify:
- The root `div` className (replace with `"space-y-5"`)
- The page-level header element (if any) — restyle to `text-xl font-bold text-zinc-900 dark:text-white`
- The `Section` component definition — restyle its card wrapper

- [ ] **Step 2: Restyle the Section component**

Find the `Section` component (around line 45–60). Replace its `return` JSX with:

```tsx
return (
  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
    <button
      onClick={() => setOpen(!open)}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[accent] ?? colors.indigo}`}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</span>
      </div>
      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800">{children}</div>}
  </div>
)
```

- [ ] **Step 3: Restyle the profile header area**

Find the hero/header section at the top of the main JSX (the gradient banner with the completion ring). Replace the outermost wrapper div's className from whatever it currently is to:

```
"relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
```

Replace the gradient banner `div` (the one with `style={{ background: 'linear-gradient(...)' }}`) background style with:
```
style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
```

- [ ] **Step 4: Replace root container className**

Find the outermost return `div` in the main component — change its className to:

```tsx
className="space-y-5"
```

Remove any old `min-h-screen bg-*` classes from the root since the layout shell now handles background.

- [ ] **Step 5: Type-check and commit**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
git add src/pages/portal/PortalProfilePage.tsx
git commit -m "feat: restyle candidate profile page to match new design system"
```

---

## Self-Review Checklist

After all tasks complete, run these checks:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] Visit `/super-admin/dashboard` — KPI cards and charts render
- [ ] Visit `/client/dashboard` — KPI cards, trend chart, quick actions render
- [ ] Visit `/portal/jobs` — job cards grid renders, filters work
- [ ] Click a job card → `/portal/jobs/:id` — detail page renders with Apply button
- [ ] Visit `/client/applications` — Kanban columns render with cards
- [ ] Sidebar collapses/expands on click of chevron button
- [ ] `Ctrl+K` opens command palette
- [ ] Dark mode toggle persists after page refresh (check `localStorage.bmi_dark_mode`)
- [ ] Mobile bottom tab bar visible below md breakpoint
- [ ] All existing routes still work (no broken imports)
