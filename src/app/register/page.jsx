import { redirect } from 'next/navigation';
import { betterAuthEnabled } from '@/lib/better-auth-bridge.mjs';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }) {
  if (!betterAuthEnabled()) return <RegisterForm />;
  const supplied = await searchParams;
  const params = new URLSearchParams();
  // Keep attribution as a hint only. Signing in never creates a placement.
  for (const key of ['email', 'ref', 'side']) {
    if (typeof supplied?.[key] === 'string') params.set(key, supplied[key].slice(0, 254));
  }
  const query = params.toString();
  redirect(query ? `/login?${query}` : '/login');
}
