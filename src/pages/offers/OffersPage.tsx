import { Gift } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const offers = [
  { candidate: 'Vikram Singh',  job: 'Sr. CCE',     ctc: 240000, status: 'sent',     expiry: '2026-06-20' },
  { candidate: 'Ritu Agarwal', job: 'Team Leader',  ctc: 360000, status: 'accepted', expiry: '2026-06-18' },
  { candidate: 'Mohan Das',    job: 'QA Analyst',   ctc: 300000, status: 'declined', expiry: '2026-06-15' },
]

const statusColor: Record<string,string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function OffersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Offers</h1>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
          <Gift className="h-4 w-4" /> Create Offer
        </button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              {['Candidate', 'Position', 'CTC', 'Status', 'Expiry', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {offers.map((o, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{o.candidate}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.job}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(o.ctc)}/yr</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.expiry}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-primary font-medium hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
