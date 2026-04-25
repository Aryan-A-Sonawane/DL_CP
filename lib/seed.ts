import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * IMPORTANT: per AGENTS.md we do NOT seed fake employees, departments or
 * organizations. The platform must boot empty so all data comes from real
 * usage. The only seeded record is a single SUPER_ADMIN account so the
 * platform owner can sign in.
 */
async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "owner@platform.local").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "Owner@12345";
  const name = process.env.SUPER_ADMIN_NAME || "Platform Owner";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Super-admin already present (${email}) — skipping.`);
    return;
  }

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

  console.log(
    "\n────────────────────────────────────────────────────────────\n" +
    " 🛡  Super-admin seeded\n" +
    `    email:    ${email}\n` +
    `    password: ${password}\n` +
    "    (override with SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars)\n" +
    "────────────────────────────────────────────────────────────\n"
  );
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
