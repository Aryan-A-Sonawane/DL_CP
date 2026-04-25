import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Failure-to-Role Mapping",
  description:
    "Ethical AI platform that turns failure patterns into growth-aligned role recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
          <footer className="border-t border-surface-200 bg-white/50 mt-auto">
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
      </body>
    </html>
  );
}
