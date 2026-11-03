import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectStaticCacheAssets, generateStaticCacheHeaders, prepareStaticCacheHeaders } from '../../scripts/prepare-static-cache-headers.mjs';

function fixture(t, files) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mindbliss-cache-headers-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const assets = join(root, 'assets');
  mkdirSync(assets);
  for (const path of files) {
    const destination = join(assets, ...path.split('/'));
    mkdirSync(join(destination, '..'), { recursive: true });
    writeFileSync(destination, 'synthetic public fixture');
  }
  return { root, assets };
}

test('only exact existing public build files get cache rules; no wildcard or private namespace rules', t => {
  const { assets } = fixture(t, ['_headers', 'BUILD_ID', 'robots.txt', 'index.html',
    '_next/static/chunks/hash.js', '_next/static/chunks/hash.css', '_next/static/build/_buildManifest.js',
    '_next/static/media/font.woff2', 'fonts/font.woff2', 'fonts/README.md', 'fonts/OFL.txt', 'mindbliss/logo.png']);
  const result = prepareStaticCacheHeaders(assets);
  assert.equal(result.rules, 8);
  const output = readFileSync(join(assets, '_headers'), 'utf8');
  const rules = output.split('\n').filter(line => line.startsWith('/'));
  assert.deepEqual(rules, ['/_next/static/build/_buildManifest.js', '/_next/static/chunks/hash.css',
    '/_next/static/chunks/hash.js', '/_next/static/media/font.woff2', '/fonts/OFL.txt', '/fonts/README.md',
    '/fonts/font.woff2', '/mindbliss/logo.png']);
  assert.match(output, /\/_next\/static\/chunks\/hash\.js\n {2}Cache-Control: public, max-age=31536000, immutable/);
  assert.match(output, /\/fonts\/OFL\.txt\n {2}Cache-Control: public, max-age=3600, must-revalidate/);
  assert.match(output, /\/mindbliss\/logo\.png\n {2}Cache-Control: public, max-age=3600, must-revalidate/);
  assert.doesNotMatch(output, /\*|\/index\.html|\/robots\.txt|\/BUILD_ID|\/_headers/);
  for (const line of output.split('\n')) assert.ok(line.length <= 2000);
});

test('missing static-looking paths have no matching header rule and cannot inherit an immutable 404 TTL', t => {
  const { assets } = fixture(t, ['_next/static/chunks/present.js', 'mindbliss/logo.png']);
  prepareStaticCacheHeaders(assets);
  const paths = readFileSync(join(assets, '_headers'), 'utf8').split('\n').filter(line => line.startsWith('/'));
  for (const path of ['/_next/static/chunks/missing.js', '/mindbliss/missing.png', '/api/member/summary.css',
    '/api/auth/session', '/dashboard', '/_next/static/chunks/present.js/extra']) {
    assert.equal(paths.includes(path), false);
  }
  assert.equal(paths.includes('/_next/static/chunks/present.js'), true);
});

test('manifest output is deterministic, deduplicated and bounded to 100 rules', () => {
  const paths = Array.from({ length: 100 }, (_, index) => '_next/static/chunks/hash-' + index + '.js');
  const output = generateStaticCacheHeaders(paths.concat(paths).reverse());
  assert.equal(output.split('\n').filter(line => line.startsWith('/')).length, 100);
  assert.equal(output, generateStaticCacheHeaders(paths));
  assert.throws(() => generateStaticCacheHeaders(paths.concat('_next/static/chunks/overflow.js')), /rule_limit_exceeded_101_maximum_100/);
  assert.throws(() => generateStaticCacheHeaders(['_next/static/' + 'a'.repeat(2000) + '.js']), /line_limit_exceeded/);
});

test('wildcards, placeholders, encoded paths, traversal, control characters and absolute paths fail closed', () => {
  for (const path of ['_next/static/*.js', '_next/static/:name.js', '_next/static/%2e%2e/api.js',
    '_next/static/../file.js', '_next/static//file.js', '_next/static/./file.js', '/_next/static/file.js',
    '_next/static/file.js\n/api/auth/session', '_next/static/file.js\r', '_next\\static\\file.js',
    '_next/static/file.js?member=synthetic', '_next/static/file.js#fragment', '_next/static/unicode-ñ.js', null]) {
    assert.throws(() => generateStaticCacheHeaders([path]), /unsafe_asset_path/);
  }
});

test('HTML, RSC, JSON, source maps, env files, database dumps and key material cannot get public rules', () => {
  for (const path of ['_next/static/private.html', '_next/static/private.rsc', '_next/static/profile.json',
    '_next/static/chunks/code.js.map', 'mindbliss/private.html', 'fonts/private.rsc',
    '_next/static/.env.local', '_next/static/.dev.vars', 'mindbliss/recovery.dump', 'fonts/private.key',
    'fonts/database.sql', 'fonts/database.db', 'mindbliss/credential.pem']) {
    assert.throws(() => generateStaticCacheHeaders([path]), /private_asset_type|unsupported_public_asset_type/);
  }
});

test('private API/dashboard/auth/upload/report namespaces anywhere in uploaded assets fail the build', t => {
  for (const path of ['api/member/summary.css', 'dashboard/private.html', 'auth/token.js',
    'uploads/member.png', 'reportes/ventas.csv', 'reports/members.csv', '_next/static/auth/session.js']) {
    assert.throws(() => generateStaticCacheHeaders([path]), /private_asset_namespace/);
  }
  const { assets } = fixture(t, ['api/member/summary.css', '_next/static/chunks/hash.js']);
  assert.throws(() => prepareStaticCacheHeaders(assets), /private_asset_namespace/);
});

test('files outside the public cache prefixes never get a rule', () => {
  assert.equal(generateStaticCacheHeaders(['BUILD_ID', 'index.html', 'robots.txt', 'other/file.css'])
    .split('\n').filter(line => line.startsWith('/')).length, 0);
});

test('collector rejects symlinks even outside cached prefixes and refuses an aliased asset directory', t => {
  const { root, assets } = fixture(t, ['_next/static/chunks/hash.js']);
  const external = join(root, 'outside');
  mkdirSync(external);
  symlinkSync(external, join(assets, 'untrusted-link'), 'junction');
  assert.throws(() => collectStaticCacheAssets(assets), /symlink_in_assets/);
  const alias = join(root, 'alias');
  symlinkSync(assets, alias, 'junction');
  assert.throws(() => collectStaticCacheAssets(alias), /unsafe_assets_directory/);
});

test('an existing headers symlink is never followed or overwritten', t => {
  const { root, assets } = fixture(t, ['_next/static/chunks/hash.js']);
  const external = join(root, 'outside');
  mkdirSync(external);
  symlinkSync(external, join(assets, '_headers'), 'junction');
  assert.throws(() => prepareStaticCacheHeaders(assets), /symlink_in_assets|unsafe_headers_target/);
});

test('failed validation does not replace an existing header file', t => {
  const { assets } = fixture(t, ['_headers', '_next/static/private.html']);
  const before = readFileSync(join(assets, '_headers'), 'utf8');
  assert.throws(() => prepareStaticCacheHeaders(assets), /unsupported_public_asset_type/);
  assert.equal(readFileSync(join(assets, '_headers'), 'utf8'), before);
});

test('CLI refuses any directory/output override before writing', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../scripts/prepare-static-cache-headers.mjs', import.meta.url)), '--output', '/not-allowed'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /static_cache_headers:cli_arguments_not_supported/);
});

test('real Miniflare AssetRouter caches only present files; missing/encoded assets never inherit a long TTL', { timeout: 60_000 }, async t => {
  const { Miniflare, convertV4MiniflareOptions } = await import('miniflare');
  const { assets } = fixture(t, ['_next/static/chunks/present.js', 'mindbliss/logo.png', 'fonts/font.woff2', 'fonts/OFL.txt']);
  prepareStaticCacheHeaders(assets);
  let externalCalls = 0;
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'exact-cache-policy-fixture',
    modules: true,
    script: 'export default { fetch() { return new Response("worker-private", { status: 404, headers: { "Cache-Control": "private, no-store", "CDN-Cache-Control": "no-store" } }); } };',
    compatibilityDate: '2026-10-25',
    assets: {
      directory: assets,
      binding: 'ASSETS',
      routerConfig: { has_user_worker: true },
      run_worker_first: ['/*', '!/_next/static/*', '!/fonts/*', '!/mindbliss/*'],
    },
    outboundService() { externalCalls++; throw new Error('external_network_forbidden'); },
    cf: false,
  }));
  try {
    for (const [path, expected] of [['/_next/static/chunks/present.js', 'public, max-age=31536000, immutable'],
      ['/mindbliss/logo.png', 'public, max-age=3600, must-revalidate'],
      ['/fonts/font.woff2', 'public, max-age=3600, must-revalidate'],
      ['/fonts/OFL.txt', 'public, max-age=3600, must-revalidate']]) {
      const response = await mf.dispatchFetch('https://cache.example.test' + path, { headers: { cookie: 'session=synthetic' } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), expected);
      assert.equal(response.headers.get('cdn-cache-control'), null, 'uploaded files bypass the private Worker');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const etag = response.headers.get('etag');
      assert.ok(etag);
      await response.arrayBuffer();
      const conditional = await mf.dispatchFetch('https://cache.example.test' + path, { method: 'HEAD', headers: { 'If-None-Match': etag } });
      assert.equal(conditional.status, 304);
    }
    for (const path of ['/_next/static/chunks/missing.js', '/mindbliss/missing.png', '/fonts/missing.woff2',
      '/_next/static/%252e%252e%252fapi/auth/session', '/mindbliss/%2f..%2fapi/member/summary.css']) {
      const response = await mf.dispatchFetch('https://cache.example.test' + path);
      assert.equal(response.status, 404);
      assert.doesNotMatch(response.headers.get('cache-control') || '', /immutable|max-age=[1-9]/);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(response.headers.get('location'), null);
      assert.equal(await response.text(), '', 'a missing asset cannot contain a private application response');
    }
    for (const path of ['/api/member/summary.css', '/api/auth/session', '/dashboard',
      '/_next/static/%2e%2e/%2e%2e/api/auth/session', '/%5fnext/static/chunks/present.js']) {
      const response = await mf.dispatchFetch('https://cache.example.test' + path);
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
      assert.equal(await response.text(), 'worker-private');
    }
    assert.equal(externalCalls, 0);
  } finally {
    await mf.dispose();
  }
});
