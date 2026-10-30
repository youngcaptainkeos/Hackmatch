import { account } from '@/lib/validation';
import { getMySQL } from '@/lib/mysql';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { endpoint, problem } from '@/lib/http';
// A valid dummy scrypt hash keeps unknown-user verification comparable in cost.
const dummy = 'scrypt:00000000000000000000000000000000:' + '00'.repeat(64);
export const POST = endpoint(async (request) => {
  const input = account.parse(await request.json());
  const db = getMySQL();
  const [users] = await db.execute('SELECT * FROM users WHERE email=?', [input.email]);
  const user = users[0];
  const valid = await verifyPassword(input.password, user?.password_hash || dummy);
  if (user?.locked_until && new Date(user.locked_until) > new Date())
    problem('Incorrect credentials or sign-in temporarily unavailable.', 401);
  if (!user || !valid) {
    if (user)
      await db.execute(
        `UPDATE users SET locked_until=IF(failed_logins+1>=5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL),failed_logins=failed_logins+1 WHERE id=?`,
        [user.id]
      );
    problem('Incorrect email or password.', 401);
  }
  await db.execute('UPDATE users SET failed_logins=0,locked_until=NULL WHERE id=?', [user.id]);
  await createSession(user.id);
  return { ok: true };
});
