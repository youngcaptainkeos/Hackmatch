# Database design

## Problem and scope

One hackathon has several tracks. Participants need teammates with complementary skills, understandable recruitment requirements, and compatible availability. HackMatch supports participant/admin accounts, captain permissions, profiles, one team per participant, one editable recruitment brief per team, applications, decisions, captain transfer, leaving, and team deletion. Skill matching counts overlap and does not promise team success. Availability is displayed as context, not used as an undocumented score component.

## Why two paradigms?

MySQL owns relationships and decisions that need atomicity: accounts, sessions, tracks, teams, memberships and applications. MongoDB owns profiles and recruitment documents: arrays of skills/interests and varying nested project experience can be retrieved together. MongoDB performs aggregation for candidate ranking. No vector service, embedding model, or AI inference is used.

## SQL dictionary

Identifiers are INT UNSIGNED. Dates use UTC. Text uses the database's utf8mb4 character set. Enumerated states are constrained in MySQL.

| Table | Attributes and SQL types | Keys / constraints |
|---|---|---|
| users | id INT UNSIGNED; name VARCHAR(80); email VARCHAR(254); password_hash VARCHAR(200); role ENUM(participant,admin); failed_logins INT UNSIGNED; locked_until DATETIME NULL; created_at TIMESTAMP | PK id; UNIQUE email; name length 2..80; email shape/lowercase check; default participant |
| sessions | token_hash CHAR(64); user_id INT UNSIGNED; expires_at DATETIME | PK token_hash; FK user_id -> users, CASCADE delete; expiry index |
| tracks | id INT UNSIGNED; name VARCHAR(80); description VARCHAR(2000); max_members INT; registration_open BOOLEAN | PK id; UNIQUE name; size 2..8; name/description lengths; boolean check |
| teams | id INT UNSIGNED; track_id INT UNSIGNED; name VARCHAR(80); idea VARCHAR(2000); member_count INT; created_at TIMESTAMP | PK id; UNIQUE name; FK track_id -> tracks; idea/name length checks; count >=0 |
| memberships | user_id INT UNSIGNED; team_id INT UNSIGNED; is_captain BOOLEAN; joined_at TIMESTAMP; captain_team_id generated INT UNSIGNED | PK user_id; FKs to users and teams; explicit transactional deletion before team removal; UNIQUE generated captain_team_id; boolean check |
| applications | id INT UNSIGNED; user_id INT UNSIGNED; team_id INT UNSIGNED; message VARCHAR(1000); status ENUM; created_at TIMESTAMP | PK id; FKs to users/teams; team deletion cascades; UNIQUE(user_id,team_id); message length 5..1000; index(team_id,status) |

Application states: pending, accepted, rejected, withdrawn, closed. Each participant may apply only once to a given team. Accepted membership is authoritative; application history can remain accepted after a member leaves. Users and tracks are not deleted by the web interface.

## Relationships

- User 1 -> 0..many sessions.
- User 1 -> 0..1 current membership; team 1 -> 0..many memberships at database level.
- Track 1 -> 0..many teams; every team has exactly one track.
- User 1 -> 0..many applications; team 1 -> 0..many applications.
- The team creation transaction creates its first membership and captain atomically. A zero-member team cannot be created through the API.
- The captain unique index allows at most one captain per team. Existence of a captain for every extant team is preserved by API transactions; it is not independently guaranteed by a deferred SQL constraint.

## Normalization and deliberate derived state

Accounts, tracks, teams, memberships and applications represent separate entities. Membership models the user/team relationship; its PK enforces one current team per user. Repeating profile skills/projects belong in MongoDB arrays. member_count is a deliberately denormalized counter maintained by membership triggers to serialize capacity checks. The supplied diagnostic query compares it with actual memberships. Trusted operators must not edit this counter directly. Team deletion explicitly deletes memberships before deleting the team. This is required because MySQL disallows cascading foreign keys on a base column of a stored generated column. Application records still cascade when a team is deleted.

## Advanced SQL features

1. Transactions: team creation, application submission/decisions, captain transfer, leaving and deletion.
2. Triggers: enforce_team_capacity atomically increments the parent counter only when a slot exists; release_team_slot decrements on leaving; prevent_membership_move blocks direct team swaps; protect_track_capacity prevents lowering a track limit.
3. Views: team_overview joins track/capacity data; track_stats aggregates team counts and current members.
4. Stored procedure: get_track_summary is executed by the admin API.
5. Indexes: unique email/name, one application, one captain, application status, session expiry and foreign-key indexes.

Parameterized mysql2.execute calls are visible in separate route files. No ORM. A shared endpoint helper handles HTTP errors/origin checks, and a small connection helper shares the pool. Important queries are in sql/demo-queries.sql.

## Concurrency

Submission/acceptance take a shared lock on the track and a lock on the team/user before deciding. Closing registration updates the track and waits for earlier shared locks: operations already underway may finish; subsequent operations see the closure. The capacity trigger's conditional UPDATE locks the team row, so only one insert wins a last slot. Its update rolls back if the membership insert fails. The unique membership PK prevents competing teams from recruiting one person twice. Deadlock/lock-timeout responses ask the user to refresh and retry; partial work is rolled back.

Captain transfer demotes/promotes inside one transaction under the team lock. The departing captain must transfer first or delete the team. The generated nullable captain_team_id gives MySQL the equivalent of a partial unique captain index: multiple NULLs are allowed, two equal non-NULL team IDs are not.

## MongoDB data model

participant_profiles (one per participant):

```json
{"user_id":"3","bio":"I build Python services and enjoy practical ML projects.","preferred_role":"ML developer","availability":"Evenings","skills":["python","mongodb"],"interests":["Security"],"projects":[{"title":"Spam filter","description":"Classifies suspicious text messages.","url":"https://example.com/project"}],"discoverable":true}
```

team_openings (one editable recruitment brief per team):

```json
{"team_id":"1","title":"Backend developer","description":"Build our API and integrate the classifier.","required_skills":["python","mongodb"],"preferred_availability":"Evenings"}
```

Both documents have updated_at dates. Database JSON Schema validators enforce required fields, lengths, array types/limits, valid availability and booleans. Profile projects have nested title/description/URL validation. API validation additionally checks HTTP(S) URL validity, trims strings, and normalizes skill names to lowercase. The database validators enforce shape; they do not enforce a live SQL parent reference.

Indexes: unique participant_profiles.user_id; compound multikey discoverable + skills; unique team_openings.team_id. The aggregation first matches eligible user IDs/discoverability, uses $setIntersection, counts with $size, sorts by shared-skill count then user_id, and limits to 100. The skills index helps applicable skill-filter queries; the runtime eligibility/ID filter can use the unique user_id index. The computed-score sort is not claimed to be index-covered.

## Retrieval and consistency

1. SQL selects participant accounts without memberships, excluding the requester.
2. MongoDB ranks their discoverable profiles by required skill intersection.
3. The API attaches current names from SQL, never a duplicate name field.
4. The interface displays matched-count / required-count and availability. A blank search browses available profiles with no match score.

Mongo user_id/team_id are decimal strings corresponding to SQL IDs. There are no cross-database foreign keys or distributed transactions. Registration creates only a SQL account; first profile save upserts its document, so a Mongo outage does not produce a half-created account. Missing profiles can be created later.

Team creation likewise requires only SQL; the captain adds a recruitment brief afterward. A recruitment save holds a shared SQL parent/team-membership lock until Mongo finishes, preventing deletion/transfer racing that save. Team deletion commits SQL first and attempts Mongo cleanup. Failed cleanup leaves an orphan document that reads exclude by valid team IDs; rerunning scripts/cleanup-openings.mjs safely removes these orphans. No duplicate membership/discoverability status is synchronized between databases.

## Security and limitations

Passwords: per-password random salt + async scrypt + timing-safe verification. Sessions: random 256-bit tokens; only SHA-256 token hashes stored, seven-day expiry; HttpOnly/SameSite=Lax; Secure in production. Login rotates the current browser session. Sign-out revokes it. Server-side admin/captain checks and mutation-origin checks run independently of the UI. Five failed logins temporarily lock that account for 15 minutes. Expired sessions are rejected and can be cleaned by the maintenance script.

This is password-based college-project authentication, without email delivery, password reset, email verification, OAuth, or MFA. Public launch should additionally configure provider rate limiting/bot protection, backups, least-privileged DB runtime credentials, monitoring, and a recovery/email plan. Do not claim those features exist. Cloud databases must use verified TLS and restricted network access. The local helper uses a private MySQL socket and loopback-only MongoDB; it is not hosting configuration.
