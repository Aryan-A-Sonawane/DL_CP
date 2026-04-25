import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  defaultDashboardPath,
  hashPassword,
  setSessionCookie,
  type Role,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim().toUpperCase();
  const name = String(body?.name ?? "").trim();
  const password = String(body?.password ?? "");

  if (!code) return NextResponse.json({ error: "Invitation code is required." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const invite = await prisma.invitation.findUnique({ where: { code } });
  if (!invite || invite.used) {
    return NextResponse.json({ error: "Invitation code is invalid or already used." }, { status: 400 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation code has expired." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with the invited email already exists. Please sign in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        orgId: invite.orgId,
        departmentId: invite.departmentId,
        name,
        email: invite.email.toLowerCase(),
        passwordHash,
        role: invite.role,
        profileComplete: false,
      },
    });
    if (invite.role === "DEPT_HEAD" && invite.departmentId) {
      await tx.department.update({
        where: { id: invite.departmentId },
        data: { headId: user.id },
      });
    }
    await tx.invitation.update({ where: { id: invite.id }, data: { used: true } });
    return user;
  });

  await setSessionCookie({
    uid: result.id,
    role: result.role as Role,
    orgId: result.orgId,
  });
  return NextResponse.json({ redirect: defaultDashboardPath(result.role as Role) });
}
