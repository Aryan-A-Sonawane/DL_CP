import { PrismaClient } from "@prisma/client";

/**
 * Build the connection URL with Neon-friendly parameters that prevent the
 * "Can't reach database server" cold-start error:
 *
 *  connect_timeout=15   – Give Neon 15s to wake up before throwing
 *  pool_timeout=15      – Same budget for the PgBouncer pool to assign a slot
 *  connection_limit=5   – Keep the connection pool small for serverless
 *  pgbouncer=true       – Tell Prisma to use statement-level pinning (required
 *                         for PgBouncer in transaction mode)
 */
function buildUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set");

  const url = new URL(base);
  if (!url.searchParams.has("connect_timeout"))  url.searchParams.set("connect_timeout",  "15");
  if (!url.searchParams.has("pool_timeout"))     url.searchParams.set("pool_timeout",     "15");
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "5");
  if (!url.searchParams.has("pgbouncer"))        url.searchParams.set("pgbouncer",        "true");
  return url.toString();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: buildUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * isNeonColdStart — returns true for every connectivity error that Neon
 * produces when its serverless compute is suspended or restarting:
 *
 *   P1001  — "Can't reach database server" (compute fully off)
 *   P1017  — "Server has closed the connection" (compute reset mid-handshake)
 *   ECONNRESET / 10054 — OS-level "connection forcibly closed by remote host"
 *   ETIMEDOUT / ECONNREFUSED — pool or TCP timeouts during wake
 */
function isNeonColdStart(err: unknown): boolean {
  const code = (err as { code?: string }).code ?? "";
  const msg  = (err as { message?: string }).message ?? "";

  return (
    code === "P1001" ||
    code === "P1017" ||
    msg.includes("Can't reach database") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("connection timeout") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("Connection reset") ||
    msg.includes("forcibly closed") ||
    msg.includes("10054")   // Windows OS error: existing connection forcibly closed
  );
}

/**
 * withRetry — wraps any Prisma call and retries up to `attempts` times on
 * Neon cold-start connectivity errors. Each retry waits exponentially longer.
 *
 * Usage:
 *   const user = await withRetry(() => prisma.user.findUnique({ ... }));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 5,
  delayMs = 2500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      if (!isNeonColdStart(err) || i === attempts - 1) throw err;

      const wait = delayMs * Math.pow(1.8, i);
      const code = (err as { code?: string }).code ?? "no-code";
      console.warn(
        `[db] Neon connectivity error [${code}] — attempt ${i + 1}/${attempts}, ` +
        `retrying in ${(wait / 1000).toFixed(1)}s…`
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
