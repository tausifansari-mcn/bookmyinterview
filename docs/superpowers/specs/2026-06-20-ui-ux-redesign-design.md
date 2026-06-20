# UI/UX Redesign — Book My Interview
**Date:** 2026-06-20  
**Scope:** All three portals — Candidate (`/portal`), Client (`/client`), Super Admin (`/super-admin`)  
**Approach:** Shared foundation first, then priority pages sequentially

---

## Design Language

### Visual Personality
Warm Neutral — inspired by Mercury + Ashby. Off-white canvas with a rich dark sidebar. Feels premium and distinctive compared to generic enterprise software. Proven aesthetic in the ATS/recruitment space.

### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `--canvas` | `#f8f8f7` | Page background |
| `--surface` | `#ffffff` | Cards, panels |
| `--sidebar-bg` | `#18181b` | Sidebar background |
| `--sidebar-hover` | `#27272a` | Sidebar item hover |
| `--sidebar-active` | `#3f3f46` | Sidebar active item bg |
| `--accent` | `#6366f1` | Primary action, active icon |
| `--accent-light` | `#eef2ff` | Accent background tint |
| `--text-primary` | `#18181b` | Headings, labels |
| `--text-secondary` | `#71717a` | Body, descriptions |
| `--text-muted` | `#a1a1aa` | Placeholders, hints |
| `--border` | `#e4e4e7` | Card borders, dividers |
| `--success` | `#16a34a` | Hired, active, passed |
| `--warning` | `#d97706` | Pending, in-review |
| `--danger` | `#dc2626` | Rejected, error |

These map to Tailwind classes already available (`zinc-*`, `indigo-*`) — no new Tailwind config needed.

### Typography
- Font: **Inter** (already loaded)
- Page title: `text-xl font-bold text-zinc-900`
- Section heading: `text-sm font-semibold text-zinc-900`
- Body: `text-sm text-zinc-600`
- Label/meta: `text-xs text-zinc-400 uppercase tracking-wide`

### Spacing & Radius
- Content padding: `px-6 py-5`
- Card radius: `rounded-xl` (12px)
- Button radius: `rounded-lg` (8px)
- Badge radius: `rounded-full`
- Sidebar item radius: `rounded-lg` (8px)

---

## Architecture

### Shared Components (new files)
| File | Purpose |
|---|---|
| `src/components/layout/IconSidebar.tsx` | Collapsible sidebar used by all portals |
| `src/components/ui/CommandPalette.tsx` | ⌘K overlay (wraps `cmdk`) |
| `src/components/ui/NotificationPanel.tsx` | Bell icon + dropdown notification list |
| `src/components/ui/PageHeader.tsx` | Consistent page title + action slot |
| `src/components/ui/StatCard.tsx` | KPI metric card for dashboards |
| `src/components/ui/StatusBadge.tsx` | Colour-coded status pills |

### Layout Updates (existing files rewritten)
| File | Change |
|---|---|
| `src/components/layout/SuperAdminLayout.tsx` | Replace current top nav with `IconSidebar` |
| `src/components/layout/ClientLayout.tsx` | Replace current top nav with `IconSidebar` |
| `src/components/layout/PortalLayout.tsx` | Replace current top nav with `IconSidebar` |

### Priority Pages (existing files rewritten)
1. `src/pages/super-admin/SuperAdminDashboardPage.tsx`
2. `src/pages/client/ClientDashboardPage.tsx`
3. `src/pages/portal/PortalJobsPage.tsx` (job board grid)
4. `src/pages/portal/PortalJobDetailPage.tsx` (new file — job detail view)
5. `src/pages/client/ClientApplicationsPage.tsx` (Kanban board view)
6. `src/pages/portal/PortalProfilePage.tsx`

---

## IconSidebar Component

### Behaviour
- **Default**: 52px wide — shows only icons with Radix `Tooltip` labels on hover
- **Expanded**: 220px wide — shows icon + text label for each nav item
- **Toggle**: clicking the expand/collapse chevron at the bottom pins it open; hovering expands temporarily (if not pinned)
- **Transition**: `framer-motion` `animate={{ width }}` with `duration: 0.2, ease: "easeInOut"`
- **Mobile**: sidebar hidden; `PortalLayout`/`ClientLayout`/`SuperAdminLayout` render a bottom tab bar instead (keep existing mobile tab bar pattern)

### Sidebar Sections
```
[Logo / Brand icon]
─────────────────── (nav items)
[Nav items — icon + label]
─────────────────── (spacer, flex-1)
[⌘K trigger]
[Notifications bell]
[Dark mode toggle]
[User avatar / logout]
[Expand ↔ Collapse chevron]
```

### Nav items per portal
**Client**: Dashboard, Jobs, Applications, Candidates, Assessments  
**Super Admin**: Dashboard, Clients, Candidates, Assessments, Settings  
**Candidate**: Dashboard, Jobs, My Applications, Profile

### Active state
- Icon: `text-indigo-500`
- Background: `bg-zinc-700/60`
- Left border: `border-l-2 border-indigo-500`

---

## Command Palette (`⌘K`)

### Trigger
- Keyboard: `Ctrl+K` (Windows) / `Cmd+K` (Mac)
- Sidebar button: clock/search icon at sidebar bottom

### UI
- Full-screen backdrop: `bg-black/40 backdrop-blur-sm`
- Centered panel: `bg-white rounded-2xl shadow-2xl w-full max-w-xl`
- Input: search field with placeholder "Search anything..."
- Groups: Pages (navigation), Recent (last 5 visited pages)
- Powered by `cmdk` — `Command`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`

### State
- Managed in each layout via `useState(false)` — open/close
- `useEffect` for keyboard shortcut listener

---

## Dashboard Pages

### Super Admin Dashboard
KPI row (4 cards): Total Clients · Total Candidates · Active Jobs · Assessments Taken  
Chart row: Candidates registered over time (Recharts `AreaChart`, already installed)  
Table: Recent client activity (last 5 signups)  
Table: Top jobs by applications

### Client Dashboard
KPI row (4 cards): Open Jobs · Total Applications · Candidates in Review · Hired This Month  
Chart: Applications per job (Recharts `BarChart`)  
Recent activity feed: last 5 application events  
Quick actions: Post a Job, View All Applications

---

## Candidate Job Board (`PortalJobsPage`)
- Grid layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` job cards
- Each card: company logo, job title, location, type badge, salary (if set), "Save" bookmark icon, "Apply" CTA
- Filter bar (top): keyword search, job type dropdown, location filter
- Saved jobs toggle: "All Jobs" / "Saved" tab
- Skeleton loaders while fetching (Tailwind animate-pulse)

---

## Job Detail Page (`PortalJobDetailPage`)
- New file: `src/pages/portal/PortalJobDetailPage.tsx`
- New route: `/portal/jobs/:id` — must be added to `App.tsx` inside the `/portal` layout group, with a new import
- Two-column layout on desktop: left (job description, requirements, company info), right sticky (Apply CTA card with salary, type, location)
- Apply CTA triggers existing application flow
- Back button → job board
- Data: calls existing `GET /api/v1/portal/jobs/:id` endpoint (already exists in portal.routes.ts)

---

## Applicant Kanban (`ClientApplicationsPage`)

### Board Columns
`Applied` → `In Review` → `Interview` → `Hired` / `Rejected`

### Card
Candidate name + avatar initials · Applied job title · Date applied · Status badge  
Click → opens existing slide-over detail panel

### Implementation
- Columns mapped from `status` field on `bmi_job_application`
- Drag-and-drop: `@dnd-kit/core` (needs install) OR simple click-to-move status buttons if dnd-kit is out of scope
- Decision: use **click-to-move** (no new drag dep) — a "Move to →" button on each card

---

## Notification Panel
- Bell icon in sidebar with unread count badge (red dot if > 0)
- Click → slide-down panel (absolute positioned below icon in expanded sidebar, or fixed panel in collapsed mode)
- **Super Admin**: fetches from existing `GET /api/v1/super-admin/notifications` endpoint
- **Client portal**: no notification GET endpoint exists — show empty state ("No notifications yet")
- **Candidate portal**: no notification GET endpoint exists — show empty state ("No notifications yet")
- "Mark all read" button (super-admin only; hidden for other portals)
- No backend changes required — empty state is intentional for now

---

## Dark Mode
- Toggle: sun/moon icon in sidebar bottom section
- Mechanism: `document.documentElement.classList.toggle('dark')` + `localStorage` persistence
- Already supported via CSS variables in `globals.css`

---

## Dependencies
| Package | Status | Action |
|---|---|---|
| `framer-motion` | Not installed | `npm install framer-motion` |
| `@dnd-kit/core` | Not installed | **Skip** — use click-to-move instead |
| `cmdk` | Already installed | Use as-is |
| `sonner` | Already installed | Use as-is |
| `recharts` | Already installed | Use as-is |
| `@radix-ui/react-tooltip` | Already installed | Use for sidebar icon tooltips |

Only **one** new package needed: `framer-motion`.

---

## API Contracts
All existing API calls stay **100% unchanged**. This is a pure frontend redesign — no backend changes. All data fetching, auth, and routing logic is preserved; only the JSX/CSS is replaced.

---

## Out of Scope
- Backend changes of any kind
- New database tables or columns
- Email templates
- Mobile app
- Real-time websockets (notifications are static for now)
- Drag-and-drop Kanban (using click-to-move instead to avoid new dependencies)
