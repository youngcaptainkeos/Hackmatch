import { deleteSession } from '@/lib/auth';
import { endpoint } from '@/lib/http';
export const POST = endpoint(async () => {
  await deleteSession();
  return { ok: true };
});
