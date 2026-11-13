import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const smokeImage = 'mindbliss/administrative-wallet-worker-test:local';
function runDocker(args) {
  const result = spawnSync('docker', args, { cwd: repo, stdio: 'inherit', shell: false });
  if (result.error) throw new Error('Docker could not start. Check that Docker Desktop is running.');
  if (result.status !== 0) process.exit(result.status || 1);
}
try {
  const smoke = process.argv.length === 3 && process.argv[2] === '--smoke';
  if (process.argv.length > 2 && !smoke) throw new Error('Usage: node scripts/build-cloudflare.mjs [--smoke]');
  // Read only this public identifier; do not load any dotenv file into the
  // build process or fall back to the production app's project/merchant.
  let projectId = process.env.NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID || '';
  if (!projectId) {
    try { projectId = readFileSync(new URL('../.env.wallet.local', import.meta.url), 'utf8')
      .match(/^NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID=([a-f0-9]{32})\s*$/im)?.[1] || ''; } catch { /* Explicit configuration is required. */ }
  }
  if (!/^[a-f0-9]{32}$/i.test(projectId)) throw Error('NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID is required for the Wallet sandbox build.');
  console.log('Building Wallet sandbox with its own public Reown project. No private credential enters the build.');
  runDocker(['build', '-f', 'Dockerfile.cloudflare',
    '--build-arg', `NEXT_PUBLIC_WALLET_REOWN_PROJECT_ID=${projectId}`,
    ...(smoke ? ['--target', 'worker-build', '-t', smokeImage]
      : ['--target', 'worker-artifacts', '--output', 'type=local,dest=.open-next']), '.']);
  if (smoke) runDocker(['run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp', '--tmpfs', '/app/.wrangler',
    smokeImage, 'node', 'scripts/cloudflare-smoke.mjs']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
