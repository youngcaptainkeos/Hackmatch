import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import SqlDemo from '@/components/sql-demo';
export const metadata = { title: 'Admin SQL console' };
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/admin/sign-in');
  if (user.role !== 'admin') redirect('/dashboard');
  return <SqlDemo user={user} />;
}
