import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { id } from '@/lib/validation';
import { endpoint, problem } from '@/lib/http';
export const POST = endpoint(async (request) => {
  const user = await requireUser('participant');
  const input = z
    .object({ action: z.enum(['leave', 'transfer']), user_id: id.optional() })
    .parse(await request.json());
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    const [initial] = await connection.execute('SELECT team_id FROM memberships WHERE user_id=?', [
      user.id,
    ]);
    if (!initial.length) problem('You are not in a team.');
    const teamId = initial[0].team_id;
    await connection.execute('SELECT id FROM teams WHERE id=? FOR UPDATE', [teamId]);
    const [memberships] = await connection.execute(
      'SELECT * FROM memberships WHERE user_id=? FOR UPDATE',
      [user.id]
    );
    const membership = memberships[0];
    if (!membership || membership.team_id !== teamId)
      problem('Team changed. Refresh and try again.', 409);
    if (input.action === 'leave') {
      if (membership.is_captain) problem('Transfer captaincy before leaving, or delete the team.');
      await connection.execute('DELETE FROM memberships WHERE user_id=?', [user.id]);
    } else {
      if (!membership.is_captain) problem('Only the captain can transfer leadership.', 403);
      const [target] = await connection.execute(
        'SELECT user_id FROM memberships WHERE team_id=? AND user_id=?',
        [teamId, input.user_id || 0]
      );
      if (!target.length || input.user_id === user.id)
        problem('Choose another member of your team.');
      await connection.execute('UPDATE memberships SET is_captain=FALSE WHERE user_id=?', [
        user.id,
      ]);
      await connection.execute('UPDATE memberships SET is_captain=TRUE WHERE user_id=?', [
        input.user_id,
      ]);
    }
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
