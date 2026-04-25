import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

/**
 * IMPORTANT: per AGENTS.md we do NOT seed fake employees, departments or
 * organizations. The platform must boot empty so all data comes from real
 * usage. The only seeded record is a single SUPER_ADMIN account so the
 * platform owner can sign in.
 *
 * Credentials policy:
 *   - Read from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD / SUPER_ADMIN_NAME
 *   - If SUPER_ADMIN_PASSWORD is unset we generate a strong random one and
 *     log it ONCE on first boot. There is no hardcoded default password.
 */
function generatePassword(): string {
  // 16 url-safe characters (~96 bits of entropy)
  return randomBytes(12).toString("base64url");
}

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "owner@platform.local").toLowerCase();
  const name = process.env.SUPER_ADMIN_NAME || "Platform Owner";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Super-admin already present (${email}) — skipping.`);
    return;
  }

  const envPassword = process.env.SUPER_ADMIN_PASSWORD;
  const password = envPassword && envPassword.length >= 8 ? envPassword : generatePassword();
  const generated = !envPassword;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "SUPER_ADMIN",
      profileComplete: true,
    },
  });

  const banner = "─".repeat(60);
  console.log(
    `\n${banner}\n` +
    ` Super-admin seeded\n` +
    `    email: ${email}\n` +
    `    password: ${password}${generated ? "   (auto-generated — copy now)" : "   (from SUPER_ADMIN_PASSWORD)"}\n` +
    `    Override anytime with SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars.\n` +
    `${banner}\n`
  );
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
