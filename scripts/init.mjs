import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { getMySQL } from '../lib/mysql.js';
import { getMongoDB } from '../lib/mongodb.js';
export async function initializeMySQL() {
  const mysql = getMySQL();
  const [tables] = await mysql.execute("SHOW TABLES LIKE 'users'");
  if (tables.length)
    throw new Error(
      'MySQL already initialized. Use a new database; this script never overwrites existing data.'
    );
  const source = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  let delimiter = ';',
    buffer = '';
  for (const line of source.split('\n')) {
    if (line.startsWith('DELIMITER ')) {
      delimiter = line.slice(10).trim();
      continue;
    }
    buffer += line + '\n';
    if (buffer.trimEnd().endsWith(delimiter)) {
      const statement = buffer.trimEnd().slice(0, -delimiter.length).trim();
      if (statement) await mysql.query(statement);
      buffer = '';
    }
  }
}
export async function initializeMongoDB() {
  const mongo = await getMongoDB();
  await mongo.createCollection('participant_profiles', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          'user_id',
          'bio',
          'preferred_role',
          'availability',
          'skills',
          'interests',
          'projects',
          'discoverable',
        ],
        properties: {
          user_id: { bsonType: 'string', pattern: '^[0-9]+$' },
          bio: { bsonType: 'string', minLength: 10, maxLength: 2000 },
          preferred_role: { bsonType: 'string', minLength: 2, maxLength: 80 },
          availability: { enum: ['Mornings', 'Evenings', 'Weekends', 'Flexible'] },
          skills: {
            bsonType: 'array',
            maxItems: 15,
            uniqueItems: true,
            items: { bsonType: 'string', minLength: 1, maxLength: 40 },
          },
          interests: {
            bsonType: 'array',
            maxItems: 8,
            items: { bsonType: 'string', minLength: 1, maxLength: 40 },
          },
          projects: {
            bsonType: 'array',
            maxItems: 5,
            items: {
              bsonType: 'object',
              required: ['title', 'description', 'url'],
              properties: {
                title: { bsonType: 'string', minLength: 2, maxLength: 80 },
                description: { bsonType: 'string', minLength: 5, maxLength: 500 },
                url: { bsonType: 'string', pattern: '^(https?://.*|)$' },
              },
            },
          },
          discoverable: { bsonType: 'bool' },
          updated_at: { bsonType: 'date' },
        },
      },
    },
    validationLevel: 'strict',
    validationAction: 'error',
  });
  await mongo.createCollection('team_openings', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['team_id', 'title', 'description', 'required_skills', 'preferred_availability'],
        properties: {
          team_id: { bsonType: 'string', pattern: '^[0-9]+$' },
          title: { bsonType: 'string', minLength: 2, maxLength: 80 },
          description: { bsonType: 'string', minLength: 5, maxLength: 2000 },
          required_skills: {
            bsonType: 'array',
            minItems: 1,
            maxItems: 15,
            uniqueItems: true,
            items: { bsonType: 'string', minLength: 1, maxLength: 40 },
          },
          preferred_availability: { enum: ['Mornings', 'Evenings', 'Weekends', 'Flexible'] },
          updated_at: { bsonType: 'date' },
        },
      },
    },
    validationLevel: 'strict',
    validationAction: 'error',
  });
  await mongo.collection('participant_profiles').createIndex({ user_id: 1 }, { unique: true });
  await mongo.collection('participant_profiles').createIndex({ discoverable: 1, skills: 1 });
  // Deliberate simplified scope: one editable recruitment brief per team.
  await mongo.collection('team_openings').createIndex({ team_id: 1 }, { unique: true });
}
export async function initialize() {
  await initializeMySQL();
  await initializeMongoDB();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (mode && !['--mysql-only', '--mongo-only'].includes(mode))
      throw new Error('Use --mysql-only, --mongo-only, or no flag for both databases.');
    if (mode === '--mysql-only') await initializeMySQL();
    else if (mode === '--mongo-only') await initializeMongoDB();
    else await initialize();
    console.log(mode === '--mysql-only' ? 'Created MySQL schema.' : mode === '--mongo-only'
      ? 'Created MongoDB collections, validators, and indexes.'
      : 'Created MySQL schema and MongoDB collections, validators, and indexes.');
    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error.code || error.message);
    process.exit(1);
  }
}
