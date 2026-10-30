import { readFile } from 'node:fs/promises';
import { getMySQL } from '../lib/mysql.js';

// Additive migration for existing installations; no tables or rows are removed.
const db = getMySQL();
try {
  const [columns] = await db.execute("SHOW COLUMNS FROM applications LIKE 'kind'");
  if (columns.length) {
    console.log('Invitation migration already applied.');
  } else {
    const sql = await readFile(
      new URL('../sql/migrations/001-team-invitations.sql', import.meta.url),
      'utf8'
    );
    await db.query(sql);
    console.log('Added invitation kind; existing applications preserved.');
  }
} catch (error) {
  console.error('Migration failed:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await db.end();
}
