import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { activeCycleWindow } from "@/lib/cycles";
import UploadClient from "./UploadClient";

export const dynamic = "force-dynamic";

export default async function DeptUploadsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD" || !user.departmentId) redirect("/dashboard");

  const dept = await prisma.department.findUnique({ where: { id: user.departmentId } });
  if (!dept) redirect("/dashboard");

  const cycle = activeCycleWindow(dept.cycleAnchor, dept.cycleLengthDays);
  const uploads = await prisma.excelUpload.findMany({
    where: { departmentId: dept.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { uploadedBy: { select: { name: true } } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Cycle uploads</h2>
        <p className="mt-1 text-sm text-surface-500">
          Upload your weekly / cycle Excel report. The platform will parse it, map rows to
          employees, compute avg turn-around time and run the Failure Intelligence Mapper.
        </p>
      </div>

      <UploadClient
        cycleStart={cycle.start.toISOString()}
        cycleEnd={cycle.end.toISOString()}
      />

      <section className="card p-7">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={16} className="text-primary-500" />
          <h3 className="text-lg font-bold text-surface-900">Recent uploads</h3>
        </div>
        {uploads.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">No uploads yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>File</th>
                  <th>Cycle</th>
                  <th>Rows</th>
                  <th>Uploaded by</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id}>
                    <td>{u.createdAt.toLocaleString()}</td>
                    <td className="font-mono text-xs">{u.fileName}</td>
                    <td>
                      {u.cycleStart.toLocaleDateString()} →{" "}
                      {u.cycleEnd.toLocaleDateString()}
                    </td>
                    <td>{u.rowCount}</td>
                    <td>{u.uploadedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-6 py-4">
        <p className="text-xs text-primary-600/70 leading-relaxed">
          <strong>Expected columns:</strong> emp name, emp id (primary key), email, project,
          organization, productivity cycles, hours per cycle, hours worked, defects, time
          required to fix defects. Header row casing and minor wording variations are handled.
        </p>
      </div>
    </div>
  );
}
