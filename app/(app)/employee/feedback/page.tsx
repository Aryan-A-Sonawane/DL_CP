import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FeedbackClient from "./FeedbackClient";

export const dynamic = "force-dynamic";

export default async function EmployeeFeedbackPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") redirect("/dashboard");

  const suggestions = await prisma.roleSuggestion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { feedback: { where: { userId: user.id }, take: 1 } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Role feedback</h2>
        <p className="mt-1 text-sm text-surface-500">
          Tell us how each suggested role lands for you. Your feedback trains the model — we
          store it and treat it as ground-truth signal.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <ClipboardList size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">
            No suggestions yet — once your dept head uploads a cycle, recommendations appear here.
          </p>
        </div>
      ) : (
        <FeedbackClient
          items={suggestions.map((s) => ({
            id: s.id,
            suggestedRole: s.suggestedRole,
            matchScore: s.matchScore,
            createdAt: s.createdAt.toLocaleDateString(),
            existingFeedback: s.feedback[0]
              ? {
                  decision: s.feedback[0].decision,
                  desiredRole: s.feedback[0].desiredRole,
                  reason: s.feedback[0].reason,
                }
              : null,
          }))}
        />
      )}
    </div>
  );
}
