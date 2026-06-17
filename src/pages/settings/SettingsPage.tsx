import { Settings, Users, Mail, Key, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid gap-3">
        {[
          { icon: Users,    title: 'Team Members',       desc: 'Manage recruiters, HR managers and interviewers' },
          { icon: Mail,     title: 'Email Templates',    desc: 'Customize automated candidate emails' },
          { icon: Key,      title: 'API & Integrations', desc: 'Connect Naukri, LinkedIn, BGV providers' },
          { icon: Database, title: 'Pipeline Stages',    desc: 'Customize your hiring pipeline stages' },
          { icon: Settings, title: 'Company Profile',    desc: 'Update company name, logo and timezone' },
        ].map(({ icon: Icon, title, desc }) => (
          <button key={title} className="bg-card border rounded-xl p-4 flex items-center gap-4 text-left hover:border-primary/50 hover:shadow-sm transition-all">
            <div className="p-2.5 bg-muted rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
