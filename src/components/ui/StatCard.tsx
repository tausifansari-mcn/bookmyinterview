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
