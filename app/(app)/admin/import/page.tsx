import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !user.orgId) redirect("/dashboard");

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Bulk import employees</h2>
        <p className="mt-1 text-sm text-surface-500">
          Onboard your entire workforce in one shot. Download the template,
          fill it in with HR&apos;s help, and upload it back. Re-uploading the
          same file is safe — fields are updated in place.
        </p>
      </div>

      <ImportClient organizationName={user.organization?.name ?? "your organization"} />
    </div>
  );
}
