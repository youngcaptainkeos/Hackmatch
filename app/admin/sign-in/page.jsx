import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import AuthForm from '@/components/auth-form';
export const metadata = { title: 'Admin sign in' };
export default async function AdminSignIn() {
  const user = await getUser();
  if (user) redirect(user.role === 'admin' ? '/admin' : '/dashboard');
  return <AuthForm admin />;
}
