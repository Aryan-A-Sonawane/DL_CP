import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/db";
import { randomBytes } from "crypto";

const TOKEN_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  // Always return success to prevent email enumeration
  const user = await withRetry(() => prisma.user.findUnique({ where: { email } }));
  if (!user || !user.active) {
    return NextResponse.json({ ok: true });
  }

  // Invalidate all existing tokens for this user
  await withRetry(() => prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }));

  // Create new token
  const raw       = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await withRetry(() => prisma.passwordResetToken.create({
    data: { userId: user.id, token: raw, expiresAt },
  }));

  // In production, send an email here. For now, log to console and return in
  // dev mode so admins can hand the link to users directly.
  const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${raw}`;

  console.log("\n[Password Reset] ─────────────────────────────────────────");
  console.log(`  User  : ${user.name} <${user.email}>`);
  console.log(`  Link  : ${resetLink}`);
  console.log(`  Expiry: ${TOKEN_TTL_MINUTES} minutes`);
  console.log("────────────────────────────────────────────────────────────\n");

  // Return the link in non-production so the admin can share it immediately
  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    ...(isDev ? { resetLink, note: "Dev mode — link returned in response and logged to console." } : {}),
  });
}
