import { handleSandboxWallet } from '@/lib/sandbox-wallet-bff.mjs';
export const runtime = 'nodejs';
export async function GET(request, context) {
  const { action } = await context.params;
  return handleSandboxWallet(request, action.join('/'));
}
export async function POST(request, context) {
  const { action } = await context.params;
  return handleSandboxWallet(request, action.join('/'));
}
