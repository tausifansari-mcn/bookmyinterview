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
