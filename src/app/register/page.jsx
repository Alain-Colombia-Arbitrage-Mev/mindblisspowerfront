import { betterAuthEnabled } from '@/lib/better-auth-bridge.mjs';
import RegisterForm from './RegisterForm';
import BetterAuthRegisterForm from './BetterAuthRegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }) {
  if (!betterAuthEnabled()) return <RegisterForm />;
  const supplied = await searchParams;
  const params = new URLSearchParams();
  // Keep attribution as a hint only. Registration never creates a placement.
  for (const key of ['email', 'ref', 'resume', 'reason']) {
    if (typeof supplied?.[key] === 'string') params.set(key, supplied[key].slice(0, 254));
  }
  // A changed registration context must not reuse another recipient's code,
  // form credentials or referral hint during an in-app navigation.
  const initialSearch = params.toString();
  return <BetterAuthRegisterForm key={initialSearch} initialSearch={initialSearch} />;
}
