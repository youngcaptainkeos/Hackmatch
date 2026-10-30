import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import AuthForm from '@/components/auth-form';
export const metadata = { title: 'Create an account' };
export default async function SignUp() {
  if (await getUser()) redirect('/dashboard');
  return <AuthForm register />;
}
