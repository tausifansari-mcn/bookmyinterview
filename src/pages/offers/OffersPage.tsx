import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Gift, RefreshCw } from 'lucide-react'

interface Offer {
  id: string
  candidate_name: string
  candidate_email: string | null
  job_title: string
  job_code: string | null
  offered_ctc: number | null
  status: string
  joining_date: string | null
  valid_till: string | null
  created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  revoked:  'bg-orange-100 text-orange-700',
}

function formatCTC(val: number | null) {
  if (!val) return '—'
  const n = Number(val)
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L/yr` : `₹${(n / 1000).toFixed(0)}K/yr`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OffersPage() {
  const [offers, setOffers]   = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.get('/offers')
      .then(({ data }) => setOffers(data.data))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      await api.patch(`/offers/${id}/status`, { status })
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } catch { /* silent */ } finally { setUpdating(null) }
  }

  const stats = {
    total:    offers.length,
    sent:     offers.filter(o => o.status === 'sent').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    pending:  offers.filter(o => o.status === 'draft').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-muted-foreground text-sm">{stats.total} offers total</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-sm border px-3 py-2 rounded-lg hover:bg-muted disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Offers', value: stats.total,    color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Sent',         value: stats.sent,     color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Accepted',     value: stats.accepted, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Draft',        value: stats.pending,  color: 'text-gray-600',   bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No offers yet</p>
            <p className="text-xs mt-1">Offers are created from the Applications page when a candidate is selected.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {['Candidate', 'Position', 'CTC', 'Status', 'Valid Till', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.candidate_name}</p>
                    {o.candidate_email && <p className="text-xs text-muted-foreground">{o.candidate_email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-muted-foreground">{o.job_title}</p>
                    {o.job_code && <p className="text-xs text-muted-foreground">{o.job_code}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCTC(o.offered_ctc)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[o.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.valid_till)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {o.status === 'draft' && (
                        <button disabled={updating === o.id}
                          onClick={() => updateStatus(o.id, 'sent')}
                          className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50">
                          {updating === o.id ? '…' : 'Send'}
                        </button>
                      )}
                      {o.status === 'sent' && (
                        <>
                          <button disabled={updating === o.id}
                            onClick={() => updateStatus(o.id, 'accepted')}
                            className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50">
                            Accept
                          </button>
                          <button disabled={updating === o.id}
                            onClick={() => updateStatus(o.id, 'declined')}
                            className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50">
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
