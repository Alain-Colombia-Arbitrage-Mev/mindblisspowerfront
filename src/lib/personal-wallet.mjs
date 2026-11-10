export const PERSONAL_WALLET_ASSET = "USDC";
export const MINDBLISS_ONRAMP_FEE_BPS = 100;
export const MINDBLISS_ONRAMP_FEE_PERCENT = MINDBLISS_ONRAMP_FEE_BPS / 100;

export function calculateMindblissOnrampFee(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round((amount * MINDBLISS_ONRAMP_FEE_BPS) / 100) / 100;
}
