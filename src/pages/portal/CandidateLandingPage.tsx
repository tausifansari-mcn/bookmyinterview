import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Star, Zap, Phone,
  Briefcase, Users, Brain, Play, Shield, TrendingUp,
  FileText, Award, ChevronRight, UserPlus, Target,
  Building2, Globe, MapPin,
} from 'lucide-react'

const STATS = [
  { value: '500+', label: 'Jobs Available' },
  { value: '250+', label: 'Hiring Companies' },
  { value: '10K+', label: 'Candidates Placed' },
  { value: '97%', label: 'Satisfaction Rate' },
]

const STEPS = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    desc: 'Register and build a complete profile — work experience, education, skills, and career goals. 95% completion unlocks Gate 1.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    step: '02',
    icon: Brain,
    title: 'Take the Assessment',
    desc: 'Attempt our AI-powered skill assessment tailored to your target role. Score 80% or above to clear Gate 2.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    step: '03',
    icon: Play,
    title: 'Record Your Introduction',
    desc: 'Upload a 30–90 second voice or video introduction. Our AI scores your communication skills for Gate 3.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    step: '04',
    icon: Briefcase,
    title: 'Apply & Get Hired',
    desc: 'Browse jobs, apply with one click, and get directly scheduled for interviews — no waiting, no guesswork.',
    color: 'from-rose-500 to-pink-500',
  },
]

const BENEFITS = [
  {
    icon: Target,
    title: 'AI Job Matching',
    desc: 'Our AI matches your profile, skills, and experience to the most relevant open positions across 10+ industries.',
    accent: 'text-indigo-600', bg: 'bg-indigo-50',
  },
  {
    icon: Brain,
    title: 'Skill Assessment',
    desc: 'Role-specific assessments that validate your expertise and increase your visibility to top hiring companies.',
    accent: 'text-violet-600', bg: 'bg-violet-50',
  },
  {
    icon: Play,
    title: 'Video Introduction',
    desc: 'Showcase your personality and communication skills through a short video/voice intro — before any interview.',
    accent: 'text-emerald-600', bg: 'bg-emerald-50',
  },
  {
    icon: TrendingUp,
    title: 'Track Applications',
    desc: 'Real-time pipeline visibility — know exactly where you stand at every stage of every application.',
    accent: 'text-amber-600', bg: 'bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Verified Employers',
    desc: 'Every company on our platform is verified and ISO-compliant. No spam, no fake jobs, no wasted time.',
    accent: 'text-rose-600', bg: 'bg-rose-50',
  },
  {
    icon: Award,
    title: 'Instant Feedback',
    desc: 'Get AI feedback on your assessment and introduction — know your strengths and where to improve.',
    accent: 'text-blue-600', bg: 'bg-blue-50',
  },
]

const INDUSTRIES = [
  'Banking & Finance', 'Insurance', 'Healthcare', 'Retail & E-commerce',
  'Telecom', 'FMCG', 'Automotive', 'EV & Mobility', 'Aviation', 'Logistics',
]

const TESTIMONIALS = [
  {
    quote: 'The AI screening gave me instant feedback on my video introduction. I knew exactly how to improve. Got hired within 2 weeks!',
    name: 'Priya Sharma',
    role: 'Software Engineer at TechCorp',
    initials: 'PS',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    quote: "The 3-gate system made me take my profile seriously. When I finally cleared all gates, I got 3 interview calls in the same week!",
    name: 'Rahul Mehta',
    role: 'Sales Manager at FinServ India',
    initials: 'RM',
    color: 'from-amber-500 to-orange-500',
  },
  {
    quote: 'Finally a platform that shows real-time application status. No more wondering if your resume was even read.',
    name: 'Sneha Patel',
    role: 'HR Business Partner at Retail Co',
    initials: 'SP',
    color: 'from-emerald-500 to-teal-500',
  },
]

const GATES = [
  { num: 1, label: 'Profile Completion', threshold: '≥ 95%', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { num: 2, label: 'Assessment Score',   threshold: '≥ 80%', icon: Brain,     color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { num: 3, label: 'Intro Score',        threshold: '≥ 80%', icon: Play,      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
]

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let n = 0
    const step = Math.ceil(target / 40)
    const id = setInterval(() => {
      n += step
      if (n >= target) { setVal(target); clearInterval(id) } else setVal(n)
    }, 28)
    return () => clearInterval(id)
  }, [target])
  return <>{val}{suffix}</>
}

export default function CandidateLandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2.5 shrink-0">
            <img src="/mas-call-logo.png" alt="Book My Interview" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-zinc-900 hidden sm:block">Book My Interview</span>
          </Link>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-zinc-500">
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-zinc-900 transition-colors">Benefits</a>
            <a href="#industries" className="hover:text-zinc-900 transition-colors">Industries</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a href="tel:+919667195550"
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors">
              <Phone className="h-3 w-3" />Help
            </a>
            <Link to="/portal/login"
              className="text-[13px] font-semibold text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 px-4 py-2 rounded-xl transition-all bg-white hover:bg-zinc-50">
              Login
            </Link>
            <Link to="/portal/register"
              className="flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90 shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #fff 45%, #f0fdf4 100%)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 translate-y-1/3 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 mb-6">
            <Zap className="h-3.5 w-3.5" /> AI-Powered Career Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 leading-[1.1] tracking-tight max-w-4xl mx-auto">
            Land Your Dream Job with{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Powered
            </span>{' '}
            Screening
          </h1>

          <p className="mt-5 text-[17px] text-zinc-500 leading-relaxed max-w-2xl mx-auto">
            Complete your profile, pass 3 AI-powered gates, and get directly scheduled for interviews with top companies — no cold calls, no ghosting.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/portal/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              <UserPlus className="h-5 w-5" /> Create Free Account
            </Link>
            <Link to="/portal/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[15px] font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
              Already have an account? Login <ChevronRight className="h-4 w-4 text-indigo-500" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[12px] text-zinc-400 font-medium">
            {['Free to join', 'No spam', 'Real companies only', 'AI feedback on every step'].map(b => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="py-12 border-y border-zinc-100 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => {
            const num = parseInt(value.replace(/\D/g, ''))
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

      {/* ── 3-GATE SYSTEM ──────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[12px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Our Screening System</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Pass 3 Gates. Get Interviewed.</h2>
            <p className="mt-3 text-[15px] text-zinc-500 max-w-xl mx-auto">Clear all three AI-scored gates and companies will schedule interviews directly with you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {GATES.map(({ num, label, threshold, icon: Icon, color, bg, border }) => (
              <div key={label} className={`relative bg-white rounded-3xl border ${border} shadow-sm p-7 text-center hover:shadow-xl transition-shadow`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-lg">
                  {num}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mx-auto mt-2 mb-4`}>
                  <Icon className={`h-7 w-7 ${color}`} />
                </div>
                <p className="text-[15px] font-bold text-zinc-900 mb-1">{label}</p>
                <p className={`text-[28px] font-black ${color}`}>{threshold}</p>
                <p className="text-[12px] text-zinc-400 mt-1">Required to qualify</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/portal/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">From Registration to Offer in 4 Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-5 right-5 text-[38px] font-black text-zinc-50 leading-none select-none">{step}</div>
                <p className="text-[15px] font-bold text-zinc-900 mb-2">{title}</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ───────────────────────────────────────────── */}
      <section id="benefits" className="py-20 px-5 sm:px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[12px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Why Candidates Love Us</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Your Unfair Advantage in the Job Market</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ icon: Icon, title, desc, accent, bg }) => (
              <div key={title} className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 hover:shadow-lg transition-all">
                <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-5 w-5 ${accent}`} />
                </div>
                <p className="text-[15px] font-bold text-zinc-900 mb-2">{title}</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK BANNER ────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 mx-4 sm:mx-8 my-4 rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Backed by 23 Years of Expertise</h2>
            <p className="text-[15px] text-indigo-300 max-w-xl mx-auto">Book My Interview is powered by MasCallnet.ai — India's leading customer experience and talent solutions company.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { icon: Building2, title: '250+ Companies', desc: 'Verified hiring partners across all major industries' },
              { icon: Users,     title: '2500+ Team',    desc: 'Experts supporting your job search journey' },
              { icon: Globe,     title: '10 Industries', desc: 'From BFSI to Aviation — we cover it all' },
              { icon: Shield,    title: 'ISO Certified', desc: 'Your data is secure, private, and compliant' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center">
                <Icon className="h-7 w-7 text-indigo-400 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-white mb-1">{title}</p>
                <p className="text-[12px] text-indigo-300 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ─────────────────────────────────────────── */}
      <section id="industries" className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[12px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Industries</span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">Opportunities Across 10+ Sectors</h2>
          <p className="text-[15px] text-zinc-500 mb-10 max-w-lg mx-auto">Find your perfect role in the industry you love most.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(ind => (
              <span key={ind} className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[13px] font-semibold text-zinc-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors cursor-default">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />{ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[12px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Success Stories</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Candidates Who Made It</h2>
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

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8 text-center"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">Ready to Find Your Next Job?</h2>
          <p className="text-[15px] text-zinc-500 mb-8 leading-relaxed">
            Join thousands of candidates who use Book My Interview to connect with top companies — faster, smarter, and with AI on their side.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/portal/register"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[16px] font-bold text-white shadow-xl transition-all hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 12px 32px rgba(99,102,241,0.4)' }}>
              <UserPlus className="h-5 w-5" /> Create Free Account
            </Link>
            <Link to="/portal/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[16px] font-bold text-zinc-700 bg-white border-2 border-zinc-200 hover:border-indigo-300 transition-all shadow-sm">
              Already registered? Login <ChevronRight className="h-5 w-5 text-indigo-500" />
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-zinc-400">Free to join · No credit card · 2-minute setup</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-zinc-900 text-zinc-400 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/mas-call-logo.png" alt="" className="h-7 w-7 rounded-lg object-cover opacity-80" />
            <span className="text-[14px] font-bold text-zinc-300">Book My Interview</span>
            <span className="text-[12px] text-zinc-600 ml-1">by MasCallnet.ai</span>
          </div>
          <div className="flex items-center gap-5 text-[12px]">
            <Link to="/portal/login" className="hover:text-zinc-200 transition-colors">Login</Link>
            <Link to="/portal/register" className="hover:text-zinc-200 transition-colors">Register</Link>
            <a href="tel:+919667195550" className="hover:text-zinc-200 transition-colors">+91 96671 95550</a>
          </div>
          <p className="text-[12px] text-zinc-600">© 2026 MasCallnet.ai · All rights reserved</p>
        </div>
      </footer>

    </div>
  )
}
