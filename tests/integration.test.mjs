import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { getMySQL } from '../lib/mysql.js';
import { getMongoDB } from '../lib/mongodb.js';
import { initialize } from '../scripts/init.mjs';
import { seed } from '../scripts/seed.mjs';
import { hashPassword, verifyPassword } from '../lib/password.js';

// Real MySQL + MongoDB, isolated databases. No application data is erased.
// Requires CREATE/DROP DATABASE rights on a DEVELOPMENT MySQL server.
test('real-database integration and HTTP workflows', async (t) => {
  const name = `hackmatch_test_${Date.now()}`;
  const originalUrl = process.env.MYSQL_URL;
  const originalMongo = process.env.MONGODB_DATABASE;
  const admin = getMySQL();
  let db, mongo, server;
  let serverLog = '';
  try {
    await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4`);
    const url = new URL(originalUrl);
    url.pathname = `/${name}`;
    process.env.MYSQL_URL = url.toString();
    process.env.MONGODB_DATABASE = name;
    globalThis.mysqlPool = null;
    db = getMySQL();
    await initialize();
    await seed();
    mongo = await getMongoDB();
    const base = 'http://127.0.0.1:3107';
    server = spawn(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3107'],
      {
        env: { ...process.env, APP_ORIGIN: base, NODE_ENV: 'production' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    server.stdout.on('data', (data) => (serverLog += data));
    server.stderr.on('data', (data) => (serverLog += data));
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(base + '/api/me');
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'Test production server did not start: ' + serverLog.slice(-1500));
    async function request(
      path,
      { method = 'GET', body, cookie, origin = base, status = 200 } = {}
    ) {
      const response = await fetch(base + '/api/' + path, {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...(origin ? { Origin: origin } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
      return { data, cookie: response.headers.get('set-cookie')?.split(';')[0], response };
    }
    async function login(email) {
      return (
        await request('auth/login', {
          method: 'POST',
          body: { email, password: process.env.SEED_PASSWORD },
        })
      ).cookie;
    }
    let captainCookie, adminCookie, applicantCookie, otherCookie;
    await t.test('anonymous access and origin protection', async () => {
      assert.equal((await request('me')).data.user, null);
      const malformed = await fetch(base + '/api/auth/register', {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json' },
        body: '{invalid',
      });
      assert.equal(malformed.status, 400);
      await request('teams', { status: 401 });
      await request('auth/register', {
        method: 'POST',
        body: {},
        origin: 'https://untrusted.example',
        status: 403,
      });
      await request('auth/register', { method: 'POST', body: {}, origin: null, status: 403 });
      const response = await fetch(base + '/dashboard', { redirect: 'manual' });
      assert.ok([307, 308].includes(response.status));
    });
    await t.test('passwords are salted and verified', async () => {
      const a = await hashPassword('a-good-password'),
        b = await hashPassword('a-good-password');
      assert.notEqual(a, b);
      assert.equal(await verifyPassword('a-good-password', a), true);
      assert.equal(await verifyPassword('wrong', a), false);
      const [[user]] = await db.execute('SELECT password_hash FROM users WHERE id=2');
      assert.ok(user.password_hash.startsWith('scrypt:'));
      assert.notEqual(user.password_hash, process.env.SEED_PASSWORD);
    });
    await t.test('registration validates input and fixes participant role', async () => {
      await request('auth/register', {
        method: 'POST',
        body: { name: 'X', email: 'bad', password: 'short' },
        status: 400,
      });
      const result = await request('auth/register', {
        method: 'POST',
        body: {
          name: 'Test Participant',
          email: 'NEW@TEST.LOCAL',
          password: 'test-password-123',
          role: 'admin',
        },
      });
      assert.match(result.response.headers.get('set-cookie'), /HttpOnly/i);
      assert.match(result.response.headers.get('set-cookie'), /SameSite=lax/i);
      assert.match(result.response.headers.get('set-cookie'), /Secure/i);
      const me = (await request('me', { cookie: result.cookie })).data.user;
      assert.equal(me.role, 'participant');
      assert.equal(me.email, 'new@test.local');
      const token = result.cookie.split('=')[1];
      const [[session]] = await db.execute('SELECT token_hash FROM sessions WHERE user_id=?', [
        me.id,
      ]);
      assert.notEqual(session.token_hash, token);
      assert.equal(session.token_hash.length, 64);
      await request('auth/register', {
        method: 'POST',
        body: { name: 'Duplicate', email: 'new@test.local', password: 'test-password-123' },
        status: 409,
      });
      await request('auth/logout', { method: 'POST', body: {}, cookie: result.cookie });
      assert.equal((await request('me', { cookie: result.cookie })).data.user, null);
    });
    await t.test('login, session expiry and role authorization', async () => {
      await request('auth/login', {
        method: 'POST',
        body: { email: 'arjun@hackmatch.local', password: 'wrong-password' },
        status: 401,
      });
      captainCookie = await login('arjun@hackmatch.local');
      adminCookie = await login('admin@hackmatch.local');
      applicantCookie = await login('ananya@hackmatch.local');
      otherCookie = await login('riya@hackmatch.local');
      await request('admin', { cookie: applicantCookie, status: 403 });
      await request('teams', {
        method: 'POST',
        body: { name: 'Admin Team', idea: 'A meaningful project idea', track_id: 1 },
        cookie: adminCookie,
        status: 403,
      });
      const temp = await login('dev@hackmatch.local');
      await db.execute(
        'UPDATE sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 DAY) WHERE user_id=7'
      );
      assert.equal((await request('me', { cookie: temp })).data.user, null);
    });
    await t.test('failed logins trigger temporary account lock', async () => {
      for (let i = 0; i < 5; i++)
        await request('auth/login', {
          method: 'POST',
          body: { email: 'dev@hackmatch.local', password: 'wrong-password' },
          status: 401,
        });
      await request('auth/login', {
        method: 'POST',
        body: { email: 'dev@hackmatch.local', password: process.env.SEED_PASSWORD },
        status: 401,
      });
      await db.execute('UPDATE users SET failed_logins=0,locked_until=NULL WHERE id=7');
    });
    await t.test('profile upsert and normalized skill aggregation', async () => {
      const profile = {
        bio: 'I build Python services with MongoDB and enjoy practical hackathon work.',
        preferred_role: 'Backend developer',
        availability: 'Evenings',
        skills: ['Python', 'MongoDB', 'Python'],
        interests: ['Security'],
        projects: [
          {
            title: 'Classifier',
            description: 'A project that classifies messages.',
            url: 'https://example.com/project',
          },
        ],
        discoverable: true,
      };
      await request('profiles', { method: 'POST', body: profile, cookie: applicantCookie });
      const saved = (await request('profiles', { cookie: applicantCookie })).data.profile;
      assert.deepEqual(saved.skills, ['python', 'mongodb']);
      await request('profiles', {
        method: 'POST',
        body: {
          ...profile,
          projects: [
            { title: 'Bad', description: 'Invalid link test', url: 'javascript:alert(1)' },
          ],
        },
        cookie: applicantCookie,
        status: 400,
      });
      const match = (await request('matches?skills=python,mongodb', { cookie: captainCookie })).data
        .results;
      assert.equal(match[0].matched_count, 2);
      assert.ok(match.some((p) => p.user_id === '3'));
      assert.ok(!match.some((p) => ['2', '6'].includes(p.user_id)));
    });
    await t.test('MongoDB validators and unique references reject invalid writes', async () => {
      await assert.rejects(
        mongo.collection('participant_profiles').insertOne({ user_id: '999', skills: 'invalid' }),
        (error) => error.code === 121
      );
      const profile = await mongo.collection('participant_profiles').findOne({ user_id: '3' });
      delete profile._id;
      await assert.rejects(
        mongo.collection('participant_profiles').insertOne(profile),
        (error) => error.code === 11000
      );
      await assert.rejects(
        mongo.collection('team_openings').insertOne({
          team_id: '999',
          title: 'Role',
          description: 'Valid description',
          required_skills: [],
          preferred_availability: 'Evenings',
        }),
        (error) => error.code === 121
      );
    });
    await t.test('captain-only recruitment editing and team existence', async () => {
      const brief = {
        team_id: 1,
        title: 'Backend developer',
        description: 'Build the API and data processing pipeline.',
        required_skills: ['Python', 'MongoDB'],
        preferred_availability: 'Evenings',
      };
      await request('openings', {
        method: 'POST',
        body: brief,
        cookie: applicantCookie,
        status: 403,
      });
      await request('openings', { method: 'POST', body: brief, cookie: captainCookie });
      assert.equal(
        (await request('matches?team_id=1', { cookie: captainCookie })).data.required_skills.length,
        2
      );
      await request('matches?team_id=9999', { cookie: captainCookie, status: 404 });
    });
    await t.test('closed registration blocks new teams and applications', async () => {
      await request('admin', {
        method: 'POST',
        body: { action: 'toggle', id: 2 },
        cookie: adminCookie,
      });
      await request('applications', {
        method: 'POST',
        body: { team_id: 1, message: 'I can build the backend' },
        cookie: applicantCookie,
        status: 400,
      });
      await request('teams', {
        method: 'POST',
        body: { track_id: 2, name: 'Closed Track Team', idea: 'An idea with enough detail' },
        cookie: otherCookie,
        status: 400,
      });
      await request('admin', {
        method: 'POST',
        body: { action: 'toggle', id: 2 },
        cookie: adminCookie,
      });
    });
    await t.test(
      'submit applications, reject duplicates and enforce captain permission',
      async () => {
        await request('applications', {
          method: 'POST',
          body: { team_id: 1, message: 'I can build the backend' },
          cookie: applicantCookie,
        });
        await request('applications', {
          method: 'POST',
          body: { team_id: 2, message: 'I can also help here' },
          cookie: applicantCookie,
        });
        await request('applications', {
          method: 'POST',
          body: { team_id: 1, message: 'A duplicate application' },
          cookie: applicantCookie,
          status: 409,
        });
        await request('applications', {
          method: 'PATCH',
          body: { id: 1, action: 'accept' },
          cookie: otherCookie,
          status: 403,
        });
        await request('applications', {
          method: 'PATCH',
          body: { id: 1, action: 'withdraw' },
          cookie: otherCookie,
          status: 403,
        });
      }
    );
    await t.test('acceptance is atomic and closes competing applications', async () => {
      await request('applications', {
        method: 'PATCH',
        body: { id: 1, action: 'accept' },
        cookie: captainCookie,
      });
      const [applications] = await db.execute(
        'SELECT status FROM applications WHERE user_id=3 ORDER BY id'
      );
      assert.deepEqual(
        applications.map((a) => a.status),
        ['accepted', 'closed']
      );
      const [[team]] = await db.execute('SELECT member_count FROM teams WHERE id=1');
      assert.equal(team.member_count, 2);
      await request('applications', {
        method: 'PATCH',
        body: { id: 1, action: 'reject' },
        cookie: captainCookie,
        status: 409,
      });
      await request('applications', {
        method: 'POST',
        body: { team_id: 2, message: 'Already a member test' },
        cookie: applicantCookie,
        status: 400,
      });
      assert.ok(
        !(await request('matches?skills=python', { cookie: captainCookie })).data.results.some(
          (p) => p.user_id === '3'
        )
      );
    });
    await t.test('one-team and unique-captain SQL constraints', async () => {
      await assert.rejects(
        db.execute('INSERT INTO memberships (user_id,team_id) VALUES (3,2)'),
        (error) => error.code === 'ER_DUP_ENTRY'
      );
      const [[counter]] = await db.execute('SELECT member_count FROM teams WHERE id=2');
      assert.equal(counter.member_count, 1);
      await assert.rejects(
        db.execute('UPDATE memberships SET is_captain=TRUE WHERE user_id=3'),
        (error) => error.code === 'ER_DUP_ENTRY'
      );
      await assert.rejects(
        db.execute('UPDATE memberships SET team_id=2 WHERE user_id=3'),
        (error) => error.code === 'ER_SIGNAL_EXCEPTION'
      );
    });
    await t.test('captain transfer, leaving, and counter maintenance', async () => {
      await request('membership', {
        method: 'POST',
        body: { action: 'leave' },
        cookie: captainCookie,
        status: 400,
      });
      await request('membership', {
        method: 'POST',
        body: { action: 'transfer', user_id: 3 },
        cookie: otherCookie,
        status: 400,
      });
      await request('membership', {
        method: 'POST',
        body: { action: 'transfer', user_id: 3 },
        cookie: captainCookie,
      });
      await request('membership', {
        method: 'POST',
        body: { action: 'leave' },
        cookie: captainCookie,
      });
      const [[team]] = await db.execute('SELECT member_count FROM teams WHERE id=1');
      assert.equal(team.member_count, 1);
      const [[captain]] = await db.execute(
        'SELECT user_id FROM memberships WHERE team_id=1 AND is_captain=TRUE'
      );
      assert.equal(captain.user_id, 3);
    });
    await t.test(
      'team creation is atomic and rejects duplicate membership without orphan teams',
      async () => {
        const created = await request('teams', {
          method: 'POST',
          body: { track_id: 1, name: 'New Test Team', idea: 'Build a useful campus platform' },
          cookie: otherCookie,
        });
        assert.ok(created.data.team_id);
        const [[before]] = await db.execute('SELECT COUNT(*) n FROM teams');
        await request('teams', {
          method: 'POST',
          body: { track_id: 1, name: 'No Orphan Team', idea: 'This should not create a team' },
          cookie: otherCookie,
          status: 400,
        });
        const [[after]] = await db.execute('SELECT COUNT(*) n FROM teams');
        assert.equal(before.n, after.n);
      }
    );
    await t.test('concurrent application acceptance: exactly one wins the final slot', async () => {
      const [track] = await db.execute(
        "INSERT INTO tracks (name,description,max_members) VALUES ('Concurrency','Last-slot concurrency test',2)"
      );
      const [team] = await db.execute(
        "INSERT INTO teams (name,idea,track_id) VALUES ('Concurrency Team','A concurrency test project',?)",
        [track.insertId]
      );
      await db.execute('INSERT INTO memberships (user_id,team_id,is_captain) VALUES (2,?,TRUE)', [
        team.insertId,
      ]);
      const [a] = await db.execute(
        'INSERT INTO applications (user_id,team_id,message) VALUES (5,?,?)',
        [team.insertId, 'First concurrent applicant']
      );
      const [b] = await db.execute(
        'INSERT INTO applications (user_id,team_id,message) VALUES (7,?,?)',
        [team.insertId, 'Second concurrent applicant']
      );
      const outcomes = await Promise.all(
        [a.insertId, b.insertId].map(async (id) => {
          const response = await fetch(base + '/api/applications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Origin: base, Cookie: captainCookie },
            body: JSON.stringify({ id, action: 'accept' }),
          });
          return { status: response.status, data: await response.json() };
        })
      );
      assert.equal(outcomes.filter((o) => o.status === 200).length, 1, JSON.stringify(outcomes));
      assert.equal(outcomes.filter((o) => o.status === 409).length, 1, JSON.stringify(outcomes));
      const [[teamRow]] = await db.execute('SELECT member_count FROM teams WHERE id=?', [
        team.insertId,
      ]);
      assert.equal(teamRow.member_count, 2);
      const [apps] = await db.execute(
        'SELECT status FROM applications WHERE team_id=? ORDER BY status',
        [team.insertId]
      );
      assert.deepEqual(apps.map((a) => a.status).sort(), ['accepted', 'pending']);
    });
    await t.test('SQL validation, views, stored procedure and demo queries', async () => {
      await assert.rejects(
        db.execute(
          "INSERT INTO tracks (name,description,max_members) VALUES ('Invalid','A valid description',1)"
        ),
        (error) => error.code === 'ER_CHECK_CONSTRAINT_VIOLATED'
      );
      await assert.rejects(
        db.execute('UPDATE tracks SET max_members=2 WHERE id=1'),
        (error) => error.code === 'ER_SIGNAL_EXCEPTION'
      );
      await assert.rejects(
        db.execute(
          "INSERT INTO users (name,email,password_hash) VALUES ('Uppercase','UPPER@TEST.LOCAL','hash')"
        ),
        (error) => error.code === 'ER_CHECK_CONSTRAINT_VIOLATED'
      );
      const [stats] = await db.query('CALL get_track_summary()');
      assert.ok(stats[0].length >= 4);
      const [inconsistent] = await db.query(
        'SELECT t.id,t.member_count FROM teams t LEFT JOIN memberships m ON m.team_id=t.id GROUP BY t.id,t.member_count HAVING t.member_count<>COUNT(m.user_id)'
      );
      assert.equal(inconsistent.length, 0);
      const source = await readFile(new URL('../sql/demo-queries.sql', import.meta.url), 'utf8');
      for (const statement of source.split(';')) if (statement.trim()) await db.query(statement);
    });
    await t.test('deletion permissions, membership cleanup and application cascade', async () => {
      await request('teams', {
        method: 'DELETE',
        body: { team_id: 1 },
        cookie: otherCookie,
        status: 403,
      });
      await request('teams', { method: 'DELETE', body: { team_id: 1 }, cookie: applicantCookie });
      const [[members]] = await db.execute('SELECT COUNT(*) n FROM memberships WHERE team_id=1');
      assert.equal(members.n, 0);
      const [[applications]] = await db.execute(
        'SELECT COUNT(*) n FROM applications WHERE team_id=1'
      );
      assert.equal(applications.n, 0);
      assert.equal(await mongo.collection('team_openings').countDocuments({ team_id: '1' }), 0);
    });
    await t.test('withdrawal and rejection are terminal decisions', async () => {
      const meera = await login('meera@hackmatch.local');
      for (const action of ['withdraw', 'reject']) {
        const email = `${action}@test.local`;
        const registered = await request('auth/register', {
          method: 'POST',
          body: { name: 'Terminal Test', email, password: 'terminal-password-123' },
        });
        await request('applications', {
          method: 'POST',
          body: { team_id: 2, message: 'I can contribute to this project' },
          cookie: registered.cookie,
        });
        const [[app]] = await db.execute(
          'SELECT a.id FROM applications a JOIN users u ON u.id=a.user_id WHERE u.email=?',
          [email]
        );
        const actor = action === 'withdraw' ? registered.cookie : meera;
        await request('applications', {
          method: 'PATCH',
          body: { id: app.id, action },
          cookie: actor,
        });
        await request('applications', {
          method: 'PATCH',
          body: { id: app.id, action },
          cookie: actor,
          status: 409,
        });
        await request('applications', {
          method: 'POST',
          body: { team_id: 2, message: 'Attempt to resubmit here' },
          cookie: registered.cookie,
          status: 409,
        });
      }
    });
    await t.test(
      'captain invitations require recipient consent and preserve membership rules',
      async () => {
        const created = [];
        async function person(key) {
          const registered = await request('auth/register', {
            method: 'POST',
            body: {
              name: `Invite ${key}`,
              email: `invite-${key}@example.test`,
              password: process.env.SEED_PASSWORD,
            },
          });
          const current = (await request('me', { cookie: registered.cookie })).data.user;
          await request('profiles', {
            method: 'POST',
            cookie: registered.cookie,
            body: {
              bio: 'I build backend services and want to join a hackathon team.',
              preferred_role: 'Developer',
              availability: 'Evenings',
              skills: ['mysql'],
              interests: [],
              projects: [],
              discoverable: true,
            },
          });
          const result = { id: current.id, cookie: registered.cookie };
          created.push(result);
          return result;
        }
        const captain = await person('captain'),
          secondCaptain = await person('second-captain');
        const recipient = await person('recipient'),
          other = await person('other'),
          decline = await person('decline');
        const [track] = await db.execute(
          'INSERT INTO tracks (name,description,max_members) VALUES (?,?,2)',
          ['Invitation track', 'Exercise invitation acceptance and capacity.']
        );
        const makeTeam = async (owner, name) =>
          (
            await request('teams', {
              method: 'POST',
              cookie: owner.cookie,
              body: {
                name,
                idea: 'Build a useful invitation verification project.',
                track_id: track.insertId,
              },
            })
          ).data.team_id;
        const teamId = await makeTeam(captain, 'Invitation team'),
          secondTeam = await makeTeam(secondCaptain, 'Second invitation team');
        const invite = async (owner, target, targetTeam = teamId, status = 200) =>
          request('applications', {
            method: 'POST',
            cookie: owner.cookie,
            status,
            body: {
              kind: 'invitation',
              user_id: target.id,
              team_id: targetTeam,
              message: 'Please join our hackathon project.',
            },
          });
        await invite(other, recipient, teamId, 403);
        await invite(captain, secondCaptain, teamId, 409);
        await mongo
          .collection('participant_profiles')
          .updateOne({ user_id: String(other.id) }, { $set: { discoverable: false } });
        await invite(captain, other, teamId, 409);
        await mongo
          .collection('participant_profiles')
          .updateOne({ user_id: String(other.id) }, { $set: { discoverable: true } });
        await invite(captain, recipient);
        await invite(captain, recipient, teamId, 409);
        await invite(secondCaptain, recipient, secondTeam);
        await invite(captain, other);
        await invite(captain, decline);
        const own = (await request('teams', { cookie: recipient.cookie })).data.applications;
        const invitation = own.find((a) => a.team_id === teamId);
        assert.equal(invitation.kind, 'invitation');
        assert.equal(
          (await request('profiles', { cookie: recipient.cookie })).data.membership,
          null
        );
        await request('applications', {
          method: 'PATCH',
          cookie: captain.cookie,
          body: { id: invitation.id, action: 'accept' },
          status: 403,
        });
        await request('applications', {
          method: 'PATCH',
          cookie: other.cookie,
          body: { id: invitation.id, action: 'accept' },
          status: 403,
        });
        await request('applications', {
          method: 'PATCH',
          cookie: recipient.cookie,
          body: { id: invitation.id, action: 'withdraw' },
          status: 403,
        });
        const declineInvitation = (await request('teams', { cookie: decline.cookie })).data
          .applications[0];
        await request('applications', {
          method: 'PATCH',
          cookie: decline.cookie,
          body: { id: declineInvitation.id, action: 'reject' },
        });
        await db.execute('UPDATE tracks SET registration_open=FALSE WHERE id=?', [track.insertId]);
        await request('applications', {
          method: 'PATCH',
          cookie: recipient.cookie,
          body: { id: invitation.id, action: 'accept' },
          status: 400,
        });
        await db.execute('UPDATE tracks SET registration_open=TRUE WHERE id=?', [track.insertId]);
        await request('applications', {
          method: 'PATCH',
          cookie: recipient.cookie,
          body: { id: invitation.id, action: 'accept' },
        });
        assert.equal(
          (await request('profiles', { cookie: recipient.cookie })).data.membership.team_id,
          teamId
        );
        const [[competing]] = await db.execute(
          'SELECT status FROM applications WHERE user_id=? AND team_id=?',
          [recipient.id, secondTeam]
        );
        assert.equal(competing.status, 'closed');
        await request('applications', {
          method: 'PATCH',
          cookie: recipient.cookie,
          body: { id: invitation.id, action: 'accept' },
          status: 409,
        });
        const otherInvitation = (await request('teams', { cookie: other.cookie })).data
          .applications[0];
        await request('applications', {
          method: 'PATCH',
          cookie: other.cookie,
          body: { id: otherInvitation.id, action: 'accept' },
          status: 409,
        });
        assert.equal((await request('profiles', { cookie: other.cookie })).data.membership, null);
        await request('applications', {
          method: 'PATCH',
          cookie: captain.cookie,
          body: { id: otherInvitation.id, action: 'withdraw' },
        });
        const [[count]] = await db.execute('SELECT member_count FROM teams WHERE id=?', [teamId]);
        assert.equal(count.member_count, 2);
      }
    );
  } finally {
    if (server) {
      server.kill('SIGTERM');
      await Promise.race([
        once(server, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
    if (mongo) await mongo.dropDatabase();
    if (globalThis.mongoConnection) {
      const client = await globalThis.mongoConnection;
      await client.close();
      globalThis.mongoConnection = null;
    }
    if (db) await db.end();
    globalThis.mysqlPool = null;
    await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
    process.env.MYSQL_URL = originalUrl;
    process.env.MONGODB_DATABASE = originalMongo;
  }
});
