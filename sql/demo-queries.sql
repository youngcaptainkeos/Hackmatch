-- MySQL 8.0.16+ / 8.4. Run in a development database.
-- JOIN + ORDER BY: available teams and their tracks.
SELECT t.name, tr.name AS track, t.member_count, tr.max_members
FROM teams t JOIN tracks tr ON t.track_id=tr.id
WHERE tr.registration_open=TRUE AND t.member_count<tr.max_members
ORDER BY t.created_at DESC;

-- GROUP BY + aggregate + HAVING: tracks with recruiting teams.
SELECT tr.name,COUNT(t.id) AS recruiting_teams
FROM tracks tr JOIN teams t ON t.track_id=tr.id
WHERE t.member_count<tr.max_members
GROUP BY tr.id,tr.name HAVING COUNT(t.id)>=1
ORDER BY recruiting_teams DESC;

-- Correlated subquery: participants without a team.
SELECT u.id,u.name FROM users u
WHERE u.role='participant' AND NOT EXISTS
  (SELECT 1 FROM memberships m WHERE m.user_id=u.id);

-- Views and stored procedure.
SELECT * FROM team_overview;
SELECT * FROM track_stats;
CALL get_track_summary();

-- Integrity diagnostic: denormalized counter vs actual membership count.
SELECT t.id,t.name,t.member_count,COUNT(m.user_id) AS actual_count
FROM teams t LEFT JOIN memberships m ON m.team_id=t.id
GROUP BY t.id HAVING t.member_count<>COUNT(m.user_id);
-- Expect no rows. Runtime account should not update member_count directly.

-- Disposable DDL + DML demonstration. MySQL DDL auto-commits: ROLLBACK
-- does NOT undo CREATE/ALTER/DROP. Only this temporary table is affected.
CREATE TEMPORARY TABLE rubric_demo (id INT PRIMARY KEY);
ALTER TABLE rubric_demo ADD COLUMN note VARCHAR(80);
INSERT INTO rubric_demo VALUES (1,'Original');
UPDATE rubric_demo SET note='Updated' WHERE id=1;
SELECT * FROM rubric_demo;
DELETE FROM rubric_demo WHERE id=1;
DROP TEMPORARY TABLE rubric_demo;
