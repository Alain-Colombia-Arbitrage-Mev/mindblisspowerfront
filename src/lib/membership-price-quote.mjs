// Display-only quote for the catalog. The payment service remains the source
// of truth and independently derives the charge from the selected package ID.
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

function formatUSD(units, scale = 2) {
  const value = units.toString().padStart(scale + 1, '0');
  const whole = value.slice(0, -scale).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let fraction = value.slice(-scale);
  while (fraction.length > 2 && fraction.endsWith('0')) fraction = fraction.slice(0, -1);
  return `$${whole}.${fraction} USD`;
}

/** @param {unknown} amount */
export function membershipPriceQuote(amount) {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? String(amount) : amount;
  if (typeof value !== 'string' || value.length > 17 || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const baseCents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (baseCents <= 0n || baseCents > MAX_CENTS) return null;
  // One percent of B cents is B ten-thousandths of a dollar. Preserve those
  // four decimals for the included cost and the exact 99% commission base;
  // only the buyer's charge remains the unchanged two-decimal catalog price.
  return {
    baseUSD: formatUSD(baseCents),
    feeUSD: formatUSD(baseCents, 4),
    commissionBaseUSD: formatUSD(baseCents * 99n, 4),
    totalUSD: formatUSD(baseCents),
  };
}
