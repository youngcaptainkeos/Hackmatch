# Open and query the hosted databases

The Vercel site is the app. Your databases are separate services: **Aiven MySQL** for relationships and **MongoDB Atlas** for documents. You can query them directly without changing backend code.

## MySQL: use MySQL Workbench

MySQL Workbench is already installed on this computer. Open it from the applications menu and use the **+** beside MySQL Connections.

| Setting | Value |
|---|---|
| Connection name | HackMatch — hosted MySQL |
| Connection method | Standard TCP/IP |
| Hostname | hackmatch-mysql-hackmatch.f.aivencloud.com |
| Port | 12146 |
| Username | avnadmin |
| Default schema | defaultdb |
| Password | Retrieve from Aiven → hackmatch → hackmatch-mysql → Overview → Connection information → Show password |
| SSL → Use SSL | Require and Verify Identity |
| SSL CA File | /home/shashank/.config/hackmatch/aiven-ca.pem |

Aiven dashboard: https://console.aiven.io/account/a5eef9b63588/project/hackmatch/services/hackmatch-mysql/overview

Click **Test Connection**, then open the connection. Expand **Schemas → defaultdb → Tables** to inspect the six tables. The two views are under Views. Right-click a table → Select Rows to browse it. Open a new SQL tab, type a query, and press **Ctrl+Enter** to execute the statement at the cursor (or select multiple statements and use the lightning icon). Results appear underneath.

Use verified TLS. The saved CA certificate came from your Aiven project. Connection credentials are in your private operator file `~/.config/hackmatch/hosting.env`; they are not in GitHub. The local `.env.local` points to separate development databases, so do not use its private socket for this hosted connection.

Start with these statements:

```sql
USE defaultdb;
SHOW TABLES;
SELECT id, name, email, role FROM users;
SELECT * FROM tracks;
SELECT * FROM teams;
SELECT * FROM memberships;
SELECT id, user_id, team_id, kind, message, status FROM applications;
SELECT * FROM team_overview;
CALL get_track_summary();
SHOW TRIGGERS;
SHOW CREATE TABLE memberships;
SHOW CREATE PROCEDURE get_track_summary;
```

A JOIN you can write during the viva:

```sql
SELECT u.name AS participant, t.name AS team, tr.name AS track,
       m.is_captain
FROM memberships m
JOIN users u ON u.id = m.user_id
JOIN teams t ON t.id = m.team_id
JOIN tracks tr ON tr.id = t.track_id;
```

Show pending invitations separately from participant applications:

```sql
SELECT u.name AS invited_person, t.name AS team, a.message, a.status
FROM applications a
JOIN users u ON u.id = a.user_id
JOIN teams t ON t.id = a.team_id
WHERE a.kind = 'invitation' AND a.status = 'pending';
```

More examples are in `sql/demo-queries.sql`, including GROUP BY, HAVING, subqueries, views, triggers, and a disposable temporary-table DDL/DML demonstration. Querying live production data changes what the website sees. Use SELECT/SHOW for inspection; use the separate local database for destructive experiments.

## MongoDB: use Atlas Data Explorer

Open Vercel → HackMatch → Storage → atlas-byzantium-flower → **Open in MongoDB Atlas**. In Atlas, open **Data Explorer**, expand **hackmatch**, and select a collection:

- `participant_profiles`: skills, biography, availability, interests, nested projects, discoverability.
- `team_openings`: team recruitment role, description, required skills and availability.

Your current Data Explorer: https://cloud.mongodb.com/v2/6ae4b2e3b12851a5ace26bc6#/explorer/6ae4b2e7b12851a5ace27e7c

In a collection's **Documents/Find** tab, the **Filter** field accepts a JSON filter, not an entire JavaScript command:

```json
{}
```

```json
{"skills": "mongodb"}
```

```json
{"discoverable": true, "availability": "Evenings"}
```

```json
{"user_id": "3"}
```

Click **Find/Apply** to run the filter. IDs linking to MySQL are strings in MongoDB. Use the collection's **Aggregations** tab to run a pipeline such as:

```json
[
  {"$match": {"discoverable": true}},
  {"$unwind": "$skills"},
  {"$group": {"_id": "$skills", "participants": {"$sum": 1}}},
  {"$sort": {"participants": -1}}
]
```

For full commands such as `db.participant_profiles.find(...)`, use the MongoDB shell (`mongosh`) or Compass's embedded shell. Those tools are optional; Atlas already supports document filters and aggregation demonstrations in the browser.

Official references: [Aiven MySQL connection tools](https://aiven.io/docs/products/mysql/howto/list-code-samples), [MySQL Workbench SQL editor](https://dev.mysql.com/doc/workbench/en/workbench-faq.html), [Atlas query filters](https://www.mongodb.com/docs/atlas/atlas-ui/query/filter/).
