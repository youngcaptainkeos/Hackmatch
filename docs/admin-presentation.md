# HackMatch admin login and SQL presentation

Open https://hackmatch-phi.vercel.app/admin/sign-in for the admin computer.
Open https://hackmatch-phi.vercel.app/sign-in for the participant computer.
Both computers must use this same deployed site. Localhost has its own development database.

## Request flow

1. `app/admin/sign-in/page.jsx` renders `components/auth-form.jsx` in admin mode.
2. The form sends email/password and `adminOnly: true` to `POST /api/auth/login`.
3. `app/api/auth/login/route.js` finds the user using a parameterized SQL SELECT, verifies the password hash, checks role, and creates a session. It returns `/admin` for admins and `/dashboard` for participants.
4. `lib/password.js` verifies the salted scrypt password hash. The database stores a hash rather than the password.
5. `lib/auth.js` creates a random session token, stores its SHA-256 hash in the MySQL `sessions` table, and sends the raw token as an HTTP-only cookie. `getUser()` joins sessions to users and checks session expiry. `requireUser('admin')` checks authorization.
6. `app/admin/page.jsx` checks the session and role on the server before rendering the console. Signed-out users go to admin sign-in; participants go to their dashboard.
7. `components/sql-demo.jsx` is the admin console. It loads participants, shows SQL and results, and sends the chosen query ID plus participant ID to `/api/demo/sql`.
8. `app/api/demo/sql/route.js` checks admin authorization on every GET and POST. GET lists participants and their teams. POST selects a fixed server-side query. Changes run in a transaction and commit only on success; failures roll back.
9. `lib/demo-queries.js` contains the actual SQL SELECT, CALL, SHOW CREATE, UPDATE, and reset commands. Participant IDs are bound to `?` parameters. SQL text supplied by the browser is never executed.
10. `lib/mysql.js` supplies the shared MySQL connection pool from server environment variables.
11. `components/dashboard.jsx` refreshes a visible participant dashboard every five seconds and on window focus. `/api/me` reloads the user's name; `/api/teams` reloads teams, memberships, and applications; `/api/profiles` reloads the MongoDB profile and MySQL membership. These requests see committed SQL updates.

The old `/sql-demo` URL redirects to `/admin`. An admin who uses regular sign-in also lands on `/admin`; `/dashboard` redirects admin users to `/admin`.

## Demo sequence

1. Your friend signs in as a participant on the deployed site.
2. Sign in as admin in your browser, choose “Update selected participant name”, and select your friend's email.
3. Run update. It appends ` [SQL demo]` to the displayed name in the MySQL `users` table. The participant's email/password stay the same.
4. Your friend keeps their dashboard visible. The new name appears on the next poll, usually within five seconds plus network time. Refresh can also fetch it immediately.
5. Choose the team update for a participant who belongs to a team. It changes the team's shared `teams.name` value, visible to all members when fetched again.
6. Choose Reset for the same participant. It removes the demo suffix from that name and the participant's current team name.

Reset restores only these marker-based demo changes. It is not a general rollback of arbitrary database edits. Select the same participant before reset. No team change occurs for a participant without a team.

## Authentication versus stored procedures

Admin sign-in uses ordinary parameterized SQL queries plus password verification and sessions in JavaScript. It does not call a stored procedure. The example stored procedure is `get_track_summary`, invoked with `CALL get_track_summary()` from the console. Its definition and the triggers are in `sql/schema.sql`.

The membership triggers fire automatically when membership rows change. Renaming a user or team does not fire membership triggers, because those UPDATEs target different tables.

## Account setup

`lib/provision-admin.mjs` creates the admin account from a trusted terminal/build using an email and scrypt hash. `vercel.json` invokes this before the build when setup values are supplied. Existing admin credentials are preserved; a participant account cannot be promoted by this script. There is no public admin registration endpoint and no password embedded in frontend source.
