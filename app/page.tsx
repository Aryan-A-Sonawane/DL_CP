import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Brain,
  Shield,
  Heart,
  Target,
  Activity,
  ArrowRight,
  Users,
  Building2,
  GitBranch,
  LineChart,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="animate-fade-in">
      <header className="top-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-surface-900">
                Failure-to-Role Mapping
              </h1>
              <p className="text-[10px] font-medium text-surface-400 tracking-wider uppercase">
                Pattern Mining · Growth Alignment
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="nav-link">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary">
              Create organization
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-20">
        {/* Hero */}
        <section className="mesh-gradient rounded-3xl bg-white border border-surface-200 px-10 py-16 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-1.5 mb-5">
              <Sparkles size={14} className="text-primary-500" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                Failure Intelligence Mapper
              </span>
            </div>
            <h2 className="text-5xl font-extrabold text-surface-900 leading-tight tracking-tight">
              Turn employee setbacks into
              <span className="bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
                {" "}
                better-aligned roles
              </span>
            </h2>
            <p className="mt-5 text-lg text-surface-500 leading-relaxed max-w-2xl">
              A multi-role workforce analytics platform. Department heads upload
              cycle reports, the engine extracts failure patterns, resilience and
              leadership signals, and recommends roles where each person will
              actually thrive — with full explainability.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                Create your organization
                <ArrowRight size={14} />
              </Link>
              <Link href="/join" className="btn-ghost inline-flex items-center gap-2">
                Join with an invite code
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-surface-500">
              {[
                "Cosine-similarity role matching",
                "PASSIONIT + PRUTL audited",
                "No demographic features",
                "Per-cycle reminders",
              ].map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-surface-900">One platform, four lenses</h3>
            <p className="mt-2 text-sm text-surface-500">
              Every stakeholder sees what they need — and only what they need.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {ROLES.map((r, i) => (
              <div
                key={r.title}
                className="card p-6 animate-slide-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${r.bg}`}>
                  <r.icon size={18} className={r.color} />
                </div>
                <h4 className="mt-4 font-semibold text-surface-900">{r.title}</h4>
                <p className="mt-1.5 text-sm text-surface-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-surface-900">Failure Intelligence Mapper</h3>
            <p className="mt-2 text-sm text-surface-500">
              Ten composable signals power every role recommendation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="card-soft p-6 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon size={16} className={f.color} />
                </div>
                <h4 className="mt-4 font-semibold text-surface-900">{f.title}</h4>
                <p className="mt-1 text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="card p-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-surface-900">How it works</h3>
            <p className="mt-2 text-sm text-surface-500">
              Set up in minutes. Insights every cycle.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-sm font-bold border border-primary-100">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold text-surface-900">{s.title}</h4>
                </div>
                <p className="text-sm text-surface-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-br from-primary-600 to-violet-600 px-10 py-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="text-3xl font-extrabold leading-tight">
              Ready to map your team&apos;s growth pathways?
            </h3>
            <p className="mt-3 text-primary-50/90 text-sm leading-relaxed">
              Create your organization in under a minute. Invite your team, upload
              your first cycle report, and see role recommendations the same day.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-md hover:shadow-lg transition"
              >
                Get started
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur px-5 py-2.5 text-sm font-semibold text-white border border-white/20 hover:bg-white/20 transition"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const ROLES = [
  {
    title: "Employee",
    desc: "See your own progress, give feedback on suggested roles, log new skills and certifications.",
    icon: Users,
    bg: "bg-primary-50",
    color: "text-primary-600",
  },
  {
    title: "Department Head",
    desc: "Manage projects and assignments, upload cycle reports, set the cycle duration, get reminders.",
    icon: GitBranch,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
  },
  {
    title: "Org Admin",
    desc: "Create departments, assign heads, monitor org-wide health and pipeline of role suggestions.",
    icon: Building2,
    bg: "bg-violet-50",
    color: "text-violet-600",
  },
  {
    title: "Super Admin",
    desc: "Manage every organization on the platform, escalate support, audit ethical compliance.",
    icon: Shield,
    bg: "bg-amber-50",
    color: "text-amber-600",
  },
];

const FEATURES = [
  { title: "Failure Pattern Analysis", desc: "Weighted scoring across category × severity × recency.", icon: Activity, bg: "bg-primary-50", color: "text-primary-600" },
  { title: "Resilience Index", desc: "Recovery speed, outcome trend and soft-skill buffering.", icon: Shield, bg: "bg-emerald-50", color: "text-emerald-600" },
  { title: "Growth-After-Setback", desc: "Track improvement deltas across consecutive cycles.", icon: TrendingUp, bg: "bg-amber-50", color: "text-amber-600" },
  { title: "Leadership Extraction", desc: "Surface leadership signal from conflict resolution and high-severity recovery.", icon: Brain, bg: "bg-violet-50", color: "text-violet-600" },
  { title: "Adaptive Role Re-Matching", desc: "Cosine similarity over skill + experience vectors against 10 reference roles.", icon: Target, bg: "bg-primary-50", color: "text-primary-600" },
  { title: "Causal Experience Mapping", desc: "Trace which past events most predict each strength.", icon: GitBranch, bg: "bg-emerald-50", color: "text-emerald-600" },
  { title: "Emotional Recovery Modeling", desc: "Exponential decay over impact diminishment.", icon: Heart, bg: "bg-pink-50", color: "text-pink-600" },
  { title: "Transformational Learning Score", desc: "Improvement rate × recovery trend.", icon: Sparkles, bg: "bg-amber-50", color: "text-amber-600" },
  { title: "Long-Term Leadership Forecast", desc: "Project leadership readiness 4 cycles ahead.", icon: LineChart, bg: "bg-violet-50", color: "text-violet-600" },
];

const STEPS = [
  { title: "Create your org", desc: "Sign up and you become the Org Admin." },
  { title: "Set up departments", desc: "Add departments, invite heads via email & code." },
  { title: "Upload cycle data", desc: "Dept heads upload Excel reports per cycle. Reminders auto-trigger." },
  { title: "See growth paths", desc: "Engine produces explainable, role-aligned recommendations." },
];
