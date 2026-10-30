# Demonstration and viva route

## Suggested demonstration

1. Open the landing page; show desktop/mobile views and reduced-motion behavior.
2. Sign up a participant. Explain name/email/password validation, default participant role, salted password hash, session token hash and cookie settings.
3. Save a profile with skills, availability and a nested project. Inspect the Mongo document and validator/index definitions.
4. Sign in as Arjun. Show PhishGuard's recruitment brief. Search for Python/MongoDB skills and explain the shared-skill count, with membership eligibility coming from MySQL.
5. In another browser session sign in as Ananya and apply to PhishGuard. Show the applications table.
6. As Arjun accept the application. Walk through BEGIN, locks, membership INSERT, trigger/counter, application state changes and COMMIT. Show rollback/concurrency test evidence.
7. Transfer captaincy, leave, and demonstrate the one-team/one-captain rules. Use disposable accounts/teams for deletion.
8. Sign in as admin. Toggle track registration, create a track and explain the stored procedure and aggregate view.
9. Execute sql/demo-queries.sql against development data. Explain JOIN, GROUP BY, HAVING, subquery, ordering and disposable DDL/DML. MySQL DDL auto-commits; the demo does not pretend ROLLBACK reverses schema changes.
10. Show ER/schema/architecture/document diagrams, test results and actual individual Git contributions.

## Questions to be ready for

- Why split MySQL and MongoDB? Which database is authoritative for membership?
- Why is membership.user_id a primary key? What does the generated captain unique key enforce?
- How does a trigger protect the final team slot? What happens if two requests arrive at once?
- Why use a transaction for team creation and captain transfer?
- Why can a SQL transaction not roll back a MongoDB write?
- How do missing profiles and orphan recruitment briefs recover safely?
- Which joins/aggregations power the dashboard? Why a view and a stored procedure?
- Why is a salted password hash different from encrypting a password?
- Why store only session token hashes? How do expiry and logout work?
- What does the Mongo aggregation score actually mean? What are its limitations?
- What do Mongo validators enforce, and what do they not enforce across databases?
- Which constraints are enforced by SQL, and which invariants also depend on API transactions?
