/**
 * Outputs bcrypt hash as BASE64 so you can set *_PASSWORD_HASH in .env.local
 * without $ being mangled by env variable expansion.
 * Usage: node scripts/hash-password-b64.js "yourpassword"
 */
const { hashSync } = require("bcryptjs");
const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password-b64.js "yourpassword"');
  process.exit(1);
}
const hash = hashSync(password, 10);
const b64 = Buffer.from(hash, "utf8").toString("base64");
console.log(b64);
