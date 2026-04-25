import { NextResponse } from "next/server";
import { AuthError, requireUser, type Role } from "./auth";

export async function withAuth<T>(
  roles: Role[] | undefined,
  handler: (user: Awaited<ReturnType<typeof requireUser>>) => Promise<T>,
) {
  try {
    const user = await requireUser(roles);
    const result = await handler(user);
    return result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[api]", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
