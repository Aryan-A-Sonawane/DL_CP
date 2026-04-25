import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppNav from "@/components/AppNav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <AppNav
        role={user.role}
        userName={user.name}
        orgName={user.organization?.name ?? null}
      />
      <main className="mx-auto w-full max-w-7xl px-6 py-8 flex-1">
        {children}
      </main>
    </>
  );
}
