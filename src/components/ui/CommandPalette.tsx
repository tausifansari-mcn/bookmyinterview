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
