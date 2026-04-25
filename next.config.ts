import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + nodemailer + bcryptjs need to be treated as native server packages
  // so Vercel doesn't try to bundle them into the edge runtime.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer", "exceljs"],
};

export default nextConfig;
