# HackMatch — DBMS Level 3 project report

## Objective

Help hackathon participants discover teammates with complementary skills and form teams without violating capacity or membership rules. Connect meaningful application workflows to relational integrity, transactions, document modeling and aggregation.

## Problem statement

Participants often know what they want to build but struggle to find people whose skills, interests and availability fit the work. Informal team formation gives little visibility into recruitment needs and can create duplicate memberships or overfilled teams. HackMatch provides profiles, track-based exploration, explainable skill overlap, applications and controlled captain decisions.

## Functional requirements

Participants register/sign in, maintain profiles and nested project experience, discover teams/available participants, create teams, publish a recruitment brief and apply. Captains accept/reject applications, transfer leadership and delete teams; regular members can leave. Applicants can withdraw pending applications. Administrators create tracks, control registration and inspect aggregate counts. Backend authorization is independent of the UI.

## Database choice and justification

Option 1: MySQL + MongoDB. MySQL is authoritative for identities, team relationships and atomic application decisions. MongoDB stores variable profile/recruitment documents and ranks candidate profiles through set-based aggregation. Detailed dictionary, normalization, integrity rules, limitations, indexes and retrieval strategy are in DATABASE.md.

## Design and implementation

- ER diagram: diagrams/er.svg (editable er.mmd).
- Relational schema: diagrams/schema.svg and sql/schema.sql.
- System architecture: diagrams/architecture.svg (editable architecture.mmd).
- NoSQL document model: diagrams/mongodb-model.svg.
- Extra acceptance sequence: diagrams/application-flow.mmd.
- Important SQL: sql/demo-queries.sql. Mongo matching pipeline: app/api/matches/route.js.

Advanced SQL demonstrated: transactions, triggers, views, indexes and stored procedure. Advanced MongoDB: aggregation using $match/$setIntersection/$size/$sort/$limit, with validators and indexes.

## Application architecture

Next.js App Router supplies public pages, separate authentication screens and a protected workspace. Individual Node.js route handlers validate input and permissions, execute parameterized SQL, and use MongoDB's native driver. Password hashing uses salted scrypt; server sessions use random tokens with hashes at rest. Production target is Vercel with hosted external databases. Docker is not part of the application or assignment requirement.

## Screenshots and test results

See TESTING.md for actual verification results/limits and screenshots/ for captured evidence. A successful build is reported separately from runtime, concurrency and production deployment checks. Do not treat a checklist entry or a sample account as proof of an unexecuted workflow.

## Individual contributions

Record the two students' actual names, responsibilities and commit evidence in CONTRIBUTIONS.md. Instructor approval and uniqueness of the project title must be confirmed by the students.

## Conclusion

HackMatch combines relational guarantees for team formation with flexible document modeling for participant discovery. Its matching results are explainable as shared skills, and its key decisions are protected by SQL constraints and transactions. Remaining external setup and student-owned submission evidence are tracked in REQUIREMENTS.md and DEPLOYMENT.md.
