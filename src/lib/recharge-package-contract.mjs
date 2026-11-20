import { historicalPackageInstant } from './historical-package-rights-contract.mjs';

export const RECHARGE_PACKAGE_ORIGIN = 'https://app.mindblisspower.com';
export const RECHARGE_PACKAGE_PATH = '/api/member/recharge-package';
const ceilings = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 1_000_000, 2_500_000];
const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

/** Validate the backend's projection without deriving a package from funds or quotes. */
export function rechargePackageSnapshot(value) {
  if (!object(value) || Object.keys(value).length !== 1 || !Object.hasOwn(value, 'package')) return null;
  const item = value.package;
  if (item === null) return { package: null };
  if (!object(item) || Object.keys(item).length !== 4) return null;
  const { level, ceilingUsdMinor, grossUsdMinor, confirmedAt } = item;
  if (!Number.isInteger(level) || level < 1 || level > ceilings.length || ceilingUsdMinor !== ceilings[level - 1]
    || !Number.isSafeInteger(grossUsdMinor) || grossUsdMinor <= 0 || !historicalPackageInstant(confirmedAt)) return null;
  return { package: { level, ceilingUsdMinor, grossUsdMinor, confirmedAt } };
}
