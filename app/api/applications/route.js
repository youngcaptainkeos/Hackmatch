import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { text, id } from '@/lib/validation';
import { endpoint, problem } from '@/lib/http';
export const POST = endpoint(async (request) => {
  const user = await requireUser('participant');
  const input = z.object({ team_id: id, message: text(5, 1000) }).parse(await request.json());
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    const [teams] = await connection.execute('SELECT track_id FROM teams WHERE id=?', [
      input.team_id,
    ]);
    if (!teams.length) problem('Team not found.', 404);
    const [tracks] = await connection.execute(
      'SELECT registration_open FROM tracks WHERE id=? FOR SHARE',
      [teams[0].track_id]
    );
    const [available] = await connection.execute(
      'SELECT * FROM team_overview WHERE id=? FOR UPDATE',
      [input.team_id]
    );
    await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [user.id]);
    const [membership] = await connection.execute(
      'SELECT user_id FROM memberships WHERE user_id=?',
      [user.id]
    );
    if (membership.length) problem('Leave your current team before applying.');
    if (!tracks[0]?.registration_open || !available[0] || available[0].slots <= 0)
      problem('Team is full or registration is closed.');
    await connection.execute('INSERT INTO applications (user_id,team_id,message) VALUES (?,?,?)', [
      user.id,
      input.team_id,
      input.message,
    ]);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
export const PATCH = endpoint(async (request) => {
  const user = await requireUser('participant');
  const input = z
    .object({ id, action: z.enum(['accept', 'reject', 'withdraw']) })
    .parse(await request.json());
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    const [initial] = await connection.execute(
      'SELECT a.*,t.track_id FROM applications a JOIN teams t ON t.id=a.team_id WHERE a.id=?',
      [input.id]
    );
    if (!initial.length) problem('Application not found.', 404);
    const application = initial[0];
    const [tracks] = await connection.execute(
      'SELECT registration_open FROM tracks WHERE id=? FOR SHARE',
      [application.track_id]
    );
    await connection.execute('SELECT id FROM teams WHERE id=? FOR UPDATE', [application.team_id]);
    await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [application.user_id]);
    const [current] = await connection.execute('SELECT * FROM applications WHERE id=? FOR UPDATE', [
      input.id,
    ]);
    if (!current.length || current[0].status !== 'pending')
      problem('This application is no longer pending.', 409);
    if (input.action === 'withdraw') {
      if (application.user_id !== user.id)
        problem('You can only withdraw your own application.', 403);
    } else {
      const [captain] = await connection.execute(
        'SELECT user_id FROM memberships WHERE user_id=? AND team_id=? AND is_captain=TRUE',
        [user.id, application.team_id]
      );
      if (!captain.length) problem('Only the team captain can decide applications.', 403);
    }
    if (input.action === 'accept') {
      if (!tracks[0]?.registration_open) problem('Track registration is closed.');
      // Unique user_id prevents joining two teams. The trigger protects capacity.
      await connection.execute('INSERT INTO memberships (user_id,team_id) VALUES (?,?)', [
        application.user_id,
        application.team_id,
      ]);
      await connection.execute(
        "UPDATE applications SET status='closed' WHERE user_id=? AND id<>? AND status='pending'",
        [application.user_id, input.id]
      );
    }
    const status = { accept: 'accepted', reject: 'rejected', withdraw: 'withdrawn' }[input.action];
    await connection.execute('UPDATE applications SET status=? WHERE id=?', [status, input.id]);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
