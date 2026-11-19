import { handleWalletProductionFunding } from '@/lib/wallet-production-funding-bff.mjs';
export const runtime = 'nodejs';
export async function GET(request, context) {
  const { action } = await context.params;
  return handleWalletProductionFunding(request, action.join('/'));
}
export async function POST(request, context) {
  const { action } = await context.params;
  return handleWalletProductionFunding(request, action.join('/'));
}
