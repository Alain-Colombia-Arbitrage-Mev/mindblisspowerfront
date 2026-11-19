import { FUNDING_UUID } from './wallet-funding-contract.mjs';
import { sandboxWalletSubjectHeader, sandboxWalletAddress } from './sandbox-wallet-contract.mjs';

export const WALLET_PRODUCTION_PATH = '/api/member/wallet-funding/production';
export const WALLET_PRODUCTION_INTERNAL_PATH = '/api/member/wallet-funding';
export const WALLET_PRODUCTION_ORIGIN = 'https://wallet.mindblisspower.com';
export const walletProductionSubject = sandboxWalletSubjectHeader;
const code = value => typeof value === 'string' && /^[A-Z]{2}$/.test(value);
const currency = value => typeof value === 'string' && /^[A-Z]{3}$/.test(value);
const token = value => typeof value === 'string' && /^[A-Z0-9_]{2,64}$/.test(value);
const checkoutProviders = new Set(['ALCHEMYPAY', 'BANXA', 'ONMETA', 'ONRAMPMONEY', 'RAMPNOW']);
const recordedProviders = new Set([...checkoutProviders, 'BLOCKCHAINDOTCOM', 'BTCDIRECT', 'GUARDARIAN', 'KOYWE',
  'KRYPTONIM', 'ROBINHOOD', 'STRIPE', 'TOPPER', 'TRANSAK', 'UNLIMIT']);
const plain = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e9;
const amount = value => finite(value) && value >= 0.01 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value);
const fundingAssets = Object.freeze([
  Object.freeze({ code: 'USDT_POLYGON', asset: 'USDT', network: 'polygon', chainId: 137, networkName: 'Polygon' }),
  Object.freeze({ code: 'USDC_POLYGON', asset: 'USDC', network: 'polygon', chainId: 137, networkName: 'Polygon' }),
  Object.freeze({ code: 'USDC_ARBITRUM', asset: 'USDC', network: 'arbitrum', chainId: 42161, networkName: 'Arbitrum' }),
  Object.freeze({ code: 'USDC', asset: 'USDC', network: 'ethereum', chainId: 1, networkName: 'Ethereum' }),
]);
export const walletProductionAsset = code => fundingAssets.find(item => item.code === code) ?? null;
export function walletProductionDestinationCode(value) {
  return plain(value) ? fundingAssets.find(item => item.asset === value.asset && item.network === value.network && item.chainId === value.chainId)?.code ?? '' : '';
}
function destination(value) {
  const asset = walletProductionAsset(walletProductionDestinationCode(value));
  return asset && sandboxWalletAddress(value.address)
    ? { address: value.address.toLowerCase(), asset: asset.asset, network: asset.network, chainId: asset.chainId } : null;
}
const rampNowAssetCodes = new Set(['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC']);
const isRampNowCard = (country, fiat, method) => country === 'US' && fiat === 'USD' && method === 'CREDIT_DEBIT_CARD';
function assetAllowed(code, country, fiat, provider, method) {
  if (provider === 'RAMPNOW') return isRampNowCard(country, fiat, method) && rampNowAssetCodes.has(code);
  if (code === 'USDT_POLYGON') return true;
  if (code === 'USDC_ARBITRUM') return country === 'MX' && fiat === 'EUR' && provider === 'ALCHEMYPAY' && method === 'CREDIT_DEBIT_CARD';
  return code === 'USDC_POLYGON' && provider === 'ONRAMPMONEY'
    && ((country === 'US' && fiat === 'USD' && ['ACH', 'LOCAL_BANK_TRANSFER'].includes(method))
      || (country === 'MX' && fiat === 'MXN' && method === 'SPEI')
      || (country === 'CO' && fiat === 'COP' && ['PSE', 'LOCAL_BANK_TRANSFER'].includes(method)));
}

/** Project only bounded, non-identifying provider failure classifications. */
export function walletProductionDiagnostic(value) {
  if (!plain(value) || !['widget_transport', 'widget_http', 'widget_schema', 'widget_url', 'widget_finish'].includes(value.stage)) return undefined;
  const safe = { stage: value.stage };
  if (Number.isInteger(value.upstreamStatus) && value.upstreamStatus >= 100 && value.upstreamStatus <= 599) safe.upstreamStatus = value.upstreamStatus;
  for (const key of ['providerCode', 'serviceProviderCode']) if (typeof value[key] === 'string' && /^[A-Z0-9_]{2,80}$/.test(value[key])
    && !/^0X[0-9A-F]{40}$/i.test(value[key]) && !/^[0-9A-F]{32,80}$/.test(value[key])) safe[key] = value[key];
  return safe;
}
export function walletProductionFailureLog(failure) {
  const error = typeof failure?.message === 'string' && /^(?:wallet_production_[a-z_]{1,60}|wallet_funding_[a-z_]{1,60}|unauthenticated|invalid_request|invalid_origin|invalid_auth_proxy)$/.test(failure.message)
    ? failure.message : 'wallet_production_unavailable';
  const diagnostic = walletProductionDiagnostic(failure?.diagnostic);
  return { error, ...(Number.isInteger(failure?.status) && failure.status >= 100 && failure.status <= 599 ? { status: failure.status } : {}), ...(diagnostic ? { diagnostic } : {}) };
}

export function walletProductionInput(value, session = false) {
  if (!plain(value)) return null;
  const hasDestination = Object.hasOwn(value, 'destinationCurrencyCode');
  const keys = ['country', 'sourceCurrencyCode', 'amount', 'paymentMethodType', ...(session ? ['requestId', 'serviceProvider'] : []),
    ...(hasDestination ? ['destinationCurrencyCode'] : [])];
  if (!exact(value, keys) || !code(value.country) || !currency(value.sourceCurrencyCode) || !amount(value.amount) || !token(value.paymentMethodType)
    || (value.sourceCurrencyCode === 'USD' && (value.amount < 50 || value.amount > 25000))
    || (session && (!FUNDING_UUID.test(value.requestId || '') || !checkoutProviders.has(value.serviceProvider)))
    || (session && value.serviceProvider === 'RAMPNOW' && !isRampNowCard(value.country, value.sourceCurrencyCode, value.paymentMethodType))
    || (hasDestination && (!isRampNowCard(value.country, value.sourceCurrencyCode, value.paymentMethodType)
      || !rampNowAssetCodes.has(value.destinationCurrencyCode) || (session && value.serviceProvider !== 'RAMPNOW')))) return null;
  return { country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, amount: value.amount, paymentMethodType: value.paymentMethodType,
    ...(hasDestination ? { destinationCurrencyCode: value.destinationCurrencyCode } : {}),
    ...(session ? { requestId: value.requestId.toLowerCase(), serviceProvider: value.serviceProvider } : {}) };
}
export function walletProductionCapabilities(value) {
  return plain(value) && value.flow === 'wallet_funding' && typeof value.configured === 'boolean' && value.environment === 'production'
    && value.asset === 'USDT' && value.network === 'polygon' && value.chainId === 137 && value.canBroadcast === false
    ? { flow: 'wallet_funding', configured: value.configured, environment: 'production', asset: 'USDT', network: 'polygon', chainId: 137, canBroadcast: false } : null;
}
export function walletProductionDiscovery(value, country = '') {
  if (!plain(value)) return null;
  if (!country) {
    if (!Array.isArray(value.countries) || value.countries.length > 260 || !value.countries.every(item => plain(item) && code(item.code) && typeof item.name === 'string' && item.name.length <= 160)) return null;
    return { countries: value.countries.map(({ code, name }) => ({ code, name })) };
  }
  if (value.country !== country || !Array.isArray(value.currencies) || value.currencies.length > 200 || !value.currencies.every(item => plain(item) && currency(item.code)
    && typeof item.name === 'string' && item.name.length <= 160 && Number.isInteger(item.decimalPlaces) && item.decimalPlaces >= 0 && item.decimalPlaces <= 4)
    || (value.defaultCurrencyCode !== null && !value.currencies.some(item => item.code === value.defaultCurrencyCode))) return null;
  return { country, currencies: value.currencies.map(({ code, name, decimalPlaces }) => ({ code, name, decimalPlaces })), defaultCurrencyCode: value.defaultCurrencyCode };
}
export function walletProductionOptions(value) {
  if (!plain(value) || value.environment !== 'production' || !code(value.country) || !currency(value.sourceCurrencyCode)
    || !Array.isArray(value.routes) || value.routes.length > 32 || !value.routes.every(route => plain(route) && checkoutProviders.has(route.serviceProvider)
      && Array.isArray(route.paymentMethods) && route.paymentMethods.length <= 128 && route.paymentMethods.every(item => plain(item) && token(item.method) && item.currencyCode === value.sourceCurrencyCode
        && finite(item.minimumAmount) && finite(item.maximumAmount) && item.maximumAmount >= item.minimumAmount))) return null;
  const destinationCode = value.destinationCurrencyCode === undefined ? 'USDT_POLYGON' : value.destinationCurrencyCode;
  if (!walletProductionAsset(destinationCode) || !value.routes.every(route => route.paymentMethods.every(item => {
    if (item.destinationCurrencyCodes === undefined) return assetAllowed(destinationCode, value.country, value.sourceCurrencyCode, route.serviceProvider, item.method);
    return route.serviceProvider === 'RAMPNOW' && isRampNowCard(value.country, value.sourceCurrencyCode, item.method)
      && Array.isArray(item.destinationCurrencyCodes) && item.destinationCurrencyCodes.length > 0
      && new Set(item.destinationCurrencyCodes).size === item.destinationCurrencyCodes.length
      && item.destinationCurrencyCodes.every(code => rampNowAssetCodes.has(code)) && item.destinationCurrencyCodes.includes(destinationCode)
      && (!item.destinationCurrencyCodes.includes('USDC_POLYGON') || destinationCode === 'USDC_POLYGON');
  }))) return null;
  const routes = value.routes.map(route => ({ serviceProvider: route.serviceProvider, paymentMethods: route.paymentMethods.map(item => ({
    method: item.method, currencyCode: item.currencyCode, minimumAmount: item.minimumAmount, maximumAmount: item.maximumAmount,
    ...(route.serviceProvider === 'RAMPNOW' ? { destinationCurrencyCodes: [...(item.destinationCurrencyCodes ?? [destinationCode])] } : {}),
  })) }));
  return { environment: 'production', country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, routes,
    ...(value.destinationCurrencyCode ? { destinationCurrencyCode: value.destinationCurrencyCode } : {}),
    paymentMethods: [...new Set(routes.flatMap(route => route.paymentMethods.map(item => item.method)))] };
}
export function walletProductionQuote(value, input, expectedAddress = '') {
  const dest = destination(value?.destination);
  const destinationCode = walletProductionDestinationCode(dest);
  if (!plain(value) || value.walletKind !== 'personal' || value.environment !== 'production' || !dest || !code(value.country) || !currency(value.sourceCurrencyCode)
    || (value.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== destinationCode)
    || !amount(value.requestedAmount) || !token(value.paymentMethodType) || !Array.isArray(value.quotes) || !value.quotes.length || value.quotes.length > 4
    || (expectedAddress && dest.address !== expectedAddress.toLowerCase()) || (input && (value.country !== input.country || value.sourceCurrencyCode !== input.sourceCurrencyCode
      || value.requestedAmount !== input.amount || value.paymentMethodType !== input.paymentMethodType
      || (input.destinationCurrencyCode !== undefined && input.destinationCurrencyCode !== destinationCode)))
    || !value.quotes.every(item => plain(item) && checkoutProviders.has(item.serviceProvider) && item.sourceAmount === value.requestedAmount && finite(item.destinationAmount) && item.destinationAmount > 0
      && finite(item.totalFee) && finite(item.networkFee) && item.sourceCurrencyCode === value.sourceCurrencyCode && item.destinationCurrencyCode === destinationCode
      && assetAllowed(destinationCode, value.country, value.sourceCurrencyCode, item.serviceProvider, value.paymentMethodType)
      && (input?.destinationCurrencyCode === undefined || item.serviceProvider === 'RAMPNOW')
      && (item.rampScore === undefined || finite(item.rampScore)))) return null;
  return { walletKind: 'personal', environment: 'production', country: value.country, sourceCurrencyCode: value.sourceCurrencyCode, requestedAmount: value.requestedAmount,
    paymentMethodType: value.paymentMethodType, destination: dest, quotes: value.quotes.map(item => ({ serviceProvider: item.serviceProvider, sourceAmount: item.sourceAmount,
      destinationAmount: item.destinationAmount, totalFee: item.totalFee, networkFee: item.networkFee, sourceCurrencyCode: item.sourceCurrencyCode, destinationCurrencyCode: item.destinationCurrencyCode, ...(item.rampScore === undefined ? {} : { rampScore: item.rampScore }) })) };
}
export function walletProductionCheckoutUrl(value, serviceProvider = '') {
  if (serviceProvider && !checkoutProviders.has(serviceProvider)) return null;
  try {
    // Reject controls before the URL parser can silently normalize them.
    // eslint-disable-next-line no-control-regex
    if (typeof value !== 'string' || value.length > 8192 || /[\s\\\u0000-\u001f\u007f]/.test(value) || !/^https:\/\/(meldcrypto\.com|meldshared\.banxa\.com)\//.test(value)) return null;
    const url = new URL(value), opaque = item => typeof item === 'string' && /^[A-Za-z0-9_.~+/-]{1,7800}={0,2}$/.test(item);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
    if (url.hostname === 'meldshared.banxa.com' && (!serviceProvider || serviceProvider === 'BANXA') && url.pathname === '/papi/transit/' && url.searchParams.size === 1 && url.searchParams.getAll('initId').length === 1 && opaque(url.searchParams.get('initId'))) return url.href;
    if (url.pathname !== '/') return null;
    if (url.hostname === 'meldcrypto.com' && [...url.searchParams.keys()].every(key => ['token', 'wt'].includes(key)) && url.searchParams.size === 1 && opaque(url.searchParams.get('token') || url.searchParams.get('wt'))) return url.href;
  } catch { /* Reject malformed external checkout URLs. */ } return null;
}
function snapshot(value) {
  const dest = destination(value?.destination);
  const destinationCode = walletProductionDestinationCode(dest);
  if (!plain(value) || !FUNDING_UUID.test(value.checkoutReference || '') || value.provider !== 'meld' || !recordedProviders.has(value.serviceProvider) || !code(value.country)
    || !currency(value.sourceCurrencyCode) || !amount(value.requestedAmount) || !token(value.paymentMethodType) || !dest
    || (value.destinationCurrencyCode !== undefined && value.destinationCurrencyCode !== destinationCode)
    || !assetAllowed(destinationCode, value.country, value.sourceCurrencyCode, value.serviceProvider, value.paymentMethodType)) return null;
  return { checkoutReference: value.checkoutReference.toLowerCase(), provider: 'meld', serviceProvider: value.serviceProvider, country: value.country,
    sourceCurrencyCode: value.sourceCurrencyCode, requestedAmount: value.requestedAmount, paymentMethodType: value.paymentMethodType, destination: dest };
}
export function walletProductionAcknowledgement(value, input) {
  const safe = snapshot(value), url = walletProductionCheckoutUrl(value?.checkoutUrl, value?.serviceProvider);
  const destinationCode = walletProductionDestinationCode(safe?.destination);
  if (!safe || value.walletKind !== 'personal' || value.environment !== 'production' || value.status !== 'session_created' || value.destinationCurrencyCode !== destinationCode
    || !url || (destinationCode === 'USDC_ARBITRUM' && !new URL(url).searchParams.has('token')) || !instant(value.createdAt) || (input && (safe.checkoutReference !== input.requestId || safe.country !== input.country || safe.requestedAmount !== input.amount
      || safe.sourceCurrencyCode !== input.sourceCurrencyCode || safe.paymentMethodType !== input.paymentMethodType || safe.serviceProvider !== input.serviceProvider
      || (input.destinationCurrencyCode !== undefined && input.destinationCurrencyCode !== destinationCode)))) return null;
  return { ...safe, walletKind: 'personal', environment: 'production', status: 'session_created', destinationCurrencyCode: value.destinationCurrencyCode, checkoutUrl: url, createdAt: value.createdAt };
}
const states = new Set(['initiated', 'session_created', 'unavailable']);
const cryptoAmount = value => typeof value === 'string' && /^\d{1,12}(?:\.\d{1,6})?$/.test(value);
function confirmation(value) {
  if (!plain(value) || !['unconfirmed', 'pending', 'confirmed', 'failed'].includes(value.state) || value.testMode !== false || !['none', 'meld_production_api'].includes(value.source)
    || (value.state !== 'unconfirmed' && value.source !== 'meld_production_api')) return null;
  if (value.state === 'confirmed' && (!instant(value.confirmedAt) || !cryptoAmount(value.receivedAmount) || Number(value.receivedAmount) <= 0
    || typeof value.transactionId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(value.transactionId) || value.providerStatus !== 'SETTLED')) return null;
  return { state: value.state, source: value.source, testMode: false, ...(typeof value.transactionId === 'string' ? { transactionId: value.transactionId.slice(0, 128) } : {}),
    ...(value.state === 'confirmed' ? { providerStatus: 'SETTLED' } : {}),
    ...(cryptoAmount(value.receivedAmount) ? { receivedAmount: value.receivedAmount } : {}), ...(instant(value.confirmedAt) ? { confirmedAt: value.confirmedAt } : {}) };
}
function confirmedRampNowDestination(value, safe, proof) {
  if (!safe || safe.serviceProvider !== 'RAMPNOW' || proof?.state !== 'confirmed') return value === undefined ? undefined : null;
  const actual = destination(value);
  return actual?.address === safe.destination.address && rampNowAssetCodes.has(walletProductionDestinationCode(actual)) ? actual : null;
}
export function walletProductionStatus(value) {
  const safe = snapshot(value), proof = confirmation(value?.confirmation);
  const actual = confirmedRampNowDestination(value?.confirmedDestination, safe, proof);
  return safe && proof && value.walletKind === 'personal' && value.environment === 'production' && states.has(value.requestStatus)
    && actual !== null
    ? { ...safe, walletKind: 'personal', environment: 'production', requestStatus: value.requestStatus, confirmation: proof, ...(actual ? { confirmedDestination: actual } : {}) } : null;
}
export function walletProductionHistory(value) {
  if (!plain(value) || value.walletKind !== 'personal' || value.environment !== 'production' || value.settlement !== 'unconfirmed' || !Array.isArray(value.records) || value.records.length > 50) return null;
  const records = value.records.map(item => {
    const safe = snapshot(item), proof = item?.confirmation === undefined ? undefined : confirmation(item.confirmation);
    const actual = confirmedRampNowDestination(item?.confirmedDestination, safe, proof);
    return safe && states.has(item.status) && instant(item.createdAt) && (item.confirmation === undefined || proof)
      && actual !== null
      ? { ...safe, status: item.status, createdAt: item.createdAt, ...(proof ? { confirmation: proof } : {}), ...(actual ? { confirmedDestination: actual } : {}) } : null;
  });
  return records.every(Boolean) ? { walletKind: 'personal', environment: 'production', settlement: 'unconfirmed', records } : null;
}
