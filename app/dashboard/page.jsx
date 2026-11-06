import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Dashboard from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your workspace' };
export default async function Workspace() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (user.role === 'admin') redirect('/admin');
  return <Dashboard user={user} />;
}
