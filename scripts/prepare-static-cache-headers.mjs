import { lstatSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MAX_STATIC_CACHE_RULES = 100;
export const MAX_STATIC_CACHE_HEADER_LINE = 2000;

const knownRoots = new Set(['_next', 'fonts', 'mindbliss']);
const privateNamespaces = new Set(['api', 'dashboard', 'auth', 'uploads', 'reports', 'reportes']);
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico'];
const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
const nextExtensions = new Set(['.js', '.mjs', '.css', '.txt', ...imageExtensions, ...fontExtensions]);
const publicFontExtensions = new Set([...fontExtensions, '.txt', '.md']);
const publicImageExtensions = new Set(imageExtensions);
const privateExtension = /\.(?:db|sqlite|sqlite3|dump|backup|bak|pem|key|p12|pfx|sql)$/i;

function fail(code) {
  throw new Error('static_cache_headers:' + code);
}

function validatePath(path) {
  if (typeof path !== 'string' || !path || !/^[A-Za-z0-9_./+@,-]+$/.test(path)
    || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) {
    fail('unsafe_asset_path');
  }
  const segments = path.split('/');
  if (segments.some(segment => privateNamespaces.has(segment.toLowerCase()))) fail('private_asset_namespace');
  if (segments.some(segment => /^\.(?:env|dev\.vars)(?:\.|$)/i.test(segment)) || privateExtension.test(path)) {
    fail('private_asset_type');
  }
  return segments;
}

function policyFor(path) {
  const segments = validatePath(path);
  let extensions;
  let cacheControl;
  if (segments[0] === '_next' && segments[1] === 'static' && segments.length > 2) {
    extensions = nextExtensions;
    cacheControl = 'public, max-age=31536000, immutable';
  } else if (segments[0] === 'fonts' && segments.length > 1) {
    extensions = publicFontExtensions;
    cacheControl = 'public, max-age=3600, must-revalidate';
  } else if (segments[0] === 'mindbliss' && segments.length > 1) {
    extensions = publicImageExtensions;
    cacheControl = 'public, max-age=3600, must-revalidate';
  } else {
    return null;
  }
  // HTML, RSC, JSON, source maps and unknown files require an explicit review,
  // never an accidental long public TTL because of their directory alone.
  if (!extensions.has(extname(path).toLowerCase()) || segments.some(segment => segment.startsWith('.'))) {
    fail('unsupported_public_asset_type');
  }
  return cacheControl;
}

// Pure manifest generation. Paths must name existing uploaded files supplied by
// the filesystem collector, not URL prefixes or extension wildcards.
export function generateStaticCacheHeaders(assetPaths) {
  if (!Array.isArray(assetPaths)) fail('invalid_asset_manifest');
  const rules = [];
  for (const path of [...new Set(assetPaths)].sort()) {
    const cacheControl = policyFor(path);
    if (cacheControl) rules.push('/' + path + '\n  Cache-Control: ' + cacheControl + '\n  X-Content-Type-Options: nosniff');
  }
  if (rules.length > MAX_STATIC_CACHE_RULES) fail('rule_limit_exceeded_' + rules.length + '_maximum_' + MAX_STATIC_CACHE_RULES);
  const output = '# Generated from existing public build assets only. Do not edit.\n\n' + rules.join('\n\n') + '\n';
  if (output.split('\n').some(line => line.length > MAX_STATIC_CACHE_HEADER_LINE)) fail('line_limit_exceeded');
  return output;
}

export function collectStaticCacheAssets(assetsDirectory) {
  const root = resolve(assetsDirectory);
  const rootStat = lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink() || realpathSync(root) !== root) fail('unsafe_assets_directory');
  const files = [];
  function visit(relative = '') {
    const directory = relative ? join(root, ...relative.split('/')) : root;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = relative ? relative + '/' + entry.name : entry.name;
      // Scan every namespace, including ignored roots: a private directory must
      // not silently enter the uploaded assets while this file is generated.
      const segments = validatePath(path);
      if (entry.isSymbolicLink()) fail('symlink_in_assets');
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile()) {
        if (knownRoots.has(segments[0])) files.push(path);
      } else {
        fail('unsupported_filesystem_entry');
      }
    }
  }
  visit();
  return files;
}

export function prepareStaticCacheHeaders(assetsDirectory) {
  const root = resolve(assetsDirectory);
  const assets = collectStaticCacheAssets(root);
  const output = generateStaticCacheHeaders(assets);
  const destination = join(root, '_headers');
  try {
    const stat = lstatSync(destination);
    if (!stat.isFile() || stat.isSymbolicLink()) fail('unsafe_headers_target');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  writeFileSync(destination, output, { encoding: 'utf8' });
  return { rules: output.split('\n').filter(line => line.startsWith('/')).length };
}

// CLI has no output-directory override: it can only replace this repository's
// generated .open-next/assets/_headers after OpenNext has finished successfully.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 2) fail('cli_arguments_not_supported');
    const target = fileURLToPath(new URL('../.open-next/assets/', import.meta.url));
    const result = prepareStaticCacheHeaders(target);
    console.log('Prepared exact static cache headers: ' + result.rules + ' rules (maximum ' + MAX_STATIC_CACHE_RULES + ').');
  } catch (error) {
    console.error(error.message?.startsWith('static_cache_headers:') ? error.message : 'static_cache_headers:build_assets_unavailable');
    process.exitCode = 1;
  }
}
