import { betterAuthEnabled } from '@/lib/better-auth-bridge.mjs';
import RegisterForm from './RegisterForm';
import BetterAuthRegisterForm from './BetterAuthRegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }) {
  if (!betterAuthEnabled()) return <RegisterForm />;
  const supplied = await searchParams;
  const params = new URLSearchParams();
  // Keep attribution as a hint only. Registration never creates a placement.
  for (const key of ['email', 'ref', 'side', 'resume']) {
    if (typeof supplied?.[key] === 'string') params.set(key, supplied[key].slice(0, 254));
  }
  return <BetterAuthRegisterForm initialSearch={params.toString()} />;
}
