import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { ROLE_CATALOG } from "@/lib/roleCatalog";

async function guard(roles: string[]) {
  try {
    return { user: await requireUser(roles as never), err: null };
  } catch (e) {
    const ae = e as AuthError;
    return { user: null, err: NextResponse.json({ error: ae.message }, { status: ae.status ?? 401 }) };
  }
}

/** GET /api/admin/roles  — list all org roles (catalog + custom) */
export async function GET(_req: NextRequest) {
  const { user, err } = await guard(["ADMIN"]);
  if (err) return err;
  if (!user!.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const roles = await prisma.orgRole.findMany({
    where: { orgId: user!.orgId },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ roles });
}

/** POST /api/admin/roles  — add a custom role or import a catalog role */
export async function POST(req: NextRequest) {
  const { user, err } = await guard(["ADMIN"]);
  if (err) return err;
  if (!user!.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const title    = String(body?.title    ?? "").trim();
  const category = String(body?.category ?? "").trim();

  if (!title)    return NextResponse.json({ error: "title is required" },    { status: 400 });
  if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });

  // Determine if this is a catalog role or a new custom one
  const catalogMatch = ROLE_CATALOG.find(
    (r) => r.title.toLowerCase() === title.toLowerCase(),
  );
  const resolvedCategory = catalogMatch?.category ?? category;
  const isCustom = !catalogMatch;

  try {
    const role = await prisma.orgRole.create({
      data: {
        orgId:    user!.orgId!,
        title:    catalogMatch?.title ?? title,
        category: resolvedCategory,
        active:   true,
        isCustom,
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: `Role "${title}" already exists in your catalog.` },
      { status: 409 },
    );
  }
}
