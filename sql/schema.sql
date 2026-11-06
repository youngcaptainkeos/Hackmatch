-- MySQL 8.4. Run once against an empty database with scripts/init.mjs.
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role ENUM('participant','admin') NOT NULL DEFAULT 'participant',
  failed_logins INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_name CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
  CONSTRAINT valid_email CHECK (CAST(email AS BINARY) = CAST(LOWER(email) AS BINARY) AND LOCATE('@', email) > 1)
);
CREATE TABLE sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX session_expiry (expires_at)
);
CREATE TABLE tracks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(2000) NOT NULL,
  max_members INT NOT NULL DEFAULT 4,
  registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
  CHECK (CHAR_LENGTH(TRIM(description)) BETWEEN 5 AND 2000),
  CHECK (max_members BETWEEN 2 AND 8),
  CHECK (registration_open IN (0,1))
);
CREATE TABLE teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  track_id INT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL UNIQUE,
  idea VARCHAR(2000) NOT NULL,
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id),
  CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
  CHECK (CHAR_LENGTH(TRIM(idea)) BETWEEN 10 AND 2000),
  CHECK (member_count >= 0)
);
CREATE TABLE memberships (
  user_id INT UNSIGNED PRIMARY KEY,
  team_id INT UNSIGNED NOT NULL,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  captain_team_id INT UNSIGNED GENERATED ALWAYS AS (IF(is_captain,team_id,NULL)) STORED,
  UNIQUE KEY one_captain (captain_team_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  CHECK (is_captain IN (0,1))
);
CREATE TABLE applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  team_id INT UNSIGNED NOT NULL,
  message VARCHAR(1000) NOT NULL,
  kind ENUM('application','invitation') NOT NULL DEFAULT 'application',
  status ENUM('pending','accepted','rejected','withdrawn','closed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_application (user_id,team_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CHECK (CHAR_LENGTH(TRIM(message)) BETWEEN 5 AND 1000),
  INDEX team_status (team_id,status)
);
-- This delimiter is processed by our initializer, as in the mysql CLI.
DELIMITER $$
CREATE TRIGGER enforce_team_capacity BEFORE INSERT ON memberships FOR EACH ROW
BEGIN
  -- UPDATE locks the team row. Competing inserts serialize on this row.
  UPDATE teams SET member_count = member_count + 1
  WHERE id = NEW.team_id AND member_count <
    (SELECT max_members FROM tracks WHERE id = teams.track_id);
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team is full or missing';
  END IF;
END$$
CREATE TRIGGER release_team_slot AFTER DELETE ON memberships FOR EACH ROW
BEGIN
  UPDATE teams SET member_count = member_count - 1 WHERE id = OLD.team_id;
END$$
CREATE TRIGGER prevent_membership_move BEFORE UPDATE ON memberships FOR EACH ROW
BEGIN
  IF NEW.user_id <> OLD.user_id OR NEW.team_id <> OLD.team_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Leave a team before joining another';
  END IF;
END$$
CREATE TRIGGER protect_track_capacity BEFORE UPDATE ON tracks FOR EACH ROW
BEGIN
  IF NEW.max_members < OLD.max_members THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Track capacity cannot be reduced';
  END IF;
END$$
CREATE PROCEDURE get_track_summary()
BEGIN
  SELECT tr.id, tr.name, tr.max_members, tr.registration_open,
    COUNT(t.id) AS team_count, COALESCE(SUM(t.member_count),0) AS participant_count
  FROM tracks tr LEFT JOIN teams t ON t.track_id = tr.id
  GROUP BY tr.id ORDER BY tr.id;
END$$
DELIMITER ;
CREATE VIEW team_overview AS
SELECT t.id,t.name,t.idea,t.track_id,t.created_at,t.member_count,
       tr.name AS track_name,tr.max_members,tr.registration_open,
       tr.max_members - t.member_count AS slots
FROM teams t JOIN tracks tr ON tr.id=t.track_id;
CREATE VIEW track_stats AS
SELECT tr.id,tr.name,tr.max_members,tr.registration_open,
       COUNT(t.id) AS team_count,COALESCE(SUM(t.member_count),0) AS participant_count
FROM tracks tr LEFT JOIN teams t ON t.track_id=tr.id GROUP BY tr.id;


/*DELIMITER $$

CREATE PROCEDURE procedure_name()
BEGIN
  SELECT column_name
  FROM table_name;
END$$

DELIMITER ;

CALL procedure_name();

DELIMITER $$

CREATE TRIGGER trigger_name
BEFORE INSERT ON table_name
FOR EACH ROW
BEGIN
  -- Use NEW.column_name for the incoming row
  IF some_condition THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Explain why the operation is rejected';
  END IF;
END$$

DELIMITER ;


*/
