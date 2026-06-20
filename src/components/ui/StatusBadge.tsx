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
