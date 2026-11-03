import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Run the real hook with a deterministic clock. No network, browser storage,
// credentials or actual waiting; missed timer callbacks are intentional.
function fixture(t) {
  let now = 1_000_000, stateIndex = 0, effectIndex = 0, refIndex = 0;
  const state = [], effects = [], refs = [], queued = [], timers = new Set();
  const browser = new EventTarget(), document = new EventTarget();
  const previousWindow = globalThis.window, previousDocument = globalThis.document;
  globalThis.window = browser; globalThis.document = document;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  });
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', callback => { timers.add(callback); return callback; });
  t.mock.method(globalThis, 'clearInterval', callback => timers.delete(callback));
  t.mock.method(globalThis, 'fetch', () => assert.fail('a cooldown must never send a message'));
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef(initial) { const index = refIndex++; return refs[index] ||= { current: initial }; },
    useCallback(callback) { return callback; },
    useEffect(effect, dependencies) {
      const index = effectIndex++, previous = effects[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) queued.push(() => {
        previous?.cleanup?.(); effects[index] = { dependencies, cleanup: effect() };
      });
    },
  };
  const source = readFileSync(new URL('./useResendCooldown.js', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.equal(name, 'react'); return react;
  }, module, module.exports);
  const render = (seconds = 300, recipient = '') => {
    stateIndex = 0; effectIndex = 0; refIndex = 0;
    const value = module.exports.useResendCooldown(seconds, recipient);
    while (queued.length) queued.shift()();
    return value;
  };
  const unmount = () => { for (const effect of effects) effect?.cleanup?.(); };
  t.after(unmount);
  return { render, browser, document, timers, unmount,
    advance(milliseconds) { now += milliseconds; }, tick() { for (const callback of timers) callback(); } };
}

test('cooldown starts inactive, keeps labels and reconciles elapsed time rather than counting ticks', t => {
  const app = fixture(t);
  let value = app.render();
  assert.equal(value.active, false); assert.equal(value.label, ''); assert.equal(value.remaining, 0);
  value.start(); value = app.render();
  assert.equal(value.remaining, 300); assert.equal(value.label, 'Reenviar en 5:00');
  app.advance(2_100); app.tick(); value = app.render();
  assert.equal(value.remaining, 298); assert.equal(value.label, 'Reenviar en 4:58');
  app.advance(600_000); app.tick(); value = app.render();
  assert.equal(value.remaining, 0); assert.equal(value.active, false); assert.equal(value.label, '');
  assert.equal(app.timers.size, 0);
});

for (const event of ['visibilitychange', 'focus', 'pageshow']) test(`cooldown expires on ${event} after a suspended tab without any timer callback`, t => {
  const app = fixture(t); app.render().start(600); app.render();
  app.advance(600_001);
  (event === 'visibilitychange' ? app.document : app.browser).dispatchEvent(new Event(event));
  const value = app.render();
  assert.equal(value.active, false); assert.equal(value.remaining, 0); assert.equal(app.timers.size, 0);
});

test('a longer Retry-After is respected and repeated start cannot shorten an existing deadline', t => {
  const app = fixture(t); app.render().start(600); app.render();
  app.advance(50_000); app.render().start(10);
  assert.equal(app.render().remaining, 550);
  app.advance(20_000); app.render().start(900);
  assert.equal(app.render().remaining, 900);
});

test('recipient scopes are memory-only and returning to the first email preserves its remaining budget', t => {
  const app = fixture(t);
  app.render(300, 'first@example.test').start(); app.render(300, 'first@example.test');
  assert.equal(app.render(300, 'second@example.test').active, false);
  app.render(300, 'second@example.test').start(600); app.render(300, 'second@example.test');
  app.advance(100_000); app.tick();
  assert.equal(app.render(300, 'first@example.test').remaining, 200);
  assert.equal(app.render(300, 'second@example.test').remaining, 500);
  app.render(300, '__proto__').start(45);
  assert.equal(app.render(300, '__proto__').remaining, 45);
  assert.equal(app.render(300, '').active, false);
});

for (const retry of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 'bad', '']) test(`invalid Retry-After ${String(retry)} uses the configured duration`, t => {
  const app = fixture(t); app.render(45).start(retry);
  assert.equal(app.render(45).remaining, 45);
});

test('fractional waits round up to a complete second', t => {
  const app = fixture(t); app.render().start(1.2);
  assert.equal(app.render().remaining, 2);
});

test('unmount removes timers and visibility listeners without touching storage or sending', t => {
  const app = fixture(t); app.render().start(); app.render();
  assert.equal(app.timers.size, 1);
  app.unmount(); assert.equal(app.timers.size, 0);
  app.advance(100_000); app.browser.dispatchEvent(new Event('focus'));
  assert.equal(app.render().remaining, 300);
});
