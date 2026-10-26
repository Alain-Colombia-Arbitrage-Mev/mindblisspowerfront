import { handleRegistrationPhone } from '@/lib/registration-phone-auth.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handleRegistrationPhone(request, 'verify');
