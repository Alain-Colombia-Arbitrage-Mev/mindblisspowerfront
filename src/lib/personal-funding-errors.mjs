// Recovery categories only; raw provider errors never reach the interface.
export function personalFundingFailure(error, phase = 'checkout') {
  const code = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  if (error?.name === 'AbortError') return 'cancelled';
  if (code.includes('wallet_already_linked') || code.includes('wallet_address_mismatch') || code.includes('wallet_address_in_use')) return 'mismatch';
  if (code.includes('unauthenticated')) return 'session';
  if (code.includes('invalid_origin')) return 'origin';
  if (code.includes('user rejected') || code.includes('action_rejected') || code.includes('denied')) return 'rejected';
  if (code.includes('wallet_identity_unavailable')) return 'identity';
  if (code.includes('wallet_link_rate_limited') || code.includes('wallet_funding_rate_limited')) return 'rate_limited';
  if (code.includes('wallet_not_connected') || code.includes('provider is undefined')) return 'connection';
  if (code.includes('reown_unavailable')) return 'configuration';
  if (code === 'wallet_funding_valuation_unavailable') return 'valuation';
  if (code.includes('method_unavailable') || code.includes('invalid_country') || code.includes('amount_unavailable') || code.includes('amount_out_of_range')) return 'method';
  if (phase === 'link') return 'link_unavailable';
  if (phase === 'intent') return 'intent';
  return 'provider';
}
