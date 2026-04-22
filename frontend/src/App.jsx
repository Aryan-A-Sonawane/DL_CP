import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowRightLeft,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Masters from './pages/Masters';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/masters', icon: Users, label: 'People' },
  { to: '/transactions', icon: ArrowRightLeft, label: 'Analyze' },
  { to: '/reports', icon: ShieldCheck, label: 'Audit' },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        {/* ── Top Navigation Bar ─────────────── */}
        <header className="top-nav">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 no-underline">
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
            </NavLink>

            {/* Nav Links */}
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span className="text-xs font-medium text-surface-500">
                  Ethical AI Active
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content ────────────────────── */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/masters" element={<Masters />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        {/* ── Footer ──────────────────────────── */}
        <footer className="border-t border-surface-200 bg-white/50">
          <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <Sparkles size={12} />
              <span>PASSIONIT + PRUTL Compliant</span>
            </div>
            <p className="text-xs text-surface-400">
              Ethical AI — No demographic data used in analysis
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
