import { account, text } from '@/lib/validation';
import { getMySQL } from '@/lib/mysql';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { endpoint } from '@/lib/http';
export const runtime = 'nodejs';
export const POST = endpoint(async (request) => {
  const input = account.extend({ name: text(2, 80) }).parse(await request.json());
  const passwordHash = await hashPassword(input.password);
  // Accounts live entirely in MySQL. Mongo profiles are created on first save.
  const [result] = await getMySQL().execute(
    'INSERT INTO users (name,email,password_hash) VALUES (?,?,?)',
    [input.name, input.email, passwordHash]
  );
  await createSession(result.insertId);
  return { ok: true };
});
