// Wire values only: no wallet SDK, signing keys, RPC URL or payment authority.
export const SOLANA_PERSONAL_WALLET = Object.freeze({ network: 'solana', cluster: 'mainnet-beta',
  genesisHash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
  caipNetworkId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', tokenDecimals: 6,
  destinationTokenAccount: 'FJjjX9wMpDtGuymv5WRsDxGay2zjDPECWCiNmyJ2tnMz',
  recipientAddress: '8U6UD6UmRkYvpubEUg3GG9LBobH5J2c9871mryh1TA5k' });
export const SOLANA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function solanaBase58Bytes(value, size = 32) {
  if (typeof value !== 'string' || value.length < size || value.length > Math.ceil(size * 1.366)) return null;
  let number = 0n;
  for (const char of value) { const digit = alphabet.indexOf(char); if (digit < 0) return null; number = number * 58n + BigInt(digit); }
  const bytes = [];
  while (number) { bytes.unshift(Number(number & 255n)); number >>= 8n; }
  const leading = value.match(/^1*/)[0].length;
  if (leading + bytes.length !== size) return null;
  return Uint8Array.from([...new Array(leading).fill(0), ...bytes]);
}
export const solanaAddress = value => solanaBase58Bytes(value, 32) ? value : null;
export function solanaAtomic(value, allowZero = true) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,19})$/.test(value)) return null;
  const amount = BigInt(value);
  return amount <= 18446744073709551615n && (allowZero || amount > 0n) ? value : null;
}
/** @param {unknown} value @param {{bytes?: number, maxBytes?: number}} [options] */
export function canonicalBase64(value, { bytes, maxBytes } = {}) {
  if (typeof value !== 'string' || !value.length || value.length > 1644 || value.length % 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null;
  try {
    const binary = atob(value);
    return btoa(binary) === value && (bytes === undefined || binary.length === bytes) && (maxBytes === undefined || binary.length <= maxBytes) ? value : null;
  } catch { return null; }
}
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const date = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
export function solanaWalletLinkInput(action, value) {
  if (action === 'challenge' && exact(value, ['address']) && solanaAddress(value.address)) return { address: value.address };
  if (action === 'confirm' && exact(value, ['challengeId', 'signature']) && SOLANA_UUID.test(value.challengeId) && canonicalBase64(value.signature, { bytes: 64 })) return { challengeId: value.challengeId, signature: value.signature };
  return null;
}
export function solanaWalletLinkView(action, value) {
  if (!object(value)) return null;
  if (value.linked === true && solanaAddress(value.address)) return { linked: true, address: value.address };
  if (action === 'status' && value.linked === false) return { linked: false, address: '' };
  if (action === 'challenge' && value.linked === false && SOLANA_UUID.test(value.challengeId) && solanaAddress(value.address)
    && typeof value.message === 'string' && value.message.length > 0 && value.message.length <= 4096 && date(value.expiresAt)) {
    return { linked: false, challengeId: value.challengeId, address: value.address, message: value.message, expiresAt: value.expiresAt };
  }
  return null;
}
export function solanaBalanceView(value) {
  const policy = SOLANA_PERSONAL_WALLET;
  if (!object(value) || value.walletKind !== 'personal' || value.network !== policy.network || value.cluster !== policy.cluster
    || !solanaAddress(value.walletAddress) || value.mintAddress !== policy.mintAddress || value.tokenDecimals !== 6
    || !solanaAddress(value.sourceTokenAccount) || value.scope !== 'associated_token_account'
    || solanaAtomic(value.balanceAtomic) === null || solanaAtomic(value.nativeBalanceAtomic) === null || !date(value.observedAt)) return null;
  return { walletKind: 'personal', network: policy.network, cluster: policy.cluster, walletAddress: value.walletAddress,
    mintAddress: policy.mintAddress, tokenDecimals: 6, sourceTokenAccount: value.sourceTokenAccount, scope: 'associated_token_account',
    balanceAtomic: value.balanceAtomic, nativeBalanceAtomic: value.nativeBalanceAtomic, observedAt: value.observedAt };
}
export function solanaCapabilitiesView(value) {
  if (!object(value) || value.walletKind !== 'personal' || value.network !== 'solana' || value.cluster !== 'mainnet-beta'
    || typeof value.transferEnabled !== 'boolean' || !['mindbliss', 'unavailable'].includes(value.sponsorship)
    || (value.transferEnabled && value.sponsorship !== 'mindbliss')) return null;
  return { walletKind: 'personal', network: 'solana', cluster: 'mainnet-beta', transferEnabled: value.transferEnabled, sponsorship: value.sponsorship };
}
export function solanaPaymentInput(action, value) {
  if (action === 'prepare' && exact(value, ['requestId', 'amountAtomic']) && SOLANA_UUID.test(value.requestId) && solanaAtomic(value.amountAtomic, false)) return { requestId: value.requestId, amountAtomic: value.amountAtomic };
  if (action === 'submit' && exact(value, ['paymentId', 'transactionBase64']) && SOLANA_UUID.test(value.paymentId) && canonicalBase64(value.transactionBase64, { maxBytes: 1232 })) return { paymentId: value.paymentId, transactionBase64: value.transactionBase64 };
  if (action === 'verify' && exact(value, ['paymentId']) && SOLANA_UUID.test(value.paymentId)) return { paymentId: value.paymentId };
  return null;
}
export function solanaPaymentView(value) {
  const policy = SOLANA_PERSONAL_WALLET;
  if (!object(value) || !SOLANA_UUID.test(value.paymentId) || value.walletKind !== 'personal' || value.network !== policy.network || value.cluster !== policy.cluster
    || !solanaAddress(value.walletAddress) || value.walletAddress === policy.recipientAddress || value.mintAddress !== policy.mintAddress || value.tokenDecimals !== 6
    || value.recipientAddress !== policy.recipientAddress || !solanaAddress(value.sourceTokenAccount) || value.destinationTokenAccount !== policy.destinationTokenAccount
    || !solanaAtomic(value.amountAtomic, false) || !['prepared', 'broadcasting', 'ambiguous', 'submitted', 'confirmed', 'failed', 'expired'].includes(value.status)
    || !(value.transactionSignature === null || solanaBase58Bytes(value.transactionSignature, 64)) || !date(value.createdAt) || !date(value.expiresAt)
    || !solanaAddress(value.blockhash) || !solanaAtomic(value.lastValidBlockHeight) || !/^[0-9a-f]{64}$/.test(value.messageHash)
    || !solanaAddress(value.feePayerAddress) || solanaAtomic(value.estimatedFeeLamports) === null || solanaAtomic(value.maxFeeLamports) === null
    || BigInt(value.estimatedFeeLamports) > BigInt(value.maxFeeLamports)
    || !(value.transactionBase64 === null || canonicalBase64(value.transactionBase64, { maxBytes: 1232 })) || value.membershipAssignment !== 'pending'
    || !(value.slot === null || solanaAtomic(value.slot)) || !(value.finalizedAt === null || date(value.finalizedAt))
    || !['unconfirmed', 'finalized'].includes(value.confirmationStatus)) return null;
  if (['submitted', 'confirmed'].includes(value.status) && value.transactionSignature === null) return null;
  if (value.status === 'prepared' && value.transactionSignature !== null) return null;
  if (value.status === 'confirmed' ? value.slot === null || value.finalizedAt === null || value.confirmationStatus !== 'finalized'
    : value.slot !== null || value.finalizedAt !== null || value.confirmationStatus !== 'unconfirmed') return null;
  return { paymentId: value.paymentId, walletKind: 'personal', network: policy.network, cluster: policy.cluster,
    walletAddress: value.walletAddress, mintAddress: policy.mintAddress, tokenDecimals: 6, recipientAddress: policy.recipientAddress,
    sourceTokenAccount: value.sourceTokenAccount, destinationTokenAccount: value.destinationTokenAccount, amountAtomic: value.amountAtomic,
    status: value.status, transactionSignature: value.transactionSignature, createdAt: value.createdAt, expiresAt: value.expiresAt,
    blockhash: value.blockhash, lastValidBlockHeight: value.lastValidBlockHeight, messageHash: value.messageHash,
    feePayerAddress: value.feePayerAddress, estimatedFeeLamports: value.estimatedFeeLamports, maxFeeLamports: value.maxFeeLamports,
    transactionBase64: value.transactionBase64, membershipAssignment: 'pending', slot: value.slot, finalizedAt: value.finalizedAt,
    confirmationStatus: value.confirmationStatus };
}
export function solanaPaymentHistory(value) {
  if (!object(value) || value.walletKind !== 'personal' || !Array.isArray(value.payments) || value.payments.length > 20) return null;
  const payments = value.payments.map(solanaPaymentView);
  if (payments.some(item => !item) || new Set(payments.map(item => item.paymentId)).size !== payments.length
    || new Set(payments.map(item => item.walletAddress)).size > 1) return null;
  return { walletKind: 'personal', payments };
}
