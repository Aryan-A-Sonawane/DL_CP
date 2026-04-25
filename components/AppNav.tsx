"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShieldCheck,
  Building2,
  GitBranch,
  LogOut,
  User as UserIcon,
  FolderKanban,
  ClipboardList,
  Globe2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

const NAV: Record<string, NavItem[]> = {
  EMPLOYEE: [
    { to: "/employee", icon: LayoutDashboard, label: "My Dashboard", exact: true },
    { to: "/employee/profile", icon: UserIcon, label: "Profile & Growth" },
    { to: "/employee/feedback", icon: ClipboardList, label: "Role Feedback" },
  ],
  DEPT_HEAD: [
    { to: "/dept", icon: LayoutDashboard, label: "Overview", exact: true },
    { to: "/dept/projects", icon: FolderKanban, label: "Projects" },
    { to: "/dept/people", icon: Users, label: "People" },
    { to: "/dept/uploads", icon: ClipboardList, label: "Uploads" },
    { to: "/dept/settings", icon: GitBranch, label: "Cycle Settings" },
  ],
  ADMIN: [
    { to: "/admin", icon: LayoutDashboard, label: "Org Overview", exact: true },
    { to: "/admin/departments", icon: Building2, label: "Departments" },
    { to: "/admin/people", icon: Users, label: "People" },
    { to: "/admin/audit", icon: ShieldCheck, label: "Audit" },
  ],
  SUPER_ADMIN: [
    { to: "/super", icon: LayoutDashboard, label: "Platform", exact: true },
    { to: "/super/orgs", icon: Globe2, label: "Organizations" },
    { to: "/super/audit", icon: ShieldCheck, label: "Compliance" },
  ],
};

export default function AppNav({
  role,
  userName,
  orgName,
}: {
  role: string;
  userName: string;
  orgName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV[role] ?? [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="top-nav">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={items[0]?.to ?? "/"} className="flex items-center gap-3 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-surface-900">
              {orgName ?? "Failure-to-Role Mapping"}
            </h1>
            <p className="text-[10px] font-medium text-surface-400 tracking-wider uppercase">
              {roleLabel(role)}
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {items.map(({ to, icon: Icon, label, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="pulse-dot" />
            <span className="text-xs font-medium text-surface-500">{userName}</span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-xl bg-surface-50 border border-surface-200 p-2 text-surface-500 transition hover:bg-surface-100 hover:text-surface-700"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin · Platform";
    case "ADMIN":
      return "Org Admin";
    case "DEPT_HEAD":
      return "Department Head";
    case "EMPLOYEE":
    default:
      return "Employee";
  }
}
