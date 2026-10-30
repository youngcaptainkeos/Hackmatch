import { fileURLToPath } from 'node:url';
import { getMySQL } from '../lib/mysql.js';
import { getMongoDB } from '../lib/mongodb.js';
import { hashPassword } from '../lib/password.js';
export async function seed() {
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 10)
    throw new Error('Set SEED_PASSWORD (at least 10 characters).');
  const db = getMySQL();
  const [[count]] = await db.execute('SELECT COUNT(*) AS n FROM users');
  if (count.n) throw new Error('Seed requires empty tables.');
  const mongo = await getMongoDB();
  const people = [
    ['Admin', 'admin', 'admin', 'Event organiser', ['event management'], 'Flexible'],
    [
      'Arjun Mehta',
      'arjun',
      'participant',
      'Backend developer',
      ['node.js', 'mysql', 'docker'],
      'Evenings',
    ],
    [
      'Ananya Rao',
      'ananya',
      'participant',
      'ML developer',
      ['python', 'mongodb', 'machine learning'],
      'Evenings',
    ],
    [
      'Riya Shah',
      'riya',
      'participant',
      'Frontend developer',
      ['react', 'css', 'javascript'],
      'Weekends',
    ],
    [
      'Kabir Singh',
      'kabir',
      'participant',
      'Security engineer',
      ['python', 'linux', 'networking'],
      'Evenings',
    ],
    [
      'Meera Nair',
      'meera',
      'participant',
      'Product designer',
      ['figma', 'ux', 'design'],
      'Flexible',
    ],
    [
      'Dev Patel',
      'dev',
      'participant',
      'Backend developer',
      ['python', 'mongodb', 'node.js'],
      'Weekends',
    ],
  ];
  const bios = {
    arjun: 'I build reliable APIs and enjoy turning ambitious ideas into working products.',
    ananya: 'I work with Python and machine learning to make complex information useful.',
    riya: 'I build accessible interfaces with React, thoughtful typography, and a little motion.',
    kabir: 'I explore security, networking and tools that help people stay safe online.',
    meera:
      'I turn research into useful interfaces and bring a design perspective to technical teams.',
    dev: 'I build Python services and enjoy working with climate data and forecasting.',
  };
  for (const [name, key, role, preferred_role, skills, availability] of people) {
    const [result] = await db.execute(
      'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
      [name, `${key}@hackmatch.local`, await hashPassword(process.env.SEED_PASSWORD), role]
    );
    if (role === 'participant')
      await mongo
        .collection('participant_profiles')
        .insertOne({
          user_id: String(result.insertId),
          bio: bios[key],
          preferred_role,
          availability,
          skills,
          interests: ['Open source'],
          projects: [],
          discoverable: true,
          updated_at: new Date(),
        });
  }
  for (const [name, description] of [
    ['AI & ML', 'Build useful intelligence for real-world problems.'],
    ['Cybersecurity', 'Help people stay safe in a connected world.'],
    ['Fintech', 'Make money management accessible to everyone.'],
    ['Sustainability', 'Technology for a healthier planet.'],
  ]) {
    await db.execute('INSERT INTO tracks (name,description,max_members) VALUES (?,?,4)', [
      name,
      description,
    ]);
  }
  for (const [name, idea, track, captain, title, skills] of [
    [
      'PhishGuard',
      'Detect phishing messages before they reach the people who trust them.',
      2,
      2,
      'ML / backend developer',
      ['python', 'mongodb'],
    ],
    [
      'GreenPulse',
      'Make climate data understandable through clear, accessible dashboards.',
      4,
      6,
      'Frontend developer',
      ['react', 'css'],
    ],
  ]) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        'INSERT INTO teams (name,idea,track_id) VALUES (?,?,?)',
        [name, idea, track]
      );
      await connection.execute(
        'INSERT INTO memberships (user_id,team_id,is_captain) VALUES (?,?,TRUE)',
        [captain, result.insertId]
      );
      await connection.commit();
      await mongo
        .collection('team_openings')
        .insertOne({
          team_id: String(result.insertId),
          title,
          description: `Help bring ${name} to life. We are looking for a teammate who enjoys building and learning together.`,
          required_skills: skills,
          preferred_availability: 'Evenings',
          updated_at: new Date(),
        });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await seed();
    console.log(
      'Seeded sample data. Accounts: admin, arjun, ananya, riya, kabir, meera, dev @hackmatch.local.'
    );
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.code || error.message);
    process.exit(1);
  }
}
