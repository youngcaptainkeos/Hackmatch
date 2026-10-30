import { getUser } from '@/lib/auth';
import { endpoint } from '@/lib/http';
export const GET = endpoint(async () => ({ user: await getUser() }));
