export const PERSONAL_WALLET_ASSET = "USDT";
export const PERSONAL_WALLET_MELD_ASSET = "USDT_POLYGON";
export const PERSONAL_WALLET_NETWORK = "Polygon";
export const PERSONAL_WALLET_MINIMUM_USD = 30;
export const PERSONAL_WALLET_MAXIMUM_USD = 15_000;
export const MINDBLISS_ONRAMP_FEE_BPS = 100;
export const MINDBLISS_ONRAMP_FEE_PERCENT = MINDBLISS_ONRAMP_FEE_BPS / 100;

export function calculateMindblissOnrampFee(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round((amount * MINDBLISS_ONRAMP_FEE_BPS) / 100) / 100;
}
