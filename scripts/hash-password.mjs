// Usage: node scripts/hash-password.mjs 'your-password'  -> prints a bcrypt hash for ADMIN_PASSWORD_HASH
import bcrypt from 'bcryptjs';
const pw = process.argv[2];
if (!pw || pw.length < 12) { console.error('Provide a password of 12+ characters'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 12));
