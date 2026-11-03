import test from "node:test";
import assert from "node:assert/strict";
import { createMemberNetworkReader, memberTreeUrl } from "./member-network-reader.mjs";
import { treeRefreshFailure } from "./tree-read-model.mjs";

const summary = { wallet_balance_usd: "0", available_for_withdrawal_usd: "0", commission_available_usd: "0", commission_maturing_usd: "0", active_packages: 0, payments: [] };
const tree = { positioned: true, me: { affiliateId: "101" }, tree: [] };
const referral = { positioned: false };
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const dataFor = url => url.includes("/tree?") ? tree : url.includes("/payments/") ? summary : referral;
function setup(options = {}) {
  const parts = []; const sync = []; const denied = []; const starts = [];
  const reader = createMemberNetworkReader({ onPart: (key, result) => parts.push([key, result]), onSync: value => sync.push(value),
    onDenied: error => denied.push(error), onStart: full => starts.push(full), ...options });
  return { reader, parts, sync, denied, starts };
}

test("initial network reads run in parallel; depth changes request only the tree (3 → 1)", async () => {
  const calls = [];
  const { reader, starts } = setup({ read: async (url, { validate }) => { calls.push(url); const data = dataFor(url); assert.equal(validate(data), true); return data; } });
  await reader.refresh("4");
  assert.equal(calls.length, 3);
  await reader.changeDepth("6");
  assert.equal(calls.length, 4); assert.equal(calls[3], memberTreeUrl("6"));
  assert.deepEqual(starts, [true, false]);
  await reader.refresh("6"); assert.equal(calls.length, 7);
  reader.dispose();
});

test("tree publishes before a slow wallet and changing depth does not restart auxiliaries", async () => {
  const wallet = deferred(); const calls = [];
  const { reader, parts } = setup({ read: async url => { calls.push(url); return url.includes("/payments/") ? wallet.promise : dataFor(url); } });
  const initial = reader.refresh(); await tick();
  assert.equal(parts.some(([key]) => key === "tree"), true); assert.equal(parts.some(([key]) => key === "summary"), false);
  await reader.changeDepth("8");
  assert.equal(calls.filter(url => url.includes("/payments/")).length, 1);
  assert.equal(calls.filter(url => url.includes("/referral")).length, 1);
  wallet.resolve(summary); await initial; reader.dispose();
});

test("a superseded depth response cannot overwrite the newest tree", async () => {
  const old = deferred(); let oldSignal;
  const { reader, parts } = setup({ read: async (url, { signal }) => {
    if (url === memberTreeUrl("4")) { oldSignal = signal; return old.promise; }
    return dataFor(url);
  } });
  const initial = reader.refresh("4"); await tick();
  await reader.changeDepth("6"); assert.equal(oldSignal.aborted, true);
  old.resolve({ ...tree, me: { affiliateId: "old" } }); await initial;
  assert.equal(parts.filter(([key]) => key === "tree").length, 1);
  assert.equal(parts.find(([key]) => key === "tree")[1].data.me.affiliateId, "101");
  reader.dispose();
});

for (const status of [401, 403]) test(`HTTP ${status} cancels all reads and clears the entire private view`, async () => {
  const wallet = deferred(); const links = deferred(); const signals = []; const error = Object.assign(new Error("Acceso denegado"), { status });
  let state = { data: tree, summary, referral, summaryError: "old", referralError: "old" };
  const { reader, parts, denied } = setup({
    read: async (url, { signal }) => { signals.push(signal); return url.includes("/payments/") ? wallet.promise : url.includes("/referral") ? links.promise : tree; },
    onDenied: reason => { denied.push(reason); state = treeRefreshFailure(state, reason.status, reason.message); },
  });
  const initial = reader.refresh(); await tick();
  wallet.reject(error); await tick();
  assert.equal(signals.slice(1).every(signal => signal.aborted), true);
  links.resolve(referral); await initial;
  assert.equal(denied.length, 1); assert.equal(parts.some(([key]) => key === "referral"), false);
  assert.equal(state.data, null); assert.equal(state.summary, null); assert.equal(state.referral, null);
  const count = parts.length; await reader.changeDepth("6"); assert.equal(parts.length, count);
  reader.dispose();
});

test("post-payment polling remains bounded, refreshes membership evidence, and stops after placement", async () => {
  const calls = []; const scheduled = []; let placed = false;
  const { reader, sync } = setup({ read: async url => {
    calls.push(url);
    return url.includes("/tree?") ? placed ? tree : { positioned: false } : url.includes("/payments/") ? { ...summary, active_packages: 1 } : referral;
  }, schedule: callback => { scheduled.push(callback); return callback; }, unschedule: () => {}, maxTries: 2 });
  await reader.refresh(); assert.equal(scheduled.length, 1); assert.equal(sync.at(-1), true);
  placed = true; scheduled[0](); await tick();
  assert.equal(calls.length, 6); assert.ok(calls.includes("/api/payments/me?fresh=1"));
  assert.equal(scheduled.length, 1); assert.equal(sync.at(-1), false);
  reader.dispose();
});

test("post-payment polling stops at its attempt bound and is cancelled on unmount", async () => {
  const scheduled = []; const removed = [];
  const options = { read: async url => url.includes("/tree?") ? { positioned: false } : url.includes("/payments/") ? { ...summary, active_packages: 1 } : referral,
    schedule: callback => { scheduled.push(callback); return callback; }, unschedule: timer => removed.push(timer), maxTries: 2 };
  const { reader, sync } = setup(options);
  await reader.refresh(); assert.equal(scheduled.length, 1);
  scheduled[0](); await tick();
  assert.equal(scheduled.length, 1); assert.equal(sync.at(-1), false);
  await reader.refresh(); assert.equal(scheduled.length, 2);
  reader.dispose(); assert.deepEqual(removed, [scheduled[1]]);
  const scheduledCount = scheduled.length;
  scheduled[1](); await tick(); assert.equal(scheduled.length, scheduledCount);
});

test("a complete refresh cancels every pending old part; none can publish into the new cycle", async () => {
  const old = [deferred(), deferred(), deferred()]; const signals = []; let calls = 0;
  const { reader, parts } = setup({ read: async (url, { signal }) => {
    const index = calls++; signals.push(signal); return index < 3 ? old[index].promise : dataFor(url);
  } });
  const initial = reader.refresh("4");
  await reader.refresh("6");
  assert.equal(signals.slice(0, 3).every(signal => signal.aborted), true);
  old.forEach((request, index) => request.resolve(index === 0 ? { ...tree, me: { affiliateId: "old" } } : index === 1 ? summary : referral));
  await initial;
  assert.equal(parts.length, 3);
  assert.equal(parts.find(([key]) => key === "tree")[1].data.me.affiliateId, "101");
  reader.dispose();
});

test("manual-placement payments do not poll and unmount ignores late transport responses", async () => {
  const scheduled = []; const pending = deferred(); let signal;
  const { reader, parts } = setup({ read: async (url, options) => {
    if (url === memberTreeUrl("6")) { signal = options.signal; return pending.promise; }
    return url.includes("/tree?") ? { positioned: false } : url.includes("/payments/") ? { ...summary, payments: [{ status: "needs_placement" }] } : referral;
  }, schedule: callback => scheduled.push(callback) });
  await reader.refresh(); assert.equal(scheduled.length, 0);
  const depth = reader.changeDepth("6"); reader.dispose();
  assert.equal(signal.aborted, true); const count = parts.length;
  pending.resolve(tree); await depth; assert.equal(parts.length, count);
});
