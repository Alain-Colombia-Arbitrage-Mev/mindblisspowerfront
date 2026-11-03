import { handleRegistration } from '@/lib/registration-auth.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleRegistration(request);
