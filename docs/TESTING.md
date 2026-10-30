# Verification results

Verified locally on 30 October 2026 with Node 22, Next.js 16.4.3, native MySQL 8.0.46 and native MongoDB 7.0.24. Docker was not used for the successful verification.

## Production build

`next build --webpack`: passed. Public landing/404 pages are static; authentication, protected workspace and API handlers are dynamic. Build concurrency is limited to two workers to reduce local load.

## Real integration tests

`node --env-file=.env.local --test tests/integration.test.mjs`: **19 passed, 0 failed, 0 skipped** (18 subtests plus the parent). Raw output: test-results.tap. The suite creates isolated temporary MySQL/MongoDB databases, initializes/seeds real data, starts a production Next.js HTTP server on port 3107, and removes only its own test databases afterward.

Verified:

- Anonymous identity/protected routes, dashboard redirect, mutation-origin checks, malformed JSON rejection.
- Salted scrypt hashes, correct/wrong password checks, participant-only public registration, duplicate email rejection.
- HttpOnly/SameSite/Secure production cookies, token hashes at rest, session expiry and logout revocation.
- Participant/admin/captain authorization and temporary failed-login lockout.
- Profile persistence, lowercase/deduplicated skills, unsafe project URL rejection and Mongo aggregation ranking.
- MongoDB validators, required fields, skill-array limits and unique document references.
- Captain-only recruitment saves and missing-team rejection.
- Closed registration blocking team creation and application submission.
- Application submission, duplicate rejection, unauthorized decisions and withdrawal ownership.
- Atomic acceptance and closure of competing pending applications.
- Unique membership/captain constraints and prohibition of direct team swaps.
- Captain transfer, leaving and occupancy-counter maintenance.
- Team creation rollback without orphan teams.
- Two simultaneous HTTP acceptances into one final team slot: **exactly one succeeds**, one returns conflict, occupancy remains within limit and the losing application remains pending.
- SQL CHECK constraints, lowercase email validation, track-limit protection, views, stored procedure and all supplied demo queries.
- Team deletion permission, explicit membership cleanup, SQL application cascade and Mongo recruitment cleanup.
- Rejection/withdrawal terminal states and resubmission rejection.

The final captured integration result was rerun after the backend/SQL fixes. Subsequent CSS-only phone-navigation adjustments do not change database behavior.

## Browser checks

Verified through the connected browser against the local production server:

- Desktop landing, animated graphic, navigation, sign-in and sign-up layouts.
- Successful sign-in with a disposable local demo account, protected workspace loading, profile save and normalized skills reflected in the form.
- Search for python/mongodb returns Ananya and Dev with 2/2 shared skills, Kabir with 1/2, Riya with 0/2; existing team members are excluded.
- Profile modal opens with close-button focus and closes with Escape.
- Narrow phone workspace/matching layouts have no horizontal content overflow in inspected widths. Mobile menu hides offscreen controls, opens navigation, makes the background inert, and allows sign-out.
- Sign-out returns to the public landing page.
- No production-console error was observed in the inspected sign-in/workspace flows.

Screenshots are actual browser captures under screenshots/. Sample people/teams are seeded local demonstration data; a disposable Demo Participant account was added for UI verification and removed after capture. Static screenshots do not establish animation performance, reduced-motion behavior on every device, or hosted deployment.

## Diagram QA

ER, schema, architecture and MongoDB-model SVGs were rendered to PNGs and visually inspected for readable labels, relationships and clipping. Mermaid source remains editable. ER references to MongoDB are dashed because they are application-managed, not SQL foreign keys.

## Verification limits and remaining work

- No live Vercel deployment, hosted MySQL or Atlas account has been provisioned. Hosted TLS, network access, provider permissions, cookie/domain behavior and complete hosted workflows remain to be verified.
- Instructor approval, title uniqueness and two students' actual contributions cannot be established by automated tests.
- Not every UI action has been exercised manually in every browser/device. Core team/application/admin behaviors are covered by real HTTP/database tests; additional college demo rehearsal is recommended.
- Reduced-motion CSS is present; OS-level preference emulation was not available in the connected browser controls.
- Authentication has no email verification, password recovery, MFA or external bot-protection service. Those are not claimed as implemented.
- The native development helper needs its terminal to stay open. MongoDB's first binary download requires internet and compatible Linux libraries. Development files in /tmp are not a durable backup.
