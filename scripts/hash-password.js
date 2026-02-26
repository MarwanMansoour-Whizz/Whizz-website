const { hashSync } = require("bcryptjs");
const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js \"yourpassword\"");
  process.exit(1);
}
console.log(hashSync(password, 10));
