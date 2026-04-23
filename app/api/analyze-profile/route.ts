import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  computeFailureScore,
  computeGrowthTrajectory,
  computeTransformationalLearningScore,
} from "@/lib/engine/failureAnalyzer";
import {
  computeResilienceIndex,
  computeEmotionalRecoveryScore,
} from "@/lib/engine/resilience";
import { matchRoles } from "@/lib/engine/roleMatcher";
import { computeLeadershipScore } from "@/lib/engine/leadership";
import {
  generateFeatureImportance,
  generateExplanationText,
} from "@/lib/engine/explainability";
import type { FailureEventInput, StrengthInput } from "@/lib/engine/types";

export async function POST(req: Request) {
  let body: { employee_id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  const employeeId = Number(body.employee_id);
  if (!Number.isFinite(employeeId)) {
    return NextResponse.json({ detail: "employee_id required" }, { status: 400 });
  }

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { failureEvents: true, strengths: true },
  });
  if (!emp) {
    return NextResponse.json({ detail: "Employee not found" }, { status: 404 });
  }

  const events: FailureEventInput[] = emp.failureEvents.map((e) => ({
    category: e.category,
    description: e.description,
    severity: e.severity,
    date: e.date,
    recoveryTimeDays: e.recoveryTimeDays,
    outcomeAfter: e.outcomeAfter,
  }));

  const strengths: StrengthInput[] = emp.strengths.map((s) => ({
    name: s.name,
    score: s.score,
    source: s.source,
  }));

  const failureScore = computeFailureScore(events);
  const growthTraj = computeGrowthTrajectory(events);
  const resilience = computeResilienceIndex(events, emp.softSkillScore);
  const emotionalRecovery = computeEmotionalRecoveryScore(events);
  const leadership = computeLeadershipScore(events, strengths, emp.softSkillScore);
  const tls = computeTransformationalLearningScore(events);

  const matched = matchRoles(strengths, events, emp.softSkillScore, resilience, 3);

  const featureImp = generateFeatureImportance(
    events,
    strengths,
    resilience,
    emp.softSkillScore,
    leadership,
  );

  if (matched.length) {
    const top = matched[0];
    const explanation = generateExplanationText(
      emp.name,
      top.role,
      top.match_score,
      events,
      strengths,
      resilience,
      leadership,
    );
    await prisma.roleSuggestion.create({
      data: {
        employeeId: emp.id,
        suggestedRole: top.role,
        matchScore: top.match_score,
        failureScore,
        resilienceIndex: resilience,
        leadershipScore: leadership,
        growthTrajectory: growthTraj,
        explanation,
      },
    });
  }

  return NextResponse.json({
    employee_id: emp.id,
    employee_name: emp.name,
    failure_score: failureScore,
    resilience_index: resilience,
    leadership_score: leadership,
    growth_trajectory: growthTraj,
    transformational_learning_score: tls,
    emotional_recovery_score: emotionalRecovery,
    suggested_roles: matched,
    feature_importance: featureImp,
    disclaimer:
      "This AI-generated analysis is intended as a supportive tool for HR professionals. " +
      "No demographic data was used. Recommendations should be discussed with the employee " +
      "and validated by managers before any career changes are made.",
  });
}
