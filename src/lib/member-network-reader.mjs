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
  maxTries = 20, pollDelay = 15000, now = Date.now,
  documentTarget = typeof document === "undefined" ? null : document,
}) {
  let active = true;
  let denied = false;
  let started = false;
  let resumePending = false;
  let depth = "4";
  let tries = 0;
  let timer = null;
  let timerGeneration = 0;
  let lastReadAt = null;
  let snapshots = {};
  // Three independently authorized GETs share a 30/minute native token budget.
  // Leave capacity for the shell and other views, including on tab restoration.
  const automaticDelay = Number.isFinite(pollDelay) ? Math.max(15000, pollDelay) : 15000;
  const visible = () => !documentTarget || documentTarget.visibilityState === "visible";
  let wasVisible = visible();
  const unavailableAccess = new Set();
  const requests = new Map();
  const clearTimer = () => { timerGeneration++; if (timer !== null) unschedule(timer); timer = null; };
  const cancelAll = () => {
    const pending = [...requests.values()];
    requests.clear();
    for (const request of pending) request.controller.abort();
  };
  function scheduleRead(delay) {
    const generation = ++timerGeneration;
    timer = schedule(() => {
      if (generation !== timerGeneration) return;
      timer = null;
      if (!active || denied || !visible() || unavailableAccess.size || requests.size || tries >= maxTries) return;
      tries++;
      const resumed = resumePending;
      resumePending = false;
      if (resumed) onStart(false);
      void run(["tree", "summary", "referral"], true);
    }, delay);
  }
  function maybePoll() {
    if (!active || denied || !visible() || requests.size || timer !== null) return;
    if (resumePending) {
      const allowed = !unavailableAccess.size && tries < maxTries;
      onSync(allowed);
      if (allowed) scheduleRead(lastReadAt === null ? 0 : Math.max(0, automaticDelay - (now() - lastReadAt)));
      else resumePending = false;
      return;
    }
    const { tree, summary } = snapshots;
    const status = summary?.payments?.[0]?.status;
    const paid = Number(summary?.active_packages) > 0 || ["paid", "activated", "needs_placement"].includes(status);
    const shouldPoll = !unavailableAccess.size && tree?.positioned === false && paid && status !== "needs_placement" && tries < maxTries;
    onSync(shouldPoll);
    if (shouldPoll) scheduleRead(automaticDelay);
  }
  async function start(key, fresh) {
    if (!active || denied || !visible()) return;
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
      unavailableAccess.delete(key);
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
        if (error.status === 503 && error.code === "authentication_unavailable") {
          unavailableAccess.add(key);
          clearTimer();
          onSync(false);
        }
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
    lastReadAt = now();
    return Promise.all(keys.map(key => start(key, fresh)));
  }
  function visibilityChanged() {
    const shown = visible();
    if (!active || shown === wasVisible) return;
    wasVisible = shown;
    if (!shown) {
      resumePending = started && !denied && !unavailableAccess.size && tries < maxTries;
      clearTimer(); cancelAll(); onSync(false);
    } else if (resumePending) maybePoll();
  }
  documentTarget?.addEventListener("visibilitychange", visibilityChanged);
  return {
    refresh(nextDepth = depth) {
      if (!active) return Promise.resolve();
      clearTimer(); cancelAll();
      denied = false; snapshots = {}; unavailableAccess.clear(); depth = nextDepth; tries = 0;
      started = true; resumePending = !visible();
      onStart(true); onSync(false);
      if (resumePending) return Promise.resolve();
      tries = 1;
      return run(["tree", "summary", "referral"]);
    },
    changeDepth(nextDepth) {
      if (!active || denied || nextDepth === depth) return Promise.resolve();
      clearTimer(); depth = nextDepth;
      onStart(false); onSync(false);
      if (!visible()) return Promise.resolve();
      // Depth affects only the tree: do not repeat balances and referral reads.
      return run(["tree"]);
    },
    dispose() {
      active = false; clearTimer(); cancelAll(); snapshots = {}; unavailableAccess.clear(); resumePending = false;
      documentTarget?.removeEventListener("visibilitychange", visibilityChanged);
    },
  };
}
