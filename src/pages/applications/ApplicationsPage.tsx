import { FileText } from 'lucide-react'

export default function ApplicationsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Applications</h1>
      <div className="bg-card border rounded-xl p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">All Applications</p>
        <p className="text-sm text-muted-foreground mt-1">View and manage all candidate applications across all jobs</p>
      </div>
    </div>
  )
}
