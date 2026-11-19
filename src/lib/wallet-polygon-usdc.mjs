import { Interface, formatUnits } from 'ethers';
import { browserRequestDeadline } from './browser-request-deadline.mjs';
import { WALLET_REOWN_CHAIN_ID } from './wallet-reown-config.mjs';
import { walletReownAddress } from './wallet-reown-connection.mjs';

// Circle-issued USDC contracts.
const polygonUsdc = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const arbitrumUsdc = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const token = new Interface(['function balanceOf(address) view returns (uint256)']);

/**
 * Read a single public on-chain balance without a wallet connection or signature.
 * @param {string} address
 * @param {URL} url
 * @param {string} tokenAddress
 * @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options]
 */
async function readUsdcBalance(address, url, tokenAddress, { signal, fetchImpl = fetch } = {}) {
  const owner = walletReownAddress(address);
  if (!owner || signal?.aborted) throw Error('wallet_usdc_balance_unavailable');

  const deadline = browserRequestDeadline(signal, 8_000);
  try {
    const response = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      redirect: 'error', cache: 'no-store', signal: deadline.signal,
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: tokenAddress, data: token.encodeFunctionData('balanceOf', [owner]) }, 'latest'],
      }),
    });
    if (!response.ok) throw Error('wallet_usdc_balance_unavailable');
    const value = await response.json();
    if (deadline.signal.aborted || value?.jsonrpc !== '2.0' || value.id !== 1 || value.error
      || typeof value.result !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value.result)) {
      throw Error('wallet_usdc_balance_unavailable');
    }
    return formatUnits(BigInt(value.result), 6);
  } finally {
    deadline.dispose();
  }
}

/** @param {string} address @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export async function readPolygonUsdcBalance(address, options) {
  const projectId = process.env.NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID;
  if (!projectId || !/^[a-f0-9]{32}$/i.test(projectId)) throw Error('wallet_usdc_balance_unavailable');
  const url = new URL('https://rpc.walletconnect.org/v1');
  url.search = new URLSearchParams({ chainId: `eip155:${WALLET_REOWN_CHAIN_ID}`, projectId }).toString();
  return readUsdcBalance(address, url, polygonUsdc, options);
}

/** @param {string} address @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export function readArbitrumUsdcBalance(address, options) {
  return readUsdcBalance(address, new URL('https://arb1.arbitrum.io/rpc'), arbitrumUsdc, options);
}
