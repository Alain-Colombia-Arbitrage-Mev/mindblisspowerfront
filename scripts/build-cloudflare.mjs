import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const projectKeys = ['REOWN_PROJECT_ID', 'NEXT_PUBLIC_REOWN_PROJECT_ID'];
const projectPattern = /^[a-f0-9]{32}$/i;
const repo = fileURLToPath(new URL('../', import.meta.url));
const smokeImage = 'mindbliss/portal-worker-test:local';

function checkedProjectId(values, source) {
  const configured = projectKeys.map(key => values[key]).filter(value => value !== undefined && value !== '');
  if (configured.some(value => typeof value !== 'string' || !projectPattern.test(value))) {
    throw new Error(`Invalid public Reown project ID in ${source}; expected 32 hexadecimal characters.`);
  }
  if (new Set(configured.map(value => value.toLowerCase())).size > 1) {
    throw new Error(`Conflicting public Reown project IDs in ${source}.`);
  }
  return configured[0];
}

function projectIdFromFile(url, source) {
  let content;
  try { content = readFileSync(url, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  const values = {};
  // Read only these two public identifiers. Never evaluate/load dotenv files
  // into process.env or forward any unrelated local credentials to Docker.
  for (const line of content.split(/\r?\n/)) {
    const entry = /^\s*(?:export\s+)?(REOWN_PROJECT_ID|NEXT_PUBLIC_REOWN_PROJECT_ID)\s*=\s*(.*?)\s*$/.exec(line);
    if (!entry) continue;
    const [, key, raw] = entry;
    if (!raw || raw === '""' || raw === "''" || raw.startsWith('#')) continue;
    const value = /^(?:"([a-f0-9]{32})"|'([a-f0-9]{32})'|([a-f0-9]{32}))(?:\s+#.*)?$/i.exec(raw);
    if (!value) throw new Error(`Invalid public Reown project ID in ${source}; expected 32 hexadecimal characters.`);
    const parsed = value[1] || value[2] || value[3];
    if (values[key] && values[key].toLowerCase() !== parsed.toLowerCase()) throw new Error(`Conflicting public Reown project IDs in ${source}.`);
    values[key] = parsed;
  }
  return checkedProjectId(values, source);
}

function runDocker(args) {
  const result = spawnSync('docker', args, { cwd: repo, stdio: 'inherit', shell: false });
  if (result.error) throw new Error('Docker could not start. Check that Docker Desktop is running.');
  if (result.status !== 0) process.exit(result.status || 1);
}

try {
  const smoke = process.argv.length === 3 && process.argv[2] === '--smoke';
  if (process.argv.length > 2 && !smoke) throw new Error('Usage: node scripts/build-cloudflare.mjs [--smoke]');
  const projectId = checkedProjectId(Object.fromEntries(projectKeys.map(key => [key, process.env[key]])), 'process environment')
    || projectIdFromFile(new URL('../.env.local', import.meta.url), 'frontend .env.local')
    || projectIdFromFile(new URL('../../backend/.env.local', import.meta.url), 'backend .env.local');
  if (!projectId) throw new Error('Reown project ID is missing. Configure REOWN_PROJECT_ID or NEXT_PUBLIC_REOWN_PROJECT_ID before building.');
  console.log('Building Cloudflare with the validated public Reown project ID. Local dotenv files remain excluded.');
  runDocker(['build', '-f', 'Dockerfile.cloudflare', '--build-arg', `NEXT_PUBLIC_REOWN_PROJECT_ID=${projectId}`,
    ...(smoke ? ['--target', 'worker-build', '-t', smokeImage]
      : ['--target', 'worker-artifacts', '--output', 'type=local,dest=.open-next']), '.']);
  if (smoke) runDocker(['run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp', '--tmpfs', '/app/.wrangler',
    smokeImage, 'node', 'scripts/cloudflare-smoke.mjs']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
