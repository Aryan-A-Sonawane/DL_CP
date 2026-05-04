import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body     = await req.json().catch(() => null);
  const token    = String(body?.token    ?? "").trim();
  const password = String(body?.password ?? "");

  if (!token)           return NextResponse.json({ error: "Reset token is required."   }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const record = await withRetry(() => prisma.passwordResetToken.findUnique({ where: { token } }));

  if (!record)                           return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  if (record.usedAt)                     return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
  if (record.expiresAt < new Date())     return NextResponse.json({ error: "This link has expired. Request a new one." }, { status: 400 });

  const passwordHash = await hashPassword(password);

  await withRetry(() => prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data:  { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data:  { usedAt: new Date() },
    }),
  ]));

  return NextResponse.json({ ok: true });
}
