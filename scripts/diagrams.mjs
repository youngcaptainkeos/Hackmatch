import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../docs/diagrams/', import.meta.url);
await mkdir(directory, { recursive: true });
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function start(title, subtitle, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="#5d7043" stroke-width="1.4"/></marker></defs><rect width="100%" height="100%" fill="#f7f8f2"/><style>text{font-family:Arial,sans-serif;fill:#20291a}.title{font-size:30px;font-weight:700}.sub{font-size:13px;fill:#69785c}.entity{font-size:16px;font-weight:700}.field{font-family:monospace;font-size:13px}.note{font-size:12px;fill:#627151}.label{font-size:11px;fill:#516c31}</style><text x="45" y="52" class="title">${esc(title)}</text><text x="45" y="79" class="sub">${esc(subtitle)}</text>`;
}
function box(x, y, w, title, lines) {
  const h = 54 + lines.length * 25;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#fff" stroke="#bdcbb0"/><path d="M${x + 7} ${y}H${x + w - 7}Q${x + w} ${y} ${x + w} ${y + 7}V${y + 40}H${x}V${y + 7}Q${x} ${y} ${x + 7} ${y}" fill="#e5f1c5"/><text x="${x + 16}" y="${y + 26}" class="entity">${esc(title)}</text>${lines.map((line, i) => `<text x="${x + 16}" y="${y + 65 + i * 25}" class="field">${esc(line)}</text>`).join('')}`;
}
function path(d, label, x, y, dashed = false) {
  return `<path d="${d}" fill="none" stroke="#6f8657" stroke-width="1.6" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#arrow)"/>${label ? `<rect x="${x - 5}" y="${y - 12}" width="${label.length * 6.1 + 10}" height="17" fill="#f7f8f2"/><text x="${x}" y="${y}" class="label">${esc(label)}</text>` : ''}`;
}
let schema = start(
  'HackMatch / Relational schema',
  'MySQL • PK = primary key • FK = foreign key • UK = unique key • IDs are INT UNSIGNED',
  1450,
  900
);
schema +=
  path('M355 205H475V205H555', '1 → many', 405, 190) +
  path('M355 300H465V560H555', '1 → 0..1', 405, 465) +
  path('M1165 270V365H1060V440', '1 → many', 1105, 355) +
  path('M1000 550H900V570H855', '1 → many', 915, 535) +
  path('M355 350H425V825H1110V800', '1 → many', 450, 810) +
  path('M1165 650V680', '1 → many', 1180, 670);
schema += box(45, 130, 310, 'USERS', [
  'PK id',
  'name VARCHAR(80)',
  'UK email VARCHAR(254)',
  'password_hash VARCHAR(200)',
  'role ENUM',
  'failed_logins INT',
  'locked_until DATETIME NULL',
  'created_at TIMESTAMP',
]);
schema += box(555, 130, 300, 'SESSIONS', [
  'PK token_hash CHAR(64)',
  'FK user_id → users',
  'expires_at DATETIME',
]);
schema += box(1000, 130, 380, 'TRACKS', [
  'PK id',
  'UK name VARCHAR(80)',
  'description VARCHAR(2000)',
  'max_members INT (2..8)',
  'registration_open BOOLEAN',
]);
schema += box(555, 480, 300, 'MEMBERSHIPS', [
  'PK/FK user_id → users',
  'FK team_id → teams',
  'is_captain BOOLEAN',
  'joined_at TIMESTAMP',
  'UK captain_team_id (generated)',
]);
schema += box(1000, 440, 380, 'TEAMS', [
  'PK id',
  'FK track_id → tracks',
  'UK name VARCHAR(80)',
  'idea VARCHAR(2000)',
  'member_count INT (trigger)',
  'created_at TIMESTAMP',
]);
schema += box(1000, 680, 380, 'APPLICATIONS', [
  'PK id; FK user_id, team_id',
  'message VARCHAR(1000)',
  'kind: application / invitation',
  'status ENUM; created_at',
  'UK (user_id, team_id)',
]);
schema +=
  '<text x="45" y="860" class="note">One current team per participant. At most one captain per team. Team/application actions use transactions.</text></svg>';
await writeFile(new URL('schema.svg', directory), schema);
let er = start(
  'HackMatch / Entity relationship diagram',
  'Solid lines: SQL relationships. Dashed lines: application-managed references across MySQL and MongoDB.',
  1300,
  830
);
er +=
  path('M320 220H500', '1 → 0..many', 365, 205) +
  path('M320 250H400V460H500', '1 → 0..1', 410, 395) +
  path('M50 250H20V730H500', '1 → 0..many', 350, 715) +
  path('M1100 274V400', '1 → 0..many', 1115, 350) +
  path('M1000 470H800', '1 → 0..many', 840, 455) +
  path('M1250 470H1275V730H800', '1 → 0..many', 850, 715) +
  path('M180 274V440', '1 → 0..1', 195, 405, true) +
  path('M1140 504V590', '1 → 0..1', 1150, 575, true);
er +=
  box(50, 170, 270, 'USER', ['Account + role', 'Relational authority']) +
  box(500, 170, 300, 'SESSION', ['Hashed login token', 'Expiry']) +
  box(960, 170, 290, 'TRACK', ['Hackathon category', 'Capacity + registration']);
er +=
  box(500, 410, 300, 'MEMBERSHIP', ['Participant ↔ team', 'Captain permission']) +
  box(960, 400, 290, 'TEAM', ['Project idea', 'Current member count']) +
  box(500, 650, 300, 'APPLICATION', ['Application / invitation', 'Message + decision status']);
er +=
  box(50, 440, 290, 'PROFILE / MongoDB', ['Skills + preferences', 'Nested project experience']) +
  box(960, 590, 290, 'OPENING / MongoDB', ['One brief per team', 'Required skills + role']);
er +=
  '<text x="50" y="790" class="note">Captain existence is maintained by API transactions; SQL unique constraints enforce at most one captain.</text></svg>';
await writeFile(new URL('er.svg', directory), er);
let architecture = start(
  'HackMatch / System architecture',
  'Production target: Vercel Next.js + hosted MySQL + MongoDB Atlas. Local development needs no Docker.',
  1400,
  750
);
architecture +=
  path('M345 305H525', 'HTTPS / cookies', 365, 290) +
  path('M875 280H950V220H1040', 'SQL / TLS', 925, 205) +
  path('M875 330H970V500H1040', 'MongoDB / TLS', 915, 480);
architecture +=
  box(45, 220, 300, 'BROWSER', [
    'Public landing page',
    'Sign-in / sign-up',
    'Participant workspace',
    'Administrator dashboard',
  ]) +
  box(525, 220, 350, 'NEXT.JS / VERCEL', [
    'Separate API route files',
    'Input + permission checks',
    'Salted password hashing',
    'Visible parameterized SQL',
    'SQL transactions + aggregation',
  ]) +
  box(1040, 135, 315, 'MYSQL', [
    'Accounts + sessions',
    'Tracks + teams',
    'Memberships + applications',
    'Constraints / triggers',
    'Views / stored procedure',
  ]) +
  box(1040, 450, 315, 'MONGODB ATLAS', [
    'Participant profiles',
    'Recruitment briefs',
    'JSON Schema validation',
    'Indexes + skill aggregation',
  ]);
architecture +=
  '<text x="45" y="680" class="note">Environment variables hold database configuration. Secrets stay on the server. Database credentials never enter the browser bundle.</text><text x="45" y="705" class="note">MySQL is authoritative for membership and capacity. There are no distributed transactions or cross-database foreign keys.</text></svg>';
await writeFile(new URL('architecture.svg', directory), architecture);
let mongo = start(
  'HackMatch / MongoDB document model',
  'Related flexible information is embedded in each document. SQL identifiers are stored as decimal strings.',
  1400,
  720
);
mongo += box(45, 140, 590, 'PARTICIPANT_PROFILES', [
  'user_id: string (unique SQL reference)',
  'bio: string; preferred_role: string',
  'availability: enum; discoverable: boolean',
  'skills: string[] (normalized, max 15)',
  'interests: string[] (max 8)',
  'projects: [{title, description, url}] (max 5)',
  'updated_at: date',
  'INDEX: user_id UNIQUE',
  'INDEX: discoverable + skills (multikey)',
]);
mongo += box(740, 140, 610, 'TEAM_OPENINGS', [
  'team_id: string (unique SQL reference)',
  'title: string; description: string',
  'required_skills: string[] (1..15)',
  'preferred_availability: enum',
  'updated_at: date',
  'INDEX: team_id UNIQUE',
  'One editable recruitment brief per team',
]);
mongo +=
  '<text x="45" y="530" class="entity">Retrieval pipeline</text><text x="45" y="565" class="field">SQL eligibility → $match → $setIntersection → $size → $sort → $limit → attach SQL names</text><text x="45" y="610" class="note">Both collections enforce JSON Schema validators. Cross-database parent references are checked by the application.</text><text x="45" y="640" class="note">A candidate’s team membership is read from MySQL; discoverable is only their personal discovery preference.</text></svg>';
await writeFile(new URL('mongodb-model.svg', directory), mongo);
const files = ['er', 'schema', 'architecture', 'mongodb-model'];
await writeFile(
  new URL('index.html', directory),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HackMatch diagrams</title><style>body{font-family:Arial;background:#f5f6ef;margin:40px;color:#26321b}nav{display:flex;gap:20px}section{margin:50px 0}img{width:100%;border:1px solid #ccd4c0;background:white}a{color:#526a2d}@media print{section{break-after:page}nav{display:none}}</style><h1>HackMatch database diagrams</h1><nav>${files.map((f) => `<a href="#${f}">${f}</a>`).join('')}</nav>${files.map((f) => `<section id="${f}"><h2>${f}</h2><a href="${f}.svg">Open SVG</a><img src="${f}.svg" alt="HackMatch ${f} diagram"></section>`).join('')}</html>`
);
console.log(
  'Generated four standalone SVG diagrams, a print-friendly viewer, and retained Mermaid sources.'
);
