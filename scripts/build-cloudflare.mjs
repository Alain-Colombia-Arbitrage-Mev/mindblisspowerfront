import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  console.log('Building the administrative wallet portal. No personal wallet identifier or dotenv file is loaded.');
  runDocker(['build', '-f', 'Dockerfile.cloudflare',
    ...(smoke ? ['--target', 'worker-build', '-t', smokeImage]
      : ['--target', 'worker-artifacts', '--output', 'type=local,dest=.open-next']), '.']);
  if (smoke) runDocker(['run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp', '--tmpfs', '/app/.wrangler',
    smokeImage, 'node', 'scripts/cloudflare-smoke.mjs']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
