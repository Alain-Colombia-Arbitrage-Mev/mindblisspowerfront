import { Signature, TypedDataEncoder, verifyTypedData } from 'ethers';
import { polygonRelayView } from './polygon-relay-contract.mjs';

/** A NativeMetaTransaction authorization moves only the reviewed USDT amount.
 * The token's nonce prevents replay; the token does not support an onchain deadline.
 * This method never broadcasts, requests SIWX, or exports a wallet key.
 */
export async function signPolygonRelay(value, provider, expectedWallet, assertActive = () => {}) {
  const payment = polygonRelayView(value);
  if (!payment || payment.status !== 'prepared' || !payment.typedData || payment.walletAddress !== expectedWallet
    || Date.parse(payment.expiresAt) <= Date.now() || !provider || typeof provider.request !== 'function') throw new Error('polygon_relay_invalid_authorization');
  const typed = payment.typedData;
  if (TypedDataEncoder.hash(typed.domain, typed.types, typed.message) !== payment.authorizationDigest) throw new Error('polygon_relay_invalid_authorization');
  async function identity() {
    assertActive();
    const [chain, accounts] = await Promise.all([provider.request({ method: 'eth_chainId' }), provider.request({ method: 'eth_accounts' })]);
    assertActive();
    if (chain !== '0x89') throw new Error('polygon_relay_network_mismatch');
    if (!Array.isArray(accounts) || accounts.length !== 1 || typeof accounts[0] !== 'string' || accounts[0].toLowerCase() !== expectedWallet) throw new Error('polygon_relay_wallet_changed');
  }
  await identity();
  const payload = TypedDataEncoder.getPayload(typed.domain, typed.types, typed.message);
  const raw = await provider.request({ method: 'eth_signTypedData_v4', params: [expectedWallet, JSON.stringify(payload)] });
  await identity();
  let signature;
  try { signature = Signature.from(raw).serialized.toLowerCase(); } catch { throw new Error('polygon_relay_invalid_authorization'); }
  if (verifyTypedData(typed.domain, typed.types, typed.message, signature).toLowerCase() !== expectedWallet) throw new Error('polygon_relay_invalid_authorization');
  assertActive();
  return { paymentId: payment.paymentId, signature };
}
