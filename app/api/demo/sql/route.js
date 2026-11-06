import { getMySQL } from '@/lib/mysql';
import { findDemoQuery } from '@/lib/demo-queries';
import { requireUser } from '@/lib/auth';
import { endpoint, problem } from '@/lib/http';

export const runtime = 'nodejs';
export const GET = endpoint(async () => {
  await requireUser('admin');
  const [participants] = await getMySQL().execute(
    `SELECT u.id,u.name,u.email,t.name AS team_name FROM users u
     LEFT JOIN memberships m ON m.user_id=u.id
     LEFT JOIN teams t ON t.id=m.team_id
     WHERE u.role='participant' ORDER BY u.name,u.id`
  );
  return { participants };
});

export const POST = endpoint(async (request) => {
  await requireUser('admin');
  const { id, targetUserId } = await request.json();
  if (typeof id !== 'string') problem('Choose a demo query.', 400);
  const query = findDemoQuery(id);
  if (!query) problem('That demo query is not available.', 404);

  if (query.mutating) {
    const targetId = Number(targetUserId);
    if (!Number.isSafeInteger(targetId) || targetId <= 0)
      problem('Choose a participant before running an update or reset.', 400);
    const user = { id: targetId };
    const connection = await getMySQL().getConnection();
    try {
      await connection.beginTransaction();
      const [targets] = await connection.execute(
        "SELECT id FROM users WHERE id=? AND role='participant' FOR UPDATE", [targetId]
      );
      if (!targets.length) problem('Participant not found.', 404);
      const affectedRows = await query.run(connection, user);
      const [rows, fields] = await query.read(connection, user);
      await connection.commit();
      return {
        id: query.id,
        columns: fields.map((field) => field.name),
        rows,
        rowCount: rows.length,
        affectedRows,
        message: `${affectedRows} row${affectedRows === 1 ? '' : 's'} changed.`,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const [rows, fields] = await query.run(getMySQL());
  return {
    id: query.id,
    columns: fields.length ? fields.map((field) => field.name) : Object.keys(rows[0] || {}),
    definition: query.definitionColumn ? rows[0]?.[query.definitionColumn] || '' : null,
    rows,
    rowCount: rows.length,
  };
});
