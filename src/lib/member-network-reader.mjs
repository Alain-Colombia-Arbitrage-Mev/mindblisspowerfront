import { readMemberJson, validMemberTree, validMemberSummary, validMemberReferral } from "./member-read.mjs";

export function memberTreeUrl(depth) {
  const number = Number(depth);
  const limit = depth === "all" ? 5000 : Number.isFinite(number) ? Math.min(5000, Math.max(64, (2 ** (number + 1)) - 2)) : 64;
  return `/api/member/tree?${new URLSearchParams({ depth: String(depth), limit: String(limit) })}`;
}

/** A mounted network page owns these reads; private results never leave it. */
export function createMemberNetworkReader({
  onStart, onPart, onDenied, onSync,
  read = readMemberJson, schedule = setTimeout, unschedule = clearTimeout,
  maxTries = 20, pollDelay = 3000,
}) {
  let active = true;
  let denied = false;
  let depth = "4";
  let tries = 0;
  let timer = null;
  let snapshots = {};
  const requests = new Map();
  const clearTimer = () => { if (timer !== null) unschedule(timer); timer = null; };
  const cancelAll = () => {
    const pending = [...requests.values()];
    requests.clear();
    for (const request of pending) request.controller.abort();
  };
  function maybePoll() {
    if (!active || denied || requests.size || timer !== null) return;
    const { tree, summary } = snapshots;
    const status = summary?.payments?.[0]?.status;
    const paid = Number(summary?.active_packages) > 0 || ["paid", "activated", "needs_placement"].includes(status);
    const shouldPoll = tree?.positioned === false && paid && status !== "needs_placement" && tries < maxTries;
    onSync(shouldPoll);
    if (shouldPoll) timer = schedule(() => {
      timer = null;
      if (!active || denied) return;
      tries++;
      void run(["tree", "summary", "referral"], true);
    }, pollDelay);
  }
  async function start(key, fresh) {
    if (!active || denied) return;
    const previous = requests.get(key);
    previous?.controller.abort();
    const request = { controller: new AbortController() };
    requests.set(key, request);
    const config = {
      tree: { url: memberTreeUrl(depth), validate: validMemberTree },
      summary: { url: `/api/payments/me${fresh ? "?fresh=1" : ""}`, validate: validMemberSummary },
      referral: { url: "/api/member/referral", validate: validMemberReferral },
    }[key];
    try {
      const data = await read(config.url, { signal: request.controller.signal, validate: config.validate });
      if (!active || denied || requests.get(key) !== request || request.controller.signal.aborted) return;
      snapshots[key] = data;
      onPart(key, { data });
    } catch (error) {
      if (!active || denied || requests.get(key) !== request || request.controller.signal.aborted) return;
      if ([401, 403].includes(error.status)) {
        denied = true;
        clearTimer();
        snapshots = {};
        cancelAll();
        onSync(false);
        onDenied(error);
      } else {
        delete snapshots[key];
        onPart(key, { error });
      }
    } finally {
      if (requests.get(key) === request) requests.delete(key);
      maybePoll();
    }
  }
  function run(keys, fresh = false) {
    // Each part publishes immediately; a delayed wallet never hides a ready tree.
    return Promise.all(keys.map(key => start(key, fresh)));
  }
  return {
    refresh(nextDepth = depth) {
      if (!active) return Promise.resolve();
      clearTimer(); cancelAll();
      denied = false; snapshots = {}; depth = nextDepth; tries = 1;
      onStart(true); onSync(false);
      return run(["tree", "summary", "referral"]);
    },
    changeDepth(nextDepth) {
      if (!active || denied || nextDepth === depth) return Promise.resolve();
      clearTimer(); depth = nextDepth;
      onStart(false); onSync(false);
      // Depth affects only the tree: do not repeat balances and referral reads.
      return run(["tree"]);
    },
    dispose() {
      active = false; clearTimer(); cancelAll(); snapshots = {};
    },
  };
}
