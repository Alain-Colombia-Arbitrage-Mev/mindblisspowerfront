import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { administrativeOfframpOptions, administrativeOfframpSelection } from './administrative-offramp-contract.mjs';

/** @param {string} country @param {string} destinationCurrencyCode @param {{signal?: AbortSignal}} [options] */
export async function readAdministrativeOfframpOptions(country, destinationCurrencyCode, { signal } = {}) {
  const selection = administrativeOfframpSelection(country, destinationCurrencyCode);
  if (!selection) throw Error('invalid_request');
  const deadline = browserRequestDeadline(signal, 25_000);
  try {
    const response = await fetch(`/api/member/wallet-funding/administrative/offramp/options?country=${country}&destinationCurrencyCode=${destinationCurrencyCode}`,
      { method: 'GET', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: deadline.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const allowed = new Set(['unauthenticated', 'offramp_unconfigured', 'offramp_rate_limited', 'administrative_wallet_unavailable']);
      throw Object.assign(Error(allowed.has(data?.error) ? data.error : 'offramp_provider_unavailable'), { status: response.status });
    }
    const safe = administrativeOfframpOptions(data, selection);
    if (!safe) throw Error('offramp_provider_unavailable');
    return safe;
  } finally { deadline.dispose(); }
}
