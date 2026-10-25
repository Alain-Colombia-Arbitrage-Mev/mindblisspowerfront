import { readMemberJson, validMemberSummary, validMemberTree } from "./member-read.mjs";

// The summary is a fresh primary read. Placement is useful only after activation;
// waiting for the webhook must not also query the tree on every polling attempt.
/** @param {{signal?: AbortSignal, fetchImpl?: typeof fetch}} [options] */
export async function readCheckoutActivation({ signal, fetchImpl = globalThis.fetch } = {}) {
  const summary = await readMemberJson("/api/payments/me?fresh=1", { signal, fetchImpl, validate: validMemberSummary });
  const active = Number(summary.active_packages) > 0;
  if (!active) return { summary, active: false, positioned: false };
  const tree = await readMemberJson("/api/member/tree?view=position", { signal, fetchImpl, validate: validMemberTree });
  return { summary, active: true, positioned: tree.positioned };
}

// Schedule the next read only when the current read completes. This bounds each
// screen to one in-flight attempt even when the API takes longer than 3 seconds.
/** @param {{
 * read?: (options: {signal: AbortSignal}) => Promise<any>,
 * onResult: (result: any, state: {attempt: number, exhausted: boolean}) => unknown,
 * onError?: (error: any, state: {attempt: number, exhausted: boolean}) => unknown,
 * intervalMs?: number, maxAttempts?: number, maxDurationMs?: number,
 * timers?: Pick<typeof globalThis, "setTimeout" | "clearTimeout">
 * }} options */
export function startCheckoutPolling({
  read = readCheckoutActivation,
  onResult,
  onError = () => {},
  intervalMs = 3000,
  maxAttempts = 20,
  maxDurationMs = 60_000,
  timers = globalThis,
}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || !Number.isFinite(intervalMs) || intervalMs < 0
    || !Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
    throw new Error("Invalid checkout polling bounds");
  }
  const controller = new AbortController();
  let timer;
  let attempt = 0;
  let finished = false;
  const deadlineTimer = timers.setTimeout(() => {
    if (finished || controller.signal.aborted) return;
    finished = true;
    controller.abort();
    if (timer !== undefined) timers.clearTimeout(timer);
    onError(Object.assign(new Error("La activacion sigue en proceso."), { status: 504 }), { attempt, exhausted: true });
  }, maxDurationMs);

  async function check() {
    if (controller.signal.aborted) return;
    attempt++;
    const exhausted = attempt >= maxAttempts;
    let stop = exhausted;
    let delay = intervalMs;
    try {
      const result = await read({ signal: controller.signal });
      if (controller.signal.aborted) return;
      stop = Boolean(onResult(result, { attempt, exhausted })) || exhausted;
    } catch (error) {
      if (controller.signal.aborted) return;
      const denied = [401, 403].includes(error?.status);
      stop = Boolean(onError(error, { attempt, exhausted: exhausted || denied })) || exhausted || denied;
      delay = Math.max(delay, Math.min(Number(error?.retryAfterMs) || 0, 60_000));
    }
    if (stop) {
      finished = true;
      timers.clearTimeout(deadlineTimer);
    } else if (!controller.signal.aborted) timer = timers.setTimeout(check, delay);
  }

  check();
  return () => {
    finished = true;
    controller.abort();
    timers.clearTimeout(deadlineTimer);
    if (timer !== undefined) timers.clearTimeout(timer);
  };
}
