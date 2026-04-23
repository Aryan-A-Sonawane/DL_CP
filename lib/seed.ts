import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASE = new Date("2024-01-15T00:00:00Z");
const day = (n: number) => new Date(BASE.getTime() + n * 24 * 60 * 60 * 1000);

const employees = [
  { empCode: "EMP001", name: "Aarav Sharma", email: "aarav@company.com", primaryDomain: "Software Engineering", department: "Engineering", yearsExperience: 5.0, softSkillScore: 6.8 },
  { empCode: "EMP002", name: "Priya Deshmukh", email: "priya@company.com", primaryDomain: "Data Science", department: "Analytics", yearsExperience: 3.5, softSkillScore: 8.2 },
  { empCode: "EMP003", name: "Carlos Rivera", email: "carlos@company.com", primaryDomain: "Project Management", department: "Operations", yearsExperience: 7.0, softSkillScore: 5.5 },
  { empCode: "EMP004", name: "Mei Zhang", email: "mei@company.com", primaryDomain: "UX Design", department: "Product", yearsExperience: 4.0, softSkillScore: 7.9 },
  { empCode: "EMP005", name: "David Okonkwo", email: "david@company.com", primaryDomain: "Quality Assurance", department: "Engineering", yearsExperience: 6.0, softSkillScore: 7.1 },
  { empCode: "EMP006", name: "Sara Jensen", email: "sara@company.com", primaryDomain: "Marketing", department: "Growth", yearsExperience: 4.5, softSkillScore: 8.5 },
  { empCode: "EMP007", name: "Ravi Patel", email: "ravi@company.com", primaryDomain: "Backend Engineering", department: "Engineering", yearsExperience: 8.0, softSkillScore: 5.0 },
  { empCode: "EMP008", name: "Emily Nakamura", email: "emily@company.com", primaryDomain: "Sales", department: "Revenue", yearsExperience: 3.0, softSkillScore: 9.0 },
  { empCode: "EMP009", name: "Tomás García", email: "tomas@company.com", primaryDomain: "DevOps", department: "Infrastructure", yearsExperience: 5.5, softSkillScore: 6.0 },
  { empCode: "EMP010", name: "Aisha Mohammed", email: "aisha@company.com", primaryDomain: "Product Management", department: "Product", yearsExperience: 6.5, softSkillScore: 7.5 },
];

type FE = {
  category: string;
  description: string;
  severity: number;
  date: Date;
  recoveryTimeDays: number;
  outcomeAfter: "improved" | "neutral" | "declined";
};

const failureEvents: FE[][] = [
  [
    { category: "deadline_miss", description: "Missed sprint deadlines 3 times due to scope creep handling", severity: 6.0, date: day(0), recoveryTimeDays: 14, outcomeAfter: "improved" },
    { category: "communication", description: "Failed to escalate blockers to stakeholders", severity: 5.0, date: day(45), recoveryTimeDays: 10, outcomeAfter: "improved" },
    { category: "quality_issue", description: "Production bug due to insufficient testing", severity: 7.5, date: day(120), recoveryTimeDays: 21, outcomeAfter: "neutral" },
  ],
  [
    { category: "model_accuracy", description: "ML model underperformed in production — 12% accuracy drop", severity: 8.0, date: day(0), recoveryTimeDays: 30, outcomeAfter: "improved" },
    { category: "communication", description: "Failed to set realistic expectations with business team", severity: 4.5, date: day(60), recoveryTimeDays: 7, outcomeAfter: "improved" },
  ],
  [
    { category: "team_conflict", description: "Conflict with cross-functional team led to project stall", severity: 7.0, date: day(0), recoveryTimeDays: 25, outcomeAfter: "neutral" },
    { category: "deadline_miss", description: "Waterfall-style planning caused 2-month delay", severity: 8.5, date: day(90), recoveryTimeDays: 45, outcomeAfter: "declined" },
    { category: "budget_overrun", description: "Project exceeded budget by 35%", severity: 7.5, date: day(180), recoveryTimeDays: 30, outcomeAfter: "improved" },
  ],
  [
    { category: "stakeholder_rejection", description: "Design rejected by client 3 times", severity: 6.0, date: day(0), recoveryTimeDays: 15, outcomeAfter: "improved" },
    { category: "deadline_miss", description: "Redesign cycle exceeded timeline", severity: 5.5, date: day(40), recoveryTimeDays: 10, outcomeAfter: "improved" },
  ],
  [
    { category: "quality_issue", description: "Missed critical regression bugs in release", severity: 9.0, date: day(0), recoveryTimeDays: 35, outcomeAfter: "neutral" },
    { category: "process_failure", description: "Test automation framework broke during migration", severity: 6.5, date: day(75), recoveryTimeDays: 20, outcomeAfter: "improved" },
    { category: "communication", description: "Failed to document test coverage gaps", severity: 4.0, date: day(130), recoveryTimeDays: 7, outcomeAfter: "improved" },
  ],
  [
    { category: "campaign_failure", description: "Campaign ROI was 60% below target", severity: 7.0, date: day(0), recoveryTimeDays: 20, outcomeAfter: "improved" },
    { category: "data_misinterpretation", description: "Misread analytics leading to wrong audience targeting", severity: 6.5, date: day(55), recoveryTimeDays: 14, outcomeAfter: "improved" },
  ],
  [
    { category: "system_outage", description: "Deployed code caused 4-hour production outage", severity: 9.5, date: day(0), recoveryTimeDays: 3, outcomeAfter: "improved" },
    { category: "team_conflict", description: "Refused code reviews from junior developers", severity: 5.0, date: day(30), recoveryTimeDays: 60, outcomeAfter: "neutral" },
    { category: "deadline_miss", description: "Overengineered solution delayed feature by 3 weeks", severity: 6.0, date: day(100), recoveryTimeDays: 14, outcomeAfter: "improved" },
    { category: "communication", description: "Poor documentation of architecture decisions", severity: 4.5, date: day(160), recoveryTimeDays: 10, outcomeAfter: "improved" },
  ],
  [
    { category: "target_miss", description: "Missed quarterly sales target by 40%", severity: 8.0, date: day(0), recoveryTimeDays: 30, outcomeAfter: "neutral" },
    { category: "client_loss", description: "Lost key account due to over-promising", severity: 8.5, date: day(90), recoveryTimeDays: 45, outcomeAfter: "declined" },
  ],
  [
    { category: "system_outage", description: "Infrastructure misconfiguration caused data loss scare", severity: 9.0, date: day(0), recoveryTimeDays: 5, outcomeAfter: "improved" },
    { category: "process_failure", description: "CI/CD pipeline broke blocking all deployments for 2 days", severity: 7.0, date: day(50), recoveryTimeDays: 3, outcomeAfter: "improved" },
  ],
  [
    { category: "stakeholder_rejection", description: "Product roadmap rejected by leadership twice", severity: 7.0, date: day(0), recoveryTimeDays: 20, outcomeAfter: "improved" },
    { category: "team_conflict", description: "Poor delegation led to team burnout", severity: 6.5, date: day(70), recoveryTimeDays: 30, outcomeAfter: "improved" },
    { category: "deadline_miss", description: "Feature launch delayed due to shifting priorities", severity: 5.0, date: day(140), recoveryTimeDays: 15, outcomeAfter: "improved" },
  ],
];

type ST = { name: string; score: number; source: string };

const strengths: ST[][] = [
  [
    { name: "Problem Solving", score: 8.5, source: "assessment" },
    { name: "System Thinking", score: 7.0, source: "manager" },
    { name: "Adaptability", score: 7.8, source: "peer_review" },
  ],
  [
    { name: "Analytical Thinking", score: 9.0, source: "assessment" },
    { name: "Storytelling with Data", score: 8.0, source: "manager" },
    { name: "Curiosity", score: 8.5, source: "peer_review" },
  ],
  [
    { name: "Strategic Vision", score: 7.5, source: "manager" },
    { name: "Stakeholder Management", score: 6.0, source: "assessment" },
    { name: "Risk Assessment", score: 7.0, source: "peer_review" },
  ],
  [
    { name: "Creativity", score: 9.0, source: "assessment" },
    { name: "User Empathy", score: 8.5, source: "peer_review" },
    { name: "Visual Communication", score: 8.0, source: "manager" },
  ],
  [
    { name: "Attention to Detail", score: 8.0, source: "assessment" },
    { name: "Process Improvement", score: 7.5, source: "manager" },
    { name: "Systematic Thinking", score: 7.0, source: "peer_review" },
  ],
  [
    { name: "Creativity", score: 8.5, source: "assessment" },
    { name: "Persuasion", score: 8.0, source: "manager" },
    { name: "Trend Analysis", score: 7.5, source: "peer_review" },
  ],
  [
    { name: "Deep Technical Knowledge", score: 9.5, source: "assessment" },
    { name: "Problem Solving", score: 8.5, source: "manager" },
    { name: "Architecture Design", score: 9.0, source: "peer_review" },
  ],
  [
    { name: "Empathy", score: 9.0, source: "assessment" },
    { name: "Relationship Building", score: 8.5, source: "peer_review" },
    { name: "Active Listening", score: 8.0, source: "manager" },
  ],
  [
    { name: "Crisis Management", score: 8.5, source: "assessment" },
    { name: "Automation Mindset", score: 9.0, source: "manager" },
    { name: "Quick Recovery", score: 8.0, source: "peer_review" },
  ],
  [
    { name: "Visionary Thinking", score: 8.0, source: "assessment" },
    { name: "Cross-functional Leadership", score: 7.5, source: "manager" },
    { name: "Empathy", score: 8.5, source: "peer_review" },
  ],
];

async function main() {
  const existing = await prisma.employee.count();
  if (existing > 0) {
    console.log(`[seed] Skipped — ${existing} employees already exist`);
    return;
  }

  for (let i = 0; i < employees.length; i++) {
    const emp = await prisma.employee.create({ data: employees[i] });
    await prisma.failureEvent.createMany({
      data: failureEvents[i].map((e) => ({ ...e, employeeId: emp.id })),
    });
    await prisma.strength.createMany({
      data: strengths[i].map((s) => ({ ...s, employeeId: emp.id })),
    });
  }

  console.log(`[seed] Inserted ${employees.length} employees with failures + strengths`);
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
