export const WALLET_REOWN_ORIGIN = 'https://wallet.mindblisspower.com';
export const WALLET_REOWN_CHAIN_ID = 137;

export function walletReownMetadata(origin, { allowLocal = false } = {}) {
  try {
    const url = new URL(origin);
    const local = allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.origin !== origin || url.username || url.password || (origin !== WALLET_REOWN_ORIGIN && !local)) return null;
    return { name: 'Mindbliss Wallet · Sandbox', description: 'Wallet connection for the Mindbliss sandbox portal',
      url: origin, icons: [`${origin}/mindbliss/mindbliss-favicon.png`] };
  } catch { return null; }
}

export function walletReownConfiguration(projectId, origin, options = {}) {
  const metadata = walletReownMetadata(origin, options);
  if (typeof projectId !== 'string' || !/^[a-f0-9]{32}$/i.test(projectId) || !metadata) return null;
  return { projectId, metadata, defaultAccountTypes: { eip155: 'eoa' },
    enableEIP6963: true, enableInjected: true, enableReconnect: true, enableWallets: true,
    enableNetworkSwitch: false, allowUnsupportedChain: false, allWallets: 'SHOW',
    features: { email: true, socials: ['google', 'apple'], emailShowWallets: true, reownAuthentication: false,
      analytics: true, onramp: false, swaps: false, send: false, receive: false, history: false, pay: false },
    themeMode: 'light', themeVariables: { '--apkt-font-family': 'Manrope, ui-sans-serif, system-ui, sans-serif',
      '--apkt-accent': '#3747cf', '--apkt-color-mix': '#ebf2f4', '--apkt-color-mix-strength': 18, '--apkt-z-index': 10000 } };
}
