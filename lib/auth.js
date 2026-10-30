import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { getMySQL } from './mysql';
import { problem } from './http';
const sessionName = 'hackmatch_session';
export const digest = (value) => createHash('sha256').update(value).digest('hex');
export async function getUser() {
  const token = (await cookies()).get(sessionName)?.value;
  if (!token) return null;
  const [users] = await getMySQL().execute(
    `SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()`,
    [digest(token)]
  );
  return users[0] || null;
}
export async function requireUser(role) {
  const user = await getUser();
  if (!user) problem('Please sign in to continue.', 401);
  if (role && user.role !== role) problem('You do not have permission for this action.', 403);
  return user;
}
export async function createSession(userId) {
  const jar = await cookies();
  const previous = jar.get(sessionName)?.value;
  if (previous)
    await getMySQL().execute('DELETE FROM sessions WHERE token_hash=?', [digest(previous)]);
  const token = randomBytes(32).toString('hex');
  await getMySQL().execute(
    'INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY))',
    [digest(token), userId]
  );
  jar.set(sessionName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });
}
export async function deleteSession() {
  const jar = await cookies();
  const token = jar.get(sessionName)?.value;
  if (token) await getMySQL().execute('DELETE FROM sessions WHERE token_hash=?', [digest(token)]);
  jar.delete(sessionName);
}
