import { redirect } from "next/navigation";
import { defaultDashboardPath, getCurrentUser, type Role } from "@/lib/auth";

export default async function DashboardRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(defaultDashboardPath(user.role as Role));
}
