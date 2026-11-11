import { handlePolygonRelay } from '@/lib/polygon-relay-bff.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = request => handlePolygonRelay(request, 'prepare');
