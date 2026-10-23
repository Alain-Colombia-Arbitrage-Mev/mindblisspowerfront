import { test } from 'node:test';
import assert from 'node:assert/strict';

let sequence = 0;

async function loadParams(browser) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  try {
    if (browser) {
      globalThis.window = browser;
      globalThis.document = { title: 'Mindbliss' };
    } else {
      delete globalThis.window;
      delete globalThis.document;
    }
    const module = await import(`./app-params.js?test=${sequence++}`);
    return module.appParams;
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

function browserFor(url) {
  const values = new Map();
  const browser = {
    location: new URL(url),
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
    history: {
      replaceState: (_state, _title, path) => {
        browser.location = new URL(path, browser.location);
      },
    },
  };
  return browser;
}

test('legacy app parameters can be imported during SSR without Vite globals', async () => {
  const params = await loadParams();
  assert.equal(params.token, undefined);
  assert.equal(params.fromUrl, undefined);
});

test('browser parameters work in Next.js and remove the access token from the URL', async () => {
  const browser = browserFor('https://app.test/dashboard?app_id=legacy&access_token=test-token#team');
  const params = await loadParams(browser);
  assert.equal(params.appId, 'legacy');
  assert.equal(params.token, 'test-token');
  assert.equal(browser.location.searchParams.has('access_token'), false);
  assert.equal(browser.location.hash, '#team');
  assert.equal(browser.localStorage.getItem('base44_access_token'), 'test-token');
});

test('blocked browser storage does not crash parameter resolution', async () => {
  const browser = browserFor('https://app.test/dashboard?app_id=legacy');
  Object.defineProperty(browser, 'localStorage', {
    get() { throw new Error('Storage is disabled'); },
  });
  const params = await loadParams(browser);
  assert.equal(params.appId, 'legacy');
  assert.equal(params.token, null);
});

test('clearing a legacy token removes both stored token keys', async () => {
  const browser = browserFor('https://app.test/dashboard?clear_access_token=true');
  browser.localStorage.setItem('base44_access_token', 'old-token');
  browser.localStorage.setItem('token', 'old-token');
  const params = await loadParams(browser);
  assert.equal(params.token, null);
  assert.equal(browser.localStorage.getItem('token'), null);
});
