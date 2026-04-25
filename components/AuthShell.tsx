import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mesh-gradient min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-3 no-underline">
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
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-surface-900">{title}</h2>
            <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          {footer && (
            <div className="mt-5 text-center text-sm text-surface-500">{footer}</div>
          )}
        </div>
      </main>
    </div>
  );
}
