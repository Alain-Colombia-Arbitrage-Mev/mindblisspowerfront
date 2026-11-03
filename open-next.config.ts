import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// No persistent ISR/R2/KV cache is provisioned. Auth, tree and balances are fresh.
export default defineCloudflareConfig({
  incrementalCache: 'dummy', tagCache: 'dummy', queue: 'dummy',
  enableCacheInterception: false,
});
