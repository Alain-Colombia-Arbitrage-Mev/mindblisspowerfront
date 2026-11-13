const evmAddress = /^0x[0-9a-f]{40}$/i;
const signature = /^0x(?:[0-9a-f]{128}|[0-9a-f]{130})$/i;
export const ADMINISTRATIVE_CHAIN = '0x89';
const abort = () => { throw new DOMException('Aborted', 'AbortError'); };
const active = signal => { if (signal?.aborted) abort(); };
const providerValid = provider => provider && typeof provider.request === 'function';
// Reject control characters in untrusted extension display names.
// eslint-disable-next-line no-control-regex
const displayNameControls = /[\u0000-\u001f\u007f]/;

/** Passive EIP-6963 discovery. Never requests account access or a signature. */
export function discoverAdministrativeProviders(onChange, target = globalThis.window) {
  if (!target || typeof onChange !== 'function') return () => {};
  const found = [], identifiers = new Set(); let disposed = false;
  const append = (provider, id, name) => {
    try {
      if (disposed || found.length >= 20 || !providerValid(provider) || identifiers.has(id) || found.some(item => item.provider === provider)) return;
      identifiers.add(id); found.push({ id, name, provider }); onChange([...found]);
    } catch { /* An injected object's getters are untrusted. */ }
  };
  const announced = event => {
    try {
      const { info, provider } = event.detail || {};
      if (!info || typeof info.uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(info.uuid) || typeof info.name !== 'string'
        || !info.name.trim() || info.name.length > 80 || displayNameControls.test(info.name)) return;
      append(provider, info.uuid, info.name.trim());
    } catch { /* Never trust metadata, icons or a provider display name for ownership. */ }
  };
  target.addEventListener('eip6963:announceProvider', announced);
  try { append(Reflect.get(target, 'ethereum'), 'injected', 'Browser wallet'); } catch { /* Optional legacy injection. */ }
  target.dispatchEvent(new Event('eip6963:requestProvider'));
  return () => { disposed = true; target.removeEventListener('eip6963:announceProvider', announced); };
}

async function rpc(provider, method, params, signal) {
  active(signal);
  if (!providerValid(provider)) throw Error('administrative_provider_unavailable');
  const value = await provider.request({ method, ...(params === undefined ? {} : { params }) });
  active(signal); return value;
}

/** Both account access and read-only checks are invoked only by explicit UI actions. */
export async function readAdministrativeProvider(provider, { requestAccess = false, signal = undefined } = {}) {
  const accounts = await rpc(provider, requestAccess ? 'eth_requestAccounts' : 'eth_accounts', undefined, signal);
  if (!Array.isArray(accounts) || accounts.length > 100 || accounts.some(value => typeof value !== 'string' || !evmAddress.test(value))) throw Error('administrative_provider_unavailable');
  const chainId = await rpc(provider, 'eth_chainId', undefined, signal);
  if (typeof chainId !== 'string' || !/^0x[0-9a-f]{1,16}$/i.test(chainId)) throw Error('administrative_provider_unavailable');
  return { address: accounts[0] || '', chainId: `0x${BigInt(chainId).toString(16)}` };
}

export async function switchAdministrativeProviderNetwork(provider, { signal = undefined } = {}) {
  await rpc(provider, 'wallet_switchEthereumChain', [{ chainId: ADMINISTRATIVE_CHAIN }], signal);
  return readAdministrativeProvider(provider, { signal });
}

export function administrativeProviderMatches(connection, assignedAddress) {
  return typeof assignedAddress === 'string' && evmAddress.test(assignedAddress) && connection?.address?.toLowerCase() === assignedAddress.toLowerCase()
    && connection.chainId === ADMINISTRATIVE_CHAIN;
}

/** Ownership only. This module contains no transaction broadcasting capability. */
export async function signAdministrativeOwnership(provider, message, assignedAddress, { signal = undefined } = {}) {
  if (typeof message !== 'string' || message.length < 80 || message.length > 4096 || !evmAddress.test(assignedAddress)) throw Error('invalid_request');
  const before = await readAdministrativeProvider(provider, { signal });
  if (!administrativeProviderMatches(before, assignedAddress)) throw Error('administrative_signer_mismatch');
  const hex = `0x${Array.from(new TextEncoder().encode(message), value => value.toString(16).padStart(2, '0')).join('')}`;
  const result = await rpc(provider, 'personal_sign', [hex, assignedAddress], signal);
  if (typeof result !== 'string' || !signature.test(result)) throw Error('administrative_signature_invalid');
  const after = await readAdministrativeProvider(provider, { signal });
  if (!administrativeProviderMatches(after, assignedAddress)) throw Error('administrative_signer_mismatch');
  return result;
}

/** Local invalidation does not disconnect the user's wallet or request a signature. */
export function watchAdministrativeProvider(provider, onChange) {
  if (typeof provider?.on !== 'function' || typeof onChange !== 'function') return () => {};
  const changed = () => onChange();
  provider.on('accountsChanged', changed); provider.on('chainChanged', changed); provider.on('disconnect', changed);
  return () => {
    provider.removeListener?.('accountsChanged', changed); provider.removeListener?.('chainChanged', changed); provider.removeListener?.('disconnect', changed);
  };
}
