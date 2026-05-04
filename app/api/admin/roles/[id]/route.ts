import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

async function guard(roles: string[]) {
  try {
    return { user: await requireUser(roles as never), err: null };
  } catch (e) {
    const ae = e as AuthError;
    return { user: null, err: NextResponse.json({ error: ae.message }, { status: ae.status ?? 401 }) };
  }
}

/** PATCH /api/admin/roles/[id]  — toggle active or rename custom role */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, err } = await guard(["ADMIN"]);
  if (err) return err;
  if (!user!.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { id } = await params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await prisma.orgRole.findUnique({ where: { id: roleId } });
  if (!existing || existing.orgId !== user!.orgId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updates: { active?: boolean; title?: string } = {};

  if (typeof body.active === "boolean") updates.active = body.active;
  if (typeof body.title === "string" && existing.isCustom) {
    const t = body.title.trim();
    if (t) updates.title = t;
  }

  const role = await prisma.orgRole.update({ where: { id: roleId }, data: updates });
  return NextResponse.json({ role });
}

/** DELETE /api/admin/roles/[id]  — remove a role from org catalog */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, err } = await guard(["ADMIN"]);
  if (err) return err;
  if (!user!.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { id } = await params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const existing = await prisma.orgRole.findUnique({ where: { id: roleId } });
  if (!existing || existing.orgId !== user!.orgId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.orgRole.delete({ where: { id: roleId } });
  return NextResponse.json({ ok: true });
}
