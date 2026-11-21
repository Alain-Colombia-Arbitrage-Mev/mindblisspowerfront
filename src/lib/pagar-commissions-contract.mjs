export const PAGAR_COMMISSIONS_PATH = '/api/member/pagar-commissions';
export const PAGAR_COMMISSIONS_PAGE = '/dashboard/comisiones';
export const PAGAR_COMMISSIONS_PAGE_SIZE = 12;

const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const isAmount = value => Number.isSafeInteger(value) && value >= 0;

/** Monday of the closed period, serialized as a date without a timezone. */
export function pagarCommissionWeek(value) {
  if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.getUTCDay() === 1 && date.toISOString().slice(0, 10) === value;
}

export function pagarCommissionsSnapshot(value, before = null) {
  if (!isObject(value) || Object.keys(value).length !== 3
    || !isAmount(value.virtualBalanceUsdMinor) || !Array.isArray(value.periods)
    || value.periods.length > PAGAR_COMMISSIONS_PAGE_SIZE) return null;
  let previous = before;
  let visibleTotal = 0n;
  for (const period of value.periods) {
    if (!isObject(period) || Object.keys(period).length !== 3 || !pagarCommissionWeek(period.weekEnd)
      || (previous !== null && period.weekEnd >= previous) || !isAmount(period.binaryUsdMinor)
      || !isAmount(period.rankUsdMinor) || (period.binaryUsdMinor === 0 && period.rankUsdMinor === 0)) return null;
    previous = period.weekEnd;
    visibleTotal += BigInt(period.binaryUsdMinor) + BigInt(period.rankUsdMinor);
  }
  if (visibleTotal > BigInt(value.virtualBalanceUsdMinor)) return null;
  if (value.nextBefore !== null && (value.periods.length !== PAGAR_COMMISSIONS_PAGE_SIZE || value.nextBefore !== previous)) return null;
  return { virtualBalanceUsdMinor: value.virtualBalanceUsdMinor, periods: value.periods, nextBefore: value.nextBefore };
}
