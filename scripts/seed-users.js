/**
 * Seed User table from env vars (e.g. .env.local).
 * Run from whizz-website: node scripts/seed-users.js
 * Requires: DATABASE_URL and at least one of ADMIN_PASSWORD_HASH, ZIAD_PASSWORD_HASH, etc.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const USERS = [
  { username: "admin", envKey: "ADMIN_PASSWORD_HASH", canAccessDashboard: true, canManageUsers: true },
  { username: "ziad", envKey: "ZIAD_PASSWORD_HASH", canAccessDashboard: true, canManageUsers: true },
  { username: "amira", envKey: "AMIRA_PASSWORD_HASH", canAccessDashboard: false, canManageUsers: false },
  { username: "may", envKey: "MAY_PASSWORD_HASH", canAccessDashboard: false, canManageUsers: false },
  { username: "maysara", envKey: "MAYSARA_PASSWORD_HASH", canAccessDashboard: false, canManageUsers: false },
  { username: "heba", envKey: "HEBA_PASSWORD_HASH", canAccessDashboard: true, canManageUsers: false },
];

function getHash(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("$2")) return trimmed;
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.startsWith("$2")) return decoded;
  } catch {
    /* ignore */
  }
  return trimmed;
}

async function main() {
  for (const { username, envKey, canAccessDashboard, canManageUsers } of USERS) {
    const raw = process.env[envKey];
    const hash = getHash(raw);
    if (!hash) {
      console.log("Skip (no hash):", username);
      continue;
    }
    await prisma.user.upsert({
      where: { username },
      create: { username, passwordHash: hash, canAccessDashboard, canManageUsers },
      update: { passwordHash: hash, canAccessDashboard, canManageUsers },
    });
    console.log("Upserted:", username, canAccessDashboard ? "(dashboard)" : "", canManageUsers ? "(users)" : "");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
