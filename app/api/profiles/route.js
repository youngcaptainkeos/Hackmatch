import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { getMongoDB } from '@/lib/mongodb';
import { profileSchema } from '@/lib/validation';
import { endpoint } from '@/lib/http';
export const GET = endpoint(async () => {
  const user = await requireUser();
  const mongo = await getMongoDB();
  const profile = await mongo
    .collection('participant_profiles')
    .findOne({ user_id: String(user.id) }, { projection: { _id: 0 } });
  const [memberships] = await getMySQL().execute('SELECT * FROM memberships WHERE user_id=?', [
    user.id,
  ]);
  return { profile, membership: memberships[0] || null };
});
export const POST = endpoint(async (request) => {
  const user = await requireUser('participant');
  const profile = profileSchema.parse(await request.json());
  const mongo = await getMongoDB();
  await mongo
    .collection('participant_profiles')
    .updateOne(
      { user_id: String(user.id) },
      { $set: { ...profile, updated_at: new Date() } },
      { upsert: true }
    );
  return { ok: true };
});
