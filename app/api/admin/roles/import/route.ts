import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";
import { ROLE_CATALOG, getPresetRoles, type OrgType } from "@/lib/roleCatalog";

/**
 * POST /api/admin/roles/import
 * Body: { orgType: OrgType }
 *
 * Bulk-imports catalog roles for the given org type.
 * Roles already present are skipped (skipDuplicates).
 * Returns { added: number }.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser(["ADMIN"]);
  } catch (e) {
    const ae = e as AuthError;
    return NextResponse.json({ error: ae.message }, { status: ae.status ?? 401 });
  }
  if (!user.orgId) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const orgType = (body?.orgType ?? "other") as OrgType;

  const presetTitles = new Set(getPresetRoles(orgType));
  const rolesToImport = ROLE_CATALOG.filter((r) => presetTitles.has(r.title));

  const result = await prisma.orgRole.createMany({
    data: rolesToImport.map((r) => ({
      orgId:    user!.orgId!,
      title:    r.title,
      category: r.category,
      active:   true,
      isCustom: false,
    })),
    skipDuplicates: true,
  });

  // Also update org's orgType so future presets remember the selection
  await prisma.organization.update({
    where: { id: user.orgId },
    data:  { orgType },
  });

  return NextResponse.json({ added: result.count });
}
