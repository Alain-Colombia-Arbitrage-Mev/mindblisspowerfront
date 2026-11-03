// Repeatable build-artifact metric, not a browser LCP or network-speed score.
// Counts unique JS chunks referenced by each route's client manifest, including
// shared application chunks but excluding framework bootstrap. Does not read
// credentials, invoke APIs or access private data.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gzipSync } from 'node:zlib';

const root = path.resolve(process.argv[2] || '.');
const routes = process.argv.slice(3);
if (!routes.length) routes.push('/login', '/register', '/dashboard', '/dashboard/profile', '/dashboard/payments', '/dashboard/support', '/dashboard/network');
const sizes = new Map();
const output = [];
for (const route of routes) {
  if (!/^\/[a-z0-9/-]*$/.test(route) || route.includes('..')) throw new Error('Invalid metric route');
  const filename = path.join(root, '.next/server/app', route.slice(1), 'page_client-reference-manifest.js');
  if (!existsSync(filename)) { output.push({ route, unavailable: true }); continue; }
  const context = {};
  vm.runInNewContext(readFileSync(filename, 'utf8'), context, { timeout: 1000 });
  const manifest = Object.values(context.__RSC_MANIFEST || {})[0];
  const chunks = [...new Set(Object.values(manifest?.clientModules || {}).flatMap(entry => entry.chunks || []))]
    .filter(chunk => typeof chunk === 'string' && chunk.endsWith('.js'));
  let bytes = 0;
  let gzipBytes = 0;
  for (const chunk of chunks) {
    const relative = chunk.replace(/^\/?_next\//, '');
    const target = path.resolve(root, '.next', relative);
    if (!target.startsWith(path.resolve(root, '.next') + path.sep)) throw new Error('Invalid chunk path');
    if (!sizes.has(target)) {
      const data = readFileSync(target);
      sizes.set(target, { bytes: data.length, gzipBytes: gzipSync(data, { level: 9 }).length });
    }
    bytes += sizes.get(target).bytes;
    gzipBytes += sizes.get(target).gzipBytes;
  }
  output.push({ route, chunks: chunks.length, bytes, gzipBytes });
}
console.log(JSON.stringify({ metric: 'unique route client-reference JS (framework bootstrap excluded)', routes: output }, null, 2));
