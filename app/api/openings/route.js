import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { getMongoDB } from '@/lib/mongodb';
import { openingSchema } from '@/lib/validation';
import { endpoint, problem } from '@/lib/http';
export const POST = endpoint(async (request) => {
  const user = await requireUser('participant');
  const input = openingSchema.parse(await request.json());
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    // Keep a shared parent lock until the document is saved, so deletion waits.
    await connection.execute('SELECT id FROM teams WHERE id=? FOR SHARE', [input.team_id]);
    const [captain] = await connection.execute(
      'SELECT user_id FROM memberships WHERE user_id=? AND team_id=? AND is_captain=TRUE FOR SHARE',
      [user.id, input.team_id]
    );
    if (!captain.length) problem('Only this team’s captain can edit recruitment.', 403);
    const mongo = await getMongoDB();
    await mongo
      .collection('team_openings')
      .updateOne(
        { team_id: String(input.team_id) },
        { $set: { ...input, team_id: String(input.team_id), updated_at: new Date() } },
        { upsert: true }
      );
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
