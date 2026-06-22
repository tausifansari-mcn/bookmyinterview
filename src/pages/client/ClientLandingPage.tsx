import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Users, BarChart3, Shield, CheckCircle2,
  ArrowRight, Star, Zap, Globe, Building2, Phone,
  Brain, Target, TrendingUp, Award, HeartHandshake,
  ChevronRight, Play,
} from 'lucide-react'

const STATS = [
  { value: '23+', label: 'Years of Experience' },
  { value: '250+', label: 'Clients Served' },
  { value: '97%', label: 'Client Retention' },
  { value: '2500+', label: 'Team Members' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Briefcase,
    title: 'Post Your Job',
    desc: 'Create detailed job listings with requirements, skills, and descriptions. Our AI extracts key criteria automatically.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    step: '02',
    icon: Users,
    title: 'Candidates Apply',
    desc: 'Candidates register, complete their profiles, and apply. Our portal guides them through each step seamlessly.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    step: '03',
    icon: Brain,
    title: 'AI 3-Gate Screening',
    desc: 'Every applicant is scored on Profile Completeness, Assessment Test, and a Video/Voice Introduction — automatically.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    step: '04',
    icon: CheckCircle2,
    title: 'Interview Ready Candidates',
    desc: 'Only candidates who clear all 3 gates reach your interview schedule. Zero noise, only the best.',
    color: 'from-rose-500 to-pink-500',
  },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Screening',
    desc: 'Our 3-gate system (Profile 95% · Assessment 80% · Intro 80%) ensures every candidate you meet is pre-qualified.',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Target,
    title: 'Smart Job Matching',
    desc: 'AI matches candidates to job requirements with precision — reducing time-to-hire by up to 60%.',
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Track applications, stage movements, assessment scores, and hiring funnel metrics in one dashboard.',
    accent: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: Play,
    title: 'Video / Voice Intros',
    desc: 'Watch or listen to candidate self-introductions before you ever schedule a call. Evaluate communication instantly.',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: TrendingUp,
    title: 'Kanban Pipeline',
    desc: 'Move candidates through stages visually — from Application Received all the way to Hired.',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'ISO 27001 Certified',
    desc: 'Enterprise-grade data security and compliance. Your candidate data is protected at every step.',
    accent: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

const INDUSTRIES = [
  'Banking & Financial Services', 'Insurance', 'Healthcare',
  'Retail & E-commerce', 'Telecommunications', 'FMCG',
  'Automotive Services', 'EV Support', 'Aviation', 'Logistics',
]

const TESTIMONIALS = [
  {
    quote: 'Book My Interview has brought efficiency and cost-effectiveness into our hiring operations. The AI screening is a game-changer.',
    name: 'Mukesh Jain',
    role: 'CEO, Doorserve Solution',
    initials: 'MJ',
    color: 'from-amber-500 to-orange-500',
  },
  {
    quote: 'We got fully developed infrastructure and manpower pipeline at the most competitive cost. Exceptional platform.',
    name: 'Pramod Kumar Pandey',
    role: 'Manager After Sales, Usha SriRam',
    initials: 'PP',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    quote: 'The platform provides accurate candidate capture and timely alerts. It\'s a vital tool supporting our business growth.',
    name: 'Vineet Lather',
    role: 'Engineer, Spheros Motherson',
    initials: 'VL',
    color: 'from-emerald-500 to-teal-500',
  },
]

const GATES = [
  { label: 'Profile Completion', threshold: '≥ 95%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { label: 'Assessment Score', threshold: '≥ 80%', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-100' },
  { label: 'Intro Score', threshold: '≥ 80%', icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(target / 40)
    const id = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(id) }
      else setVal(start)
    }, 30)
    return () => clearInterval(id)
  }, [target])
  return <>{val}{suffix}</>
}

export default function ClientLandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 hidden sm:block">Book My Interview</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/client/login"
              className="text-[13px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5">
              Sign In
            </Link>
            <a href="tel:+919667195550"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors">
              <Phone className="h-3.5 w-3.5" />+91 96671 95550
            </a>
            <Link to="/client/login"
              className="flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90 shadow-md"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32"
        style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff 40%, #eff6ff 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 -translate-y-1/2 translate-x-1/3"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 translate-y-1/3 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 mb-6">
            <Zap className="h-3.5 w-3.5" /> AI-Powered Recruitment Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Hire Smarter with{' '}
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Screened
            </span>{' '}
            Candidates
          </h1>

          <p className="mt-5 text-[17px] text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            Book My Interview automates candidate screening through a 3-gate AI system — Profile, Assessment, and Video Introduction — so you only meet interview-ready talent.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/client/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
              Start Hiring Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="tel:+919667195550"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:border-amber-300">
              <Phone className="h-4 w-4 text-amber-600" /> Schedule a Call
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[12px] text-zinc-400 font-medium">
            {['ISO 27001 Certified', '24/7 Support', 'No Setup Fee', 'GDPR Compliant'].map(b => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="py-12 border-y border-zinc-100 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => {
            const num = parseInt(value)
            const suffix = value.replace(String(num), '')
            return (
              <div key={label} className="text-center">
                <p className="text-4xl font-black text-zinc-900">
                  <Counter target={num} suffix={suffix} />
                </p>
                <p className="text-[13px] text-zinc-500 mt-1 font-medium">{label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 3-GATE SYSTEM ───────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Our AI Screening System</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">The 3-Gate Quality Filter</h2>
            <p className="mt-3 text-[15px] text-zinc-500 max-w-xl mx-auto">Every candidate must pass all three gates before they can be scheduled for an interview with you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {GATES.map(({ label, threshold, icon: Icon, color, bg }, i) => (
              <div key={label} className="relative bg-white rounded-3xl border border-zinc-100 shadow-md p-7 text-center hover:shadow-xl transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg">
                  {i + 1}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mx-auto mt-2 mb-4`}>
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
                <p className="text-[15px] font-bold text-zinc-900 mb-1">{label}</p>
                <p className={`text-[24px] font-black ${color}`}>{threshold}</p>
                <p className="text-[12px] text-zinc-400 mt-1">Minimum to qualify</p>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-[13px] text-zinc-400">
            Candidates who don't meet all three thresholds are automatically filtered — saving your team hours of screening time.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8" style={{ background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">From Job Post to Interview in 4 Steps</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-5 right-5 text-[36px] font-black text-zinc-50 leading-none select-none">{step}</div>
                <p className="text-[15px] font-bold text-zinc-900 mb-2">{title}</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Platform Features</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Everything You Need to Hire Better</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, accent, bg }) => (
              <div key={title} className="group bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 hover:shadow-xl hover:border-zinc-200 transition-all cursor-default">
                <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5.5 w-5.5 ${accent}`} />
                </div>
                <p className="text-[15px] font-bold text-zinc-900 mb-2">{title}</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 rounded-3xl mx-4 sm:mx-8 mb-8"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-indigo-300 bg-indigo-900/50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Built on 23 Years of Excellence</h2>
            <p className="mt-3 text-[15px] text-indigo-300 max-w-xl mx-auto">Mas Callnet's People–Process–Technology framework powers every feature of Book My Interview.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Award, title: 'Deep Expertise', desc: '23+ years in customer experience and business process management across all major industries.' },
              { icon: Zap, title: 'AI Technology', desc: 'Advanced automation, sentiment analysis, and AI scoring built into every step of the hiring flow.' },
              { icon: Shield, title: 'Compliance Ready', desc: 'ISO 27001 certified. Enterprise data security, privacy protection, and industry compliance built-in.' },
              { icon: HeartHandshake, title: 'True Partnership', desc: '97% client retention rate — we grow with you. Dedicated support and long-term relationships.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-indigo-300" />
                </div>
                <p className="text-[15px] font-bold text-white mb-2">{title}</p>
                <p className="text-[13px] text-indigo-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ──────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Industries</span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">Trusted Across 10+ Sectors</h2>
          <p className="text-[15px] text-zinc-500 mb-10 max-w-lg mx-auto">From BFSI to Aviation — our platform adapts to the hiring needs of every major industry.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(ind => (
              <span key={ind} className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[13px] font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-default">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />{ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, initials, color }) => (
              <div key={name} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-7 flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-[14px] text-zinc-600 leading-relaxed flex-1">"{quote}"</p>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-zinc-50">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-[12px] font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-zinc-900">{name}</p>
                    <p className="text-[11px] text-zinc-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8 text-center"
        style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-[15px] text-zinc-500 mb-8 leading-relaxed">
            Join 250+ companies already using Book My Interview to find and screen top talent — faster, smarter, and at scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/client/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[16px] font-bold text-white shadow-xl transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 12px 32px rgba(245,158,11,0.4)' }}>
              Login to Your Dashboard <ChevronRight className="h-5 w-5" />
            </Link>
            <a href="tel:+919667195550"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[16px] font-bold text-zinc-700 bg-white border-2 border-zinc-200 hover:border-amber-300 transition-all shadow-sm">
              <Phone className="h-5 w-5 text-amber-600" />+91 96671 95550
            </a>
          </div>
          <p className="mt-5 text-[12px] text-zinc-400">No credit card required · 24/7 support · Setup in minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/mas-call-logo.png" alt="" className="h-7 w-7 rounded-lg object-cover opacity-80" />
            <span className="text-[14px] font-bold text-zinc-300">Book My Interview</span>
            <span className="text-[12px] text-zinc-600 ml-1">by MasCallnet.ai</span>
          </div>
          <div className="flex items-center gap-5 text-[12px]">
            <a href="https://mascallnet.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200 transition-colors">Privacy Policy</a>
            <a href="https://mascallnet.ai/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200 transition-colors">Terms</a>
            <Link to="/client/login" className="hover:text-zinc-200 transition-colors">Client Login</Link>
          </div>
          <p className="text-[12px] text-zinc-600">© 2026 MasCallnet.ai · All rights reserved</p>
        </div>
      </footer>

    </div>
  )
}
