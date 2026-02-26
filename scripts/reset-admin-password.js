/**
 * Reset admin password in the database (no login required).
 * Run from whizz-website:
 *   node scripts/reset-admin-password.js YOUR_NEW_PASSWORD
 * or:
 *   RESET_ADMIN_PASSWORD=your_new_password node scripts/reset-admin-password.js
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const prisma = new PrismaClient();

const newPassword = process.argv[2] || process.env.RESET_ADMIN_PASSWORD;

if (!newPassword || newPassword.length < 6) {
  console.error("Usage: node scripts/reset-admin-password.js NEW_PASSWORD");
  console.error("   or: RESET_ADMIN_PASSWORD=newpass node scripts/reset-admin-password.js");
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

async function main() {
  const passwordHash = await hash(newPassword, 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      passwordHash,
      canAccessDashboard: true,
      canManageUsers: true,
    },
    update: { passwordHash, canAccessDashboard: true, canManageUsers: true },
  });
  console.log("Admin password has been reset. You can log in with username 'admin' and your new password.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
