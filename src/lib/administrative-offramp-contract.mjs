const code = value => typeof value === 'string' && /^[A-Z0-9_]{2,64}$/.test(value);
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000;

export function administrativeOfframpSelection(country, destinationCurrencyCode) {
  if (!['US', 'MX', 'CO'].includes(country) || !['USD', 'MXN', 'COP'].includes(destinationCurrencyCode)) return null;
  if (destinationCurrencyCode !== 'USD' && !((country === 'MX' && destinationCurrencyCode === 'MXN')
    || (country === 'CO' && destinationCurrencyCode === 'COP'))) return null;
  return { country, destinationCurrencyCode };
}

/** Catalog availability is distinct from permission to initiate a withdrawal. */
export function administrativeOfframpOptions(value, expected) {
  if (!value || !expected || value.flow !== 'offramp' || value.walletKind !== 'administrative'
    || value.environment !== 'sandbox' || value.asset !== 'USDT' || value.network !== 'polygon' || value.chainId !== 137
    || value.country !== expected.country || value.destinationCurrencyCode !== expected.destinationCurrencyCode
    || !Array.isArray(value.routes) || value.routes.length > 100 || value.execution?.canCreateSession !== false
    || value.execution?.canTransfer !== false || value.execution?.reason !== 'discovery_only') return null;
  const providers = new Set(), routes = [];
  for (const route of value.routes) {
    if (!code(route?.serviceProvider) || providers.has(route.serviceProvider)
      || !Array.isArray(route.paymentMethods) || route.paymentMethods.length > 64) return null;
    providers.add(route.serviceProvider);
    const methods = new Set(), paymentMethods = [];
    for (const item of route.paymentMethods) {
      if (!code(item?.method) || methods.has(item.method) || !['USDT_POLYGON', 'USDT', expected.destinationCurrencyCode].includes(item.currencyCode)
        || !finite(item.minimumAmount) || !finite(item.maximumAmount) || item.maximumAmount < item.minimumAmount) return null;
      methods.add(item.method);
      paymentMethods.push({ method: item.method, currencyCode: item.currencyCode, minimumAmount: item.minimumAmount, maximumAmount: item.maximumAmount });
    }
    routes.push({ serviceProvider: route.serviceProvider, paymentMethods });
  }
  return { flow: 'offramp', walletKind: 'administrative', environment: 'sandbox', asset: 'USDT', network: 'polygon', chainId: 137,
    ...expected, routes, execution: { canCreateSession: false, canTransfer: false, reason: 'discovery_only' } };
}
