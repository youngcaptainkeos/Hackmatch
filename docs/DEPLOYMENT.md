# Vercel deployment checklist

Production app: https://hackmatch-phi.vercel.app/. Source repository: https://github.com/youngcaptainkeos/Hackmatch. Hosting uses Vercel Hobby, Aiven MySQL Free, and MongoDB Atlas Free through Vercel's native integration. See the verification record below for backend readiness.

## 1. Prepare accounts and databases

Create/sign in to Vercel and MongoDB Atlas. Choose a MySQL provider that supports MySQL 8.0.16+ (8.4 preferred), CHECK constraints, triggers, views and stored procedures on the selected plan. These features matter for the rubric; a provider that forbids CREATE TRIGGER/CREATE PROCEDURE is unsuitable without revisiting the design. Confirm region and pricing before provisioning. No subscriptions are created by this project.

Create an empty MySQL database using utf8mb4. Create separate setup and runtime users if supported; setup needs DDL, indexes, triggers/views/procedure creation, and runtime needs the application's DML plus EXECUTE on get_track_summary and SELECT on views. MySQL triggers require the appropriate definer privileges. Runtime should not get schema ownership or a global root account.

Create an Atlas cluster/database user. Configure network access appropriate for the deployment and verified TLS. Choose a Vercel/database network arrangement supported by your providers; do not assume local IP allowlisting works for serverless egress. Never turn off certificate verification to get a connection working. Ask before selecting a paid service or weakening network restrictions.

## 2. Publish the new source

This fresh implementation is a sibling of the original repository. Decide whether to publish it as a new repository or replace the original repository on an agreed branch. Preserve the old code/history. Push source without .env*, node_modules, .next, test databases or native runtime files. Both students should make their actual work commits under their own identities.

The app is published at the root of youngcaptainkeos/Hackmatch, so leave Vercel Root Directory at the repository root. Import that repository into Vercel. Choose Next.js and Node 22.x. If publishing a parent repository containing multiple directories, set Root Directory to `hackmatch-clean`; if publishing only this folder, use the repository root. Install: npm ci. Build: npm run build. No custom output directory is needed.

## 3. Environment variables

Configure these in Vercel's server-side environment settings. Do not put real values into committed files, browser code or NEXT_PUBLIC_* variables.

| Variable | Production value |
|---|---|
| MYSQL_URL | Provider's MySQL URI, including database name |
| MYSQL_SSL | true |
| MYSQL_SSL_CA | Provider CA certificate in PEM format; required for Aiven certificate verification |
| MONGODB_URI | Atlas connection URI |
| MONGODB_DATABASE | Your database name |
| APP_ORIGIN | Exact stable HTTPS origin, without trailing slash |

Do not configure MYSQL_SOCKET in Vercel. SEED_PASSWORD is only needed by the operator's one-time seed command and should not remain a runtime setting. Rotate/delete sample accounts for a public launch. Use separate databases for preview vs production if testing destructive demo flows.

Origin checks are deliberate: production APP_ORIGIN must match the deployed browser origin. Vercel preview deployments have different origins; configure their own environment/origin and redeploy before trying authenticated mutations. After an initial deployment assigns a URL, set the matching origin and redeploy if necessary. A build can succeed without databases because public pages do not query them; this does not verify backend connectivity.

## 4. Initialize from the local operator terminal

Use an uncommitted environment file with hosted connection details and a setup user. Run db:init and optionally db:seed **once** against the new empty databases. Do not put schema creation/seed commands in the Vercel build or request handlers. After initialization, switch Vercel to the runtime user. SQL files are not automatic upgrade migrations.

The providers can be initialized independently as they become available, using Node 22:

```sh
node --env-file=.env.hosting.local scripts/init.mjs --mongo-only
node --env-file=.env.hosting.local scripts/init.mjs --mysql-only
node --env-file=.env.hosting.local scripts/seed.mjs
```

Do not rerun initialization against an initialized database. `.env.hosting.local` is ignored by Git and must stay private. The Atlas integration supplies `MONGODB_URI`; set `MONGODB_DATABASE=hackmatch` separately. Production uses `APP_ORIGIN=https://hackmatch-phi.vercel.app`. Keep preview testing separate from production data.

## 5. Verify the real deployed URL

- Landing, sign-in/sign-up, responsive layouts, animation and reduced-motion fallback.
- Register a participant, confirm cookie flags, sign out/in, wrong-password rejection.
- Save a profile and project, verify Mongo persistence and skill search.
- Admin account can create/toggle tracks; participants cannot call admin routes.
- Create a team, add requirements, apply from another account, accept as captain.
- Membership/capacity/competing-application rules remain correct on hosted MySQL.
- Transfer captaincy, leave, delete a test team, verify Mongo cleanup.
- Confirm no secret is in the browser bundle or Git; capture screenshots and test evidence.

Do not mark deployment complete until these checks run against an actual successful Vercel deployment. Email verification/password recovery, MFA and hosted bot/rate-limit infrastructure are not currently implemented; this is a course-project authentication flow.

## Optional maintenance

Run `node --env-file=.env.local scripts/cleanup-openings.mjs` using the intended environment to remove stale recruitment documents whose SQL teams no longer exist and expired sessions. This is an operator action, not an automatic scheduled job.

## Aiven certificate and installation notes

Download the project CA certificate from Aiven and enter its PEM content as MYSQL_SSL_CA in Vercel. Both multiline PEM and literal backslash-n separators are supported. Keep MYSQL_SSL=true; rejectUnauthorized remains enabled. Do not commit downloaded certificates or private keys. Verify the account can create the required triggers, views, and procedure before initializing the final schema.

vercel.json skips the local-only MongoDB binary download during dependency installation. Native local database services are not run on Vercel.

## Hosted verification — 30 October 2026

- Vercel production redeployed successfully with all six server-side database/origin variables.
- Aiven `hackmatch-mysql` runs MySQL 8.4.11 on the Free plan in Asia Pacific. Schema initialized in `defaultdb`: six tables, four triggers, two views, and `get_track_summary()`; the procedure returned all four seeded tracks.
- Atlas database `hackmatch` has `participant_profiles` and `team_openings`, strict validators, and five indexes including `_id` indexes. Atlas rejected an invalid profile with validation error 121.
- Seeded seven demo accounts, four tracks, two teams, six participant profiles, and two recruitment briefs. Demo passwords come from the local operator's existing `SEED_PASSWORD`, never from a committed file or a Vercel runtime variable.
- Passed 25 API checks against the actual `https://hackmatch-phi.vercel.app` deployment: registration, correct/incorrect login, logout, secure HttpOnly session cookies, origin protection, role restrictions, profile/project persistence, skill aggregation, recruitment, application acceptance, captain transfer, leave, and team/document cleanup. Verified stored passwords use scrypt. Temporary verification accounts and their data were removed; seeded demo data remains.

Operator connection details are stored outside the repository at `~/.config/hackmatch/hosting.env` with file mode 0600. The current course deployment uses provider-generated database credentials; using a dedicated restricted runtime account remains a hardening step before a broader public launch. The unrelated PostgreSQL service is not used by HackMatch and was left untouched. Free Aiven services can power off after inactivity; check the console before a viva/demo.
