"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShieldCheck,
  ArrowRightLeft,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/masters", icon: Users, label: "People" },
  { to: "/transactions", icon: ArrowRightLeft, label: "Analyze" },
  { to: "/reports", icon: ShieldCheck, label: "Audit" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
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

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

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
  );
}
