import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { text, id } from '@/lib/validation';
import { endpoint } from '@/lib/http';
export const GET = endpoint(async () => {
  await requireUser('admin');
  const db = getMySQL();
  const [summary] = await db.query('CALL get_track_summary()');
  const [totals] = await db.execute(
    `SELECT (SELECT COUNT(*) FROM users WHERE role='participant') AS participants,(SELECT COUNT(*) FROM teams) AS teams,(SELECT COUNT(*) FROM applications WHERE status='pending') AS pending`
  );
  return { tracks: summary[0], totals: totals[0] };
});
export const POST = endpoint(async (request) => {
  await requireUser('admin');
  const body = await request.json();
  if (body.action === 'toggle') {
    await getMySQL().execute(
      'UPDATE tracks SET registration_open=NOT registration_open WHERE id=?',
      [id.parse(body.id)]
    );
  } else {
    const input = z
      .object({
        name: text(2, 80),
        description: text(5, 2000),
        max_members: z.coerce.number().int().min(2).max(8),
      })
      .parse(body);
    await getMySQL().execute('INSERT INTO tracks (name,description,max_members) VALUES (?,?,?)', [
      input.name,
      input.description,
      input.max_members,
    ]);
  }
  return { ok: true };
});
