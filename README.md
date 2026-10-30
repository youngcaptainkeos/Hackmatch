# HackMatch

Good ideas need great teams. A hackathon teammate-discovery and team-formation application, rebuilt with simple Next.js route files, direct MySQL queries, and MongoDB document aggregation.

## What is here

- Original black/ivory/lime landing page with animated connection graphics, local fonts, scroll reveals and reduced-motion support.
- Separate sign-up/sign-in pages, salted scrypt passwords, hashed server sessions, logout, temporary login lockout and server-side permissions.
- Participant profiles, skills, project links, team/track exploration, skill-overlap search and recruitment briefs.
- Team creation, applications, acceptance/rejection/withdrawal, captain transfer, leaving, deletion and an admin dashboard.
- Six MySQL tables, two MongoDB collections, SQL transactions, four triggers, two views, a stored procedure, indexes, database validators and real-database tests.
- ER/schema/architecture/document-model SVG diagrams, editable Mermaid sources, database dictionary, demo queries and assignment coverage checklist.

Scope: one hackathon, multiple tracks, one current team per participant, one editable recruitment brief per team. Sample data is labelled; no fabricated users or statistics are presented as live results on the public home page.

## Source repository

https://github.com/youngcaptainkeos/Hackmatch — import the repository root into Vercel.

## Requirements

Node.js **22.x**, npm, and MySQL 8.0.16+ (8.4 recommended). Production additionally needs hosted MySQL, MongoDB Atlas and a Vercel account. Docker is **not required** and is not used by the native setup.

Your system initially had Node 18. Activate Node 22 before these commands (for example, with `nvm install 22 && nvm use 22` if you use nvm). Check `node --version` first. See https://nodejs.org/en/download for an official installation option.

```bash
npm ci
npm run db:local
```

Keep that terminal open. This helper starts a separate native MySQL server using the installed `mysqld` binary and downloads/starts an official MongoDB 7 binary through mongodb-memory-server. **It runs a real MongoDB server, not a mock.** It never connects to or alters your system MySQL installation. MySQL uses a private Unix socket; MongoDB binds to loopback. First MongoDB download needs internet and compatible Linux libraries.

Local database files are stored in a project-specific directory under `/tmp/hackmatch-native-*` because this project's mounted filesystem is unsuitable for a MySQL data directory. `/tmp` can be cleared by the OS: this is development/sample data. Back up work you need to retain. The helper creates `.env.local` and refuses to overwrite unrelated existing configuration. Keep it private. It prints no password.

In a second terminal:

```bash
npm run db:init
npm run db:seed
npm run dev
```

Open **http://localhost:3000** (APP_ORIGIN must match the browser origin). The seed password is generated into your local `.env.local` as `SEED_PASSWORD`. Read it locally; do not commit or share it. Demo accounts:

- `admin@hackmatch.local`
- `arjun@hackmatch.local`, `ananya@hackmatch.local`, `riya@hackmatch.local`
- `kabir@hackmatch.local`, `meera@hackmatch.local`, `dev@hackmatch.local`

New registrations always become participants. There is no client-facing admin role assignment. First profile save creates the MongoDB document. Creating a team makes you captain; add its recruitment brief from My team.

Initialization and seeding run once on an empty database. They refuse to overwrite populated databases. MySQL DDL auto-commits, so a failed first initialization can leave partial empty tables; investigate the cause and use a new empty database rather than rerunning destructive commands blindly. Use `sql/schema.sql` for first install. Existing deployments apply the additive scripts in `sql/migrations/` once, in numeric order.

## Connect existing or hosted databases instead

Skip `db:local`. Copy `.env.example` to `.env.local` and fill it locally with your own connection details. Use a new empty database and then run init/seed once. A hosted MySQL provider must support **CHECK constraints, triggers, views, and CREATE PROCEDURE** for this assignment. Set MYSQL_SSL=true for verified TLS. For Aiven, also set MYSQL_SSL_CA to the project CA certificate PEM. MongoDB Atlas uses its `mongodb+srv://` connection URI. Do not use the native helper's local socket/root configuration in production.

## Build and test

```bash
npm run build
npm start
npm test
npm run diagrams
```

`npm test` requires the local database services and a successful production build. It creates isolated `hackmatch_test_*` MySQL and MongoDB databases, initializes/seeds them, starts a test production server on port 3107, runs real HTTP/database/concurrency checks, and drops only those test databases afterward. It needs CREATE/DROP DATABASE rights on the development MySQL instance. Never use production credentials for the tests.

Detailed results and verification limits: [docs/TESTING.md](docs/TESTING.md).

## Easy-to-present backend

- `lib/mysql.js`: one connection pool.
- `lib/mongodb.js`: one MongoDB client.
- `lib/password.js`: hashing and verification.
- `lib/auth.js`: sessions and current-user checks.
- `lib/http.js`: shared origin/error handling.
- `app/api/teams/route.js`: visible SELECT/INSERT/DELETE queries and team transaction.
- `app/api/applications/route.js`: explicit acceptance transaction, with BEGIN/COMMIT/ROLLBACK.
- `app/api/matches/route.js`: SQL eligibility + MongoDB aggregation.
- Other features each have their own route file. No ORM, generated query layer or catch-all router.

## Documentation and diagrams

Start with [docs/REPORT.md](docs/REPORT.md), [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md), [docs/DATABASE.md](docs/DATABASE.md), [docs/DEMO.md](docs/DEMO.md), and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Open `docs/diagrams/index.html` to view/print the four diagrams. Each diagram is also a standalone SVG, with Mermaid source for ER/schema/architecture and an extra acceptance sequence diagram. `docs/screenshots/` contains captured application evidence when available.

## Deployment

Target: **Vercel**, using its standard Next.js Node runtime and externally hosted MySQL/MongoDB. No Sites/Cloudflare deployment is created. See the step-by-step guide in docs/DEPLOYMENT.md. A local preview or successful build is not a completed deployment.

## Assignment and ownership

The original PostgreSQL project remains in the sibling `hackmatch` directory, untouched. This fresh code is in `hackmatch-clean`. Record real contributions from both students; neither commits nor instructor approval are fabricated. Verify the project title is unique in your section and follow your institution's rules for external components/assistance. UI primitives are credited in THIRD_PARTY_NOTICES.md.

## Database access for your viva

See [the database access guide](docs/DATABASE-ACCESS.md) for the Aiven MySQL Workbench connection, Atlas query UI, and ready-to-run SQL/MongoDB examples. Captains can invite discoverable participants from Find teammates; recipients accept or decline in My team.
