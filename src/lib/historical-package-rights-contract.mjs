export const HISTORICAL_PACKAGE_RIGHTS_POLICY = 'historical_membership_access_until_revoked_v1';
const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Package labels are plain text, never markup or control instructions.
// eslint-disable-next-line no-control-regex
const text = (value, maximum) => typeof value === 'string' && value.length > 0 && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 733;
export function historicalPackageInstant(value) {
  if (typeof value !== 'string' || value.length > 64) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d, h, minute, second] = match.map(Number);
  return y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate()
    && h <= 23 && minute <= 59 && second <= 59 && Number.isFinite(Date.parse(value));
}

/** A recognition snapshot never qualifies economic packages, points or balances. */
export function historicalPackageRights(value) {
  if (!object(value) || value.rightsOnly !== true || value.economicActivation !== false || value.roiEnabled !== false
    || value.commissionsEnabled !== false || value.policy !== HISTORICAL_PACKAGE_RIGHTS_POLICY
    || !count(value.activeCount) || !count(value.totalCount) || value.activeCount > value.totalCount
    || !Array.isArray(value.items) || value.items.length > 100 || value.items.length > value.totalCount) return null;
  const items = [], seen = new Set();
  for (const item of value.items) {
    if (!object(item) || typeof item.id !== 'string' || !uuid.test(item.id) || seen.has(item.id.toLowerCase())
      || !text(item.packageName, 240) || typeof item.sourcePackageId !== 'string' || !/^[1-9]\d{0,18}$/.test(item.sourcePackageId)
      || typeof item.packageBaseUsd !== 'string' || !/^(?:0|[1-9]\d{0,13})\.\d{2}$/.test(item.packageBaseUsd) || item.packageBaseUsd === '0.00'
      || !historicalPackageInstant(item.boughtAt) || !historicalPackageInstant(item.recognizedAt)
      || Date.parse(item.boughtAt) > Date.parse(item.recognizedAt)
      || !['active', 'suspended', 'revoked', 'review_required'].includes(item.status) || item.source !== 'stripe_import'
      || !object(item.term) || item.term.type !== 'until_revoked' || item.term.endsAt !== null
      || !historicalPackageInstant(item.term.startsAt) || Date.parse(item.term.startsAt) !== Date.parse(item.recognizedAt)) return null;
    seen.add(item.id.toLowerCase());
    items.push({ id: item.id.toLowerCase(), packageName: item.packageName, sourcePackageId: item.sourcePackageId, packageBaseUsd: item.packageBaseUsd,
      boughtAt: item.boughtAt, recognizedAt: item.recognizedAt, status: item.status,
      term: { type: 'until_revoked', startsAt: item.term.startsAt, endsAt: null }, source: 'stripe_import' });
  }
  const activeShown = items.filter(item => item.status === 'active').length;
  if (activeShown > value.activeCount || items.length - activeShown > value.totalCount - value.activeCount) return null;
  return { rightsOnly: true, economicActivation: false, roiEnabled: false, commissionsEnabled: false,
    policy: HISTORICAL_PACKAGE_RIGHTS_POLICY, activeCount: value.activeCount, totalCount: value.totalCount, items };
}
