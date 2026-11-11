// Shared display/contract values without wallet, RPC or ethers dependencies.
export const PERSONAL_COMPANY_PAYMENT = Object.freeze({
  chainId: 137, tokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', tokenDecimals: 6,
  recipientAddress: '0x0a600b03ef5f8e7f3e182b83440c6d292033db0e',
});
const MAX_UINT256 = (1n << 256n) - 1n;

export function personalCompanyPaymentAtomic(value, allowZero = false) {
  if (typeof value !== 'string' || value.length > 78 || !/^(?:0|[1-9]\d*)$/.test(value)) return null;
  const result = BigInt(value);
  return result <= MAX_UINT256 && (allowZero || result > 0n) ? result : null;
}

export function personalCompanyPaymentAmountAtomic(value) {
  if (typeof value !== 'string' || value.length > 86 || !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const result = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  return result > 0n && result <= MAX_UINT256 ? result.toString() : null;
}

export function formatPersonalCompanyPaymentAmount(value) {
  const amount = personalCompanyPaymentAtomic(value, true);
  if (amount === null) throw new Error('personal_company_invalid_amount');
  const fraction = (amount % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return `${amount / 1_000_000n}${fraction ? `.${fraction}` : ''}`;
}
