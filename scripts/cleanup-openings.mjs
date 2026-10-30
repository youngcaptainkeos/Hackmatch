import { getMySQL } from '../lib/mysql.js';
import { getMongoDB } from '../lib/mongodb.js';
try {
  const [teams] = await getMySQL().execute('SELECT id FROM teams');
  const mongo = await getMongoDB();
  const result = await mongo
    .collection('team_openings')
    .deleteMany({ team_id: { $nin: teams.map((t) => String(t.id)) } });
  await getMySQL().execute('DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()');
  console.log(
    `Removed ${result.deletedCount} orphan recruitment documents and cleaned expired sessions.`
  );
  process.exit(0);
} catch (error) {
  console.error('Cleanup failed:', error.code || error.name);
  process.exit(1);
}
