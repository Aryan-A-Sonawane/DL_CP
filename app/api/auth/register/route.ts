import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  defaultDashboardPath,
  hashPassword,
  setSessionCookie,
  type Role,
} from "@/lib/auth";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orgName = String(body?.orgName ?? "").trim();
  const industry = String(body?.industry ?? "").trim() || null;
  const size = String(body?.size ?? "").trim() || null;
  const adminName = String(body?.adminName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!orgName) return NextResponse.json({ error: "Organization name required." }, { status: 400 });
  if (!adminName) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (!email.includes("@")) return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  let baseSlug = slugify(orgName) || "org";
  let slug = baseSlug;
  for (let i = 2; await prisma.organization.findUnique({ where: { slug } }); i++) {
    slug = `${baseSlug}-${i}`;
  }

  const passwordHash = await hashPassword(password);
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: orgName, slug, industry, size, contactEmail: email },
    });
    const user = await tx.user.create({
      data: {
        orgId: org.id,
        name: adminName,
        email,
        passwordHash,
        role: "ADMIN",
        profileComplete: true,
      },
    });
    return { org, user };
  });

  await setSessionCookie({
    uid: result.user.id,
    role: result.user.role as Role,
    orgId: result.org.id,
  });
  return NextResponse.json({
    redirect: defaultDashboardPath(result.user.role as Role),
    org: { id: result.org.id, name: result.org.name, slug: result.org.slug },
  });
}
