import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getMySQL } from '@/lib/mysql';
import { getMongoDB } from '@/lib/mongodb';
import { text, id } from '@/lib/validation';
import { endpoint, problem } from '@/lib/http';
export const GET = endpoint(async () => {
  const user = await requireUser();
  const db = getMySQL();
  const [tracks] = await db.execute('SELECT * FROM tracks ORDER BY id');
  const [teams] = await db.execute('SELECT * FROM team_overview ORDER BY created_at DESC,id DESC');
  const [members] = await db.execute(
    `SELECT m.user_id,m.team_id,m.is_captain,u.name FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.team_id=(SELECT team_id FROM memberships WHERE user_id=?)`,
    [user.id]
  );
  const [applications] = await db.execute(
    `SELECT a.*,u.name,t.name AS team_name FROM applications a JOIN users u ON u.id=a.user_id JOIN teams t ON t.id=a.team_id WHERE a.user_id=? OR a.team_id IN (SELECT team_id FROM memberships WHERE user_id=? AND is_captain=TRUE) ORDER BY a.created_at DESC`,
    [user.id, user.id]
  );
  const mongo = await getMongoDB();
  const openings = await mongo
    .collection('team_openings')
    .find({ team_id: { $in: teams.map((t) => String(t.id)) } }, { projection: { _id: 0 } })
    .toArray();
  return { tracks, teams, members, applications, openings };
});
export const POST = endpoint(async (request) => {
  const user = await requireUser('participant');
  const input = z
    .object({ name: text(2, 80), idea: text(10, 2000), track_id: id })
    .parse(await request.json());
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    const [tracks] = await connection.execute('SELECT * FROM tracks WHERE id=? FOR SHARE', [
      input.track_id,
    ]);
    if (!tracks[0]?.registration_open) problem('Track registration is closed.');
    await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE', [user.id]);
    const [membership] = await connection.execute(
      'SELECT user_id FROM memberships WHERE user_id=?',
      [user.id]
    );
    if (membership.length) problem('You already belong to a team.');
    const [team] = await connection.execute(
      'INSERT INTO teams (name,idea,track_id) VALUES (?,?,?)',
      [input.name, input.idea, input.track_id]
    );
    await connection.execute(
      'INSERT INTO memberships (user_id,team_id,is_captain) VALUES (?,?,TRUE)',
      [user.id, team.insertId]
    );
    await connection.execute(
      "UPDATE applications SET status='closed' WHERE user_id=? AND status='pending'",
      [user.id]
    );
    await connection.commit();
    return { ok: true, team_id: team.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
export const DELETE = endpoint(async (request) => {
  const user = await requireUser('participant');
  const teamId = id.parse((await request.json()).team_id);
  const connection = await getMySQL().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT id FROM teams WHERE id=? FOR UPDATE', [teamId]);
    const [membership] = await connection.execute(
      'SELECT user_id FROM memberships WHERE team_id=? AND user_id=? AND is_captain=TRUE',
      [teamId, user.id]
    );
    if (!membership.length) problem('Only the captain can delete this team.', 403);
    await connection.execute('DELETE FROM memberships WHERE team_id=?', [teamId]);
    await connection.execute('DELETE FROM teams WHERE id=?', [teamId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  // MySQL is authoritative. Any orphan document is excluded from reads by team ID.
  try {
    const mongo = await getMongoDB();
    await mongo.collection('team_openings').deleteMany({ team_id: String(teamId) });
    return { ok: true };
  } catch {
    return {
      ok: true,
      message:
        'Team deleted. Recruitment cleanup is pending; its openings are excluded from discovery.',
    };
  }
});
