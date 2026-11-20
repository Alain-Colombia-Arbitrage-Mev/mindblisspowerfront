import { appMeldDestinationFor } from './app-meld-wallet-catalogue.mjs';
import { personalWalletBalanceToken } from './personal-wallet-balance.mjs';

export const APP_WALLET_DEPOSIT_CODES = Object.freeze(['USDC_POLYGON', 'USDC_ARBITRUM', 'USDC', 'USDT_POLYGON']);

/** ERC-681 transfer request. The sending wallet prompts for the amount. */
export function appWalletDepositUri(address, destinationCurrencyCode = 'USDC_POLYGON') {
  if (typeof address !== 'string' || !/^0x[0-9a-f]{40}$/i.test(address) || /^0x0{40}$/i.test(address)
    || !APP_WALLET_DEPOSIT_CODES.includes(destinationCurrencyCode)) return '';
  const destination = appMeldDestinationFor(destinationCurrencyCode);
  const token = personalWalletBalanceToken(destination.network, destination.asset);
  if (!token || token.chainId !== destination.chainId) return '';
  return `ethereum:${token.tokenAddress}@${token.chainId}/transfer?address=${address.toLowerCase()}`;
}
