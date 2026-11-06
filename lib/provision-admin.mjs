// Run from a trusted terminal/build with a password hash; never from a public API.
import { getMySQL } from './mysql.js';
const email = process.env.ADMIN_SETUP_EMAIL;
const hash = process.env.ADMIN_SETUP_HASH;
if (email || hash) {
  if (!email || !hash?.startsWith('scrypt:')) throw new Error('Admin setup needs an email and scrypt hash.');
  const db = getMySQL();
  try {
    const [existing] = await db.execute('SELECT role FROM users WHERE email=?', [email]);
    if (existing.length) {
      if (existing[0].role !== 'admin') throw new Error('Admin setup cannot replace a participant account.');
      console.log('Administrator account already exists; credentials preserved.');
    } else {
      await db.execute('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
        ['HackMatch Admin', email, hash, 'admin']);
      console.log('Administrator account provisioned.');
    }
  } finally { await db.end(); }
}
