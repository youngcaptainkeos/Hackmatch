# Assignment coverage and completion gate

Source: DBMS Level 3 Project Requirements.pdf, supplied by the student. This checklist distinguishes software evidence from student/instructor evidence. A planned feature is not a passing result.

| # | Requirement | Deliverable / evidence | Status |
|---|---|---|---|
| 1 | Unique title, meaningful problem, beyond CRUD | HackMatch: skill-based teammate discovery and controlled team formation; student verifies title uniqueness | Implemented scope; title confirmation pending |
| 2 | Two approved members, both contribute database + application work | docs/CONTRIBUTIONS.md | Student evidence pending |
| 3 | Option 1, SQL + NoSQL | MySQL + MongoDB; native connections, no Docker dependency | Implemented; runtime evidence in TESTING.md |
| 4 | ER diagram, relational schema, PK/FK/constraints; NoSQL model/indexes/retrieval | docs/diagrams/, docs/DATABASE.md, sql/schema.sql | See generated diagrams and database docs |
| 5 | CREATE, ALTER, DROP, keys, constraints, indexes, views | sql/schema.sql and sql/demo-queries.sql | Implemented; disposable DDL demo |
| 6 | INSERT, UPDATE, DELETE, SELECT; JOIN, GROUP BY, HAVING, ordering, aggregates, subqueries | Route files + sql/demo-queries.sql | Implemented; verify using demo |
| 7 | Four advanced SQL concepts + one NoSQL | Transactions, views, triggers, stored procedure, indexes; Mongo aggregation | Implemented; execution evidence in TESTING.md |
| 8 | Vector search optional | Deliberately omitted for Option 1; matching uses skill-set intersection | Not applicable (optional) |
| 9 | Functional Next.js interface | Landing, sign-in/up, workspace, discovery, profile, team/admin screens | Implemented; QA recorded in TESTING.md |
| 10 | Backend integration and environment variables | app/api/*, lib/mysql.js, lib/mongodb.js, .env.example | Implemented; live Vercel configuration pending |
| 11 | Backend authentication, two roles | Salted scrypt, hashed sessions, participant/admin checks; team captain authorization | Implemented; tests in TESTING.md |
| 12 | Database validation and integrity | SQL constraints/triggers/transactions + Mongo JSON Schema validators | Implemented; tests in TESTING.md |
| 13 | Objectives, requirements, ER, schema, justification, dictionary, implementation, queries, architecture, screenshots, tests, conclusion | README.md + docs/REPORT.md + database/diagram/testing docs | See actual evidence; do not claim unexecuted checks |
| 14 | GitHub, meaningful individual contributions, setup README | Fresh implementation is in hackmatch-clean; original clone untouched | Git publication and real member commits pending |
| 15 | Demonstration of design, queries, UI, integrations, advanced features, tests and contributions | docs/DEMO.md and TESTING.md | Software evidence recorded; individual demo pending |
| 16 | Originality | Custom HackMatch implementation; credited shadcn primitives and motion inspiration | Student must ensure course rules and own contribution requirements |
| 17 | Database choices justified; beyond CRUD | docs/DATABASE.md and REPORT.md | Implemented design |

## Deployment completion gate

Vercel deployment is an additional user requirement. It is not complete until a real Vercel URL is deployed with reachable hosted MySQL and MongoDB databases, production environment variables, and the full authentication/application flow is verified there. No hosting accounts have been supplied. Local preview does not establish deployment.

## Evidence rules

Do not fabricate instructor approval, teammates, commits, screenshots, test results, production users, or deployment. Update this checklist as real evidence becomes available. Docker is optional tooling and is not mentioned as a requirement in the assignment.
