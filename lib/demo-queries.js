// Fixed administrator SQL examples for the directly addressable SQL demonstration page.
// Never accept SQL text from the browser and pass it to the database.
export const demoQueries = [
  {
    id: 'available-teams',
    title: 'Available teams with their tracks',
    topic: 'JOIN · WHERE · ORDER BY',
    sql: `SELECT t.name, tr.name AS track, t.member_count, tr.max_members
FROM teams t
JOIN tracks tr ON t.track_id = tr.id
WHERE tr.registration_open = TRUE
  AND t.member_count < tr.max_members
ORDER BY t.created_at DESC;`,
    run: (db) =>
      db.execute(`SELECT t.name, tr.name AS track, t.member_count, tr.max_members
        FROM teams t JOIN tracks tr ON t.track_id=tr.id
        WHERE tr.registration_open=TRUE AND t.member_count<tr.max_members
        ORDER BY t.created_at DESC`),
  },
  {
    id: 'recruiting-by-track',
    title: 'Recruiting teams grouped by track',
    topic: 'JOIN · COUNT · GROUP BY · HAVING',
    sql: `SELECT tr.name, COUNT(t.id) AS recruiting_teams
FROM tracks tr
JOIN teams t ON t.track_id = tr.id
WHERE t.member_count < tr.max_members
GROUP BY tr.id, tr.name
HAVING COUNT(t.id) >= 1
ORDER BY recruiting_teams DESC;`,
    run: (db) =>
      db.execute(`SELECT tr.name,COUNT(t.id) AS recruiting_teams
        FROM tracks tr JOIN teams t ON t.track_id=tr.id
        WHERE t.member_count<tr.max_members
        GROUP BY tr.id,tr.name HAVING COUNT(t.id)>=1
        ORDER BY recruiting_teams DESC`),
  },
  {
    id: 'participants-without-team',
    title: 'Count participants who do not have a team',
    topic: 'NOT EXISTS · CORRELATED SUBQUERY',
    sql: `SELECT COUNT(*) AS participants_without_team
FROM users u
WHERE u.role = 'participant'
  AND NOT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.user_id = u.id
  );`,
    run: (db) =>
      db.execute(`SELECT COUNT(*) AS participants_without_team FROM users u
        WHERE u.role='participant' AND NOT EXISTS
        (SELECT 1 FROM memberships m WHERE m.user_id=u.id)`),
  },
  {
    id: 'team-overview',
    title: 'Read the team_overview view',
    topic: 'VIEW · JOIN',
    sql: `SELECT *
FROM team_overview
ORDER BY created_at DESC, id DESC;`,
    run: (db) => db.execute('SELECT * FROM team_overview ORDER BY created_at DESC,id DESC'),
  },
  {
    id: 'track-stats',
    title: 'Read the track_stats view',
    topic: 'VIEW · LEFT JOIN · AGGREGATE',
    sql: `SELECT *
FROM track_stats
ORDER BY id;`,
    run: (db) => db.execute('SELECT * FROM track_stats ORDER BY id'),
  },
  {
    id: 'track-summary-procedure',
    title: 'Call get_track_summary()',
    topic: 'STORED PROCEDURE · CALL',
    sql: `CALL get_track_summary();`,
    run: async (db) => {
      const [sets] = await db.query('CALL get_track_summary()');
      return [sets[0] || [], []];
    },
  },
  {
    id: 'list-triggers',
    title: 'List the project triggers',
    topic: 'TRIGGERS · DATABASE METADATA',
    sql: `SHOW TRIGGERS;`,
    run: (db) => db.query('SHOW TRIGGERS'),
  },
  {
    id: 'capacity-trigger',
    title: 'Inspect enforce_team_capacity',
    topic: 'TRIGGER · BEFORE INSERT',
    sql: `SHOW CREATE TRIGGER enforce_team_capacity;`,
    definitionColumn: 'SQL Original Statement',
    run: (db) => db.query('SHOW CREATE TRIGGER enforce_team_capacity'),
  },
  {
    id: 'release-slot-trigger',
    title: 'Inspect release_team_slot',
    topic: 'TRIGGER · AFTER DELETE',
    sql: `SHOW CREATE TRIGGER release_team_slot;`,
    definitionColumn: 'SQL Original Statement',
    run: (db) => db.query('SHOW CREATE TRIGGER release_team_slot'),
  },
  {
    id: 'prevent-move-trigger',
    title: 'Inspect prevent_membership_move',
    topic: 'TRIGGER · BEFORE UPDATE',
    sql: `SHOW CREATE TRIGGER prevent_membership_move;`,
    definitionColumn: 'SQL Original Statement',
    run: (db) => db.query('SHOW CREATE TRIGGER prevent_membership_move'),
  },
  {
    id: 'track-capacity-trigger',
    title: 'Inspect protect_track_capacity',
    topic: 'TRIGGER · BEFORE UPDATE',
    sql: `SHOW CREATE TRIGGER protect_track_capacity;`,
    definitionColumn: 'SQL Original Statement',
    run: (db) => db.query('SHOW CREATE TRIGGER protect_track_capacity'),
  },
  {
    id: 'track-summary-definition',
    title: 'Inspect get_track_summary definition',
    topic: 'STORED PROCEDURE · SHOW CREATE',
    sql: `SHOW CREATE PROCEDURE get_track_summary;`,
    definitionColumn: 'Create Procedure',
    run: (db) => db.query('SHOW CREATE PROCEDURE get_track_summary'),
  },
  {
    id: 'counter-integrity',
    title: 'Check team member counters',
    topic: 'LEFT JOIN · GROUP BY · HAVING',
    sql: `SELECT t.id, t.name, t.member_count,
       COUNT(m.user_id) AS actual_count
FROM teams t
LEFT JOIN memberships m ON m.team_id = t.id
GROUP BY t.id
HAVING t.member_count <> COUNT(m.user_id);`,
    run: (db) =>
      db.execute(`SELECT t.id,t.name,t.member_count,COUNT(m.user_id) AS actual_count
        FROM teams t LEFT JOIN memberships m ON m.team_id=t.id
        GROUP BY t.id HAVING t.member_count<>COUNT(m.user_id)`),
  },
  {
    id: 'demo-update-username',
    title: 'Update selected participant name',
    topic: 'DML · UPDATE · SELECTED PARTICIPANT',
    sql: `UPDATE users
SET name = CONCAT(name, ' [SQL demo]')
WHERE id = ?
  AND CHAR_LENGTH(name) <= 69
  AND RIGHT(name, 11) <> ' [SQL demo]';`,
    mutating: true,
    run: async (db, user) => {
      const [result] = await db.execute(
        `UPDATE users SET name=CONCAT(name,' [SQL demo]')
         WHERE id=? AND CHAR_LENGTH(name)<=69 AND RIGHT(name,11)<>' [SQL demo]'`,
        [user.id]
      );
      return result.affectedRows;
    },
    read: (db, user) =>
      db.execute('SELECT id, name FROM users WHERE id=?', [user.id]),
  },
  {
    id: 'demo-update-team-name',
    title: 'Update selected participant team name',
    topic: 'DML · UPDATE JOIN · SELECTED PARTICIPANT TEAM',
    sql: `UPDATE teams t
JOIN memberships m ON m.team_id = t.id
SET t.name = CONCAT(t.name, ' [SQL demo]')
WHERE m.user_id = ?
  AND CHAR_LENGTH(t.name) <= 69
  AND RIGHT(t.name, 11) <> ' [SQL demo]';`,
    mutating: true,
    run: async (db, user) => {
      const [result] = await db.execute(
        `UPDATE teams t JOIN memberships m ON m.team_id=t.id
         SET t.name=CONCAT(t.name,' [SQL demo]')
         WHERE m.user_id=?
           AND CHAR_LENGTH(t.name)<=69 AND RIGHT(t.name,11)<>' [SQL demo]'`,
        [user.id]
      );
      return result.affectedRows;
    },
    read: (db, user) =>
      db.execute(
        `SELECT t.id,t.name,t.member_count FROM teams t
         JOIN memberships m ON m.team_id=t.id
         WHERE m.user_id=?`,
        [user.id]
      ),
  },
  {
    id: 'demo-reset-changes',
    title: 'Reset selected participant demo changes',
    topic: 'DML · UPDATE · RESET KEY',
    sql: `UPDATE users
SET name = LEFT(name, CHAR_LENGTH(name) - 11)
WHERE id = ? AND RIGHT(name, 11) = ' [SQL demo]';

UPDATE teams t
JOIN memberships m ON m.team_id = t.id
SET t.name = LEFT(t.name, CHAR_LENGTH(t.name) - 11)
WHERE m.user_id = ?
  AND RIGHT(t.name, 11) = ' [SQL demo]';`,
    mutating: true,
    run: async (db, user) => {
      const [userResult] = await db.execute(
        `UPDATE users SET name=LEFT(name,CHAR_LENGTH(name)-11)
         WHERE id=? AND RIGHT(name,11)=' [SQL demo]'`,
        [user.id]
      );
      const [teamResult] = await db.execute(
        `UPDATE teams t JOIN memberships m ON m.team_id=t.id
         SET t.name=LEFT(t.name,CHAR_LENGTH(t.name)-11)
         WHERE m.user_id=?
           AND RIGHT(t.name,11)=' [SQL demo]'`,
        [user.id]
      );
      return userResult.affectedRows + teamResult.affectedRows;
    },
    read: (db, user) =>
      db.execute(
        `SELECT 'username' AS item,name AS current_value FROM users WHERE id=?
         UNION ALL
         SELECT 'team' AS item,t.name AS current_value FROM teams t
         JOIN memberships m ON m.team_id=t.id
         WHERE m.user_id=?`,
        [user.id, user.id]
      ),
  },
];

export function findDemoQuery(id) {
  return demoQueries.find((query) => query.id === id);
}
