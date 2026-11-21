import { historicalPackageInstant } from './historical-package-rights-contract.mjs';

export const RECHARGE_PACKAGE_ORIGIN = 'https://app.mindblisspower.com';
export const RECHARGE_PACKAGE_PATH = '/api/member/recharge-package';
const ceilings = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 1_000_000, 2_500_000];
const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

export function rechargePackageTier(grossUsdMinor) {
  if (!Number.isSafeInteger(grossUsdMinor) || grossUsdMinor <= 0) return null;
  const match = ceilings.findIndex(ceiling => grossUsdMinor <= ceiling);
  const index = match === -1 ? ceilings.length - 1 : match;
  return { level: index + 1, ceilingUsdMinor: ceilings[index] };
}

/** Validate the backend's projection without deriving a package from funds or quotes. */
export function rechargePackageSnapshot(value) {
  if (!object(value) || !Object.hasOwn(value, 'package') || Object.keys(value).some(key => key !== 'package' && key !== 'pagarBenefits')) return null;
  const benefits = value.pagarBenefits;
  if (Object.hasOwn(value, 'pagarBenefits') && (!object(benefits) || Object.keys(benefits).length !== 4
    || ['activeGrossUsdMinor', 'roiAccruedUsdMinor', 'ownPv', 'bonusCreditedUsdMinor']
      .some(key => !Number.isSafeInteger(benefits[key]) || benefits[key] < 0))) return null;
  const item = value.package;
  if (item === null) return benefits ? null : { package: null };
  if (!object(item) || Object.keys(item).length !== 4) return null;
  const { level, ceilingUsdMinor, grossUsdMinor, confirmedAt } = item;
  const tier = rechargePackageTier(grossUsdMinor);
  if (!tier || level !== tier.level || ceilingUsdMinor !== tier.ceilingUsdMinor || !historicalPackageInstant(confirmedAt)) return null;
  return { package: { level, ceilingUsdMinor, grossUsdMinor, confirmedAt }, ...(benefits ? { pagarBenefits: benefits } : {}) };
}
