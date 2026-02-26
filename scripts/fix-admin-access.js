/**
 * Set canAccessDashboard = true for admin and ziad in the database.
 * Run from whizz-website: node scripts/fix-admin-access.js
 * Then log out and log in again so your session gets the new permissions.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { username: { in: ["admin", "ziad"] } },
    data: { canAccessDashboard: true, canManageUsers: true },
  });
  console.log("Updated", result.count, "user(s). Admin and ziad now have Dashboard and Users access.");
  console.log("Log out and log in again for the change to take effect.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
