import { canonicalSide } from "./tree-read-model.mjs";

const numeric = value => ["number", "string"].includes(typeof value) && String(value).trim() !== "" && Number.isFinite(Number(value));
const identity = value => ["number", "string"].includes(typeof value) && String(value).trim() !== "";

export function validMemberTree(data) {
  if (typeof data.positioned !== "boolean") return false;
  if (!data.positioned) return true;
  return identity(data.me?.affiliateId) && Array.isArray(data.tree) && data.tree.every(node =>
    node && identity(node.id) && identity(node.parentId) && canonicalSide(node.side) && canonicalSide(node.rootSide)
    && Number.isInteger(node.level) && node.level > 0);
}

export const isRecoverySummary = data => data?.data_source === "verified_stripe_recovery"
  && data.financial_status === "pending_calculation_and_review" && data.payout_locked === true;

export function validMemberSummary(data) {
  const balances = [data.wallet_balance_usd, data.available_for_withdrawal_usd,
    data.commission_available_usd, data.commission_maturing_usd];
  const paymentsValid = Array.isArray(data.payments) && data.payments.every(payment => payment && typeof payment.status === "string");
  if (!numeric(data.active_packages) || !paymentsValid) return false;
  if (data.data_source === "verified_stripe_recovery" || data.financial_status === "pending_calculation_and_review") {
    return isRecoverySummary(data) && balances.every(value => value === null) && data.payments.length === 0
      && Array.isArray(data.stripe_sales) && data.stripe_sales.every(sale => sale && identity(sale.payment_intent_id)
        && numeric(sale.total_usd) && Number(sale.total_usd) >= 0 && numeric(sale.refunded_usd) && Number(sale.refunded_usd) >= 0
        && ["paid", "refunded", "disputed", "under_review"].includes(sale.status)
        && typeof sale.source_eligible === "boolean" && typeof sale.charged_at === "string" && Number.isFinite(Date.parse(sale.charged_at)));
  }
  return balances.every(numeric);
}

export function validMemberReferral(data) {
  if (typeof data.positioned !== "boolean") return false;
  if (!data.positioned) return true;
  return typeof data.code === "string" && data.code.length > 0
    && [data.links?.left || data.link_left || data.link, data.links?.right || data.link_right || data.link].every(link => {
      try { return ["https:", "http:"].includes(new URL(link).protocol); } catch { return false; }
    });
}

function messageFor(status, code) {
  if (status === 401) return "Tu sesion expiro. Vuelve a iniciar sesion.";
  if (status === 403) return code === "account_suspended" ? "Esta cuenta tiene el acceso a la red restringido." : "No tienes permiso para consultar estos datos.";
  if (status === 429) return "Demasiadas consultas. Intenta de nuevo mas tarde.";
  if (status === 503) return "El servicio no esta disponible o no esta configurado.";
  return "No se pudieron consultar los datos. Intenta de nuevo.";
}

/** @param {string} url
 * @param {{signal?: AbortSignal, validate?: (data: any) => boolean, timeoutMs?: number, fetchImpl?: typeof fetch}} [options] */
export async function readMemberJson(url, { signal, validate = () => true, timeoutMs = 15_000, fetchImpl = globalThis.fetch } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(url, { cache: "no-store", signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const retry = Number(response.headers.get("retry-after") || data?.retryAfterSec);
      throw Object.assign(new Error(messageFor(response.status, data?.error)), {
        status: response.status, retryAfterMs: Number.isFinite(retry) && retry > 0 ? Math.min(retry, 86400) * 1000 : 0,
      });
    }
    if (!data || typeof data !== "object" || Array.isArray(data) || data.error || !validate(data)) {
      throw Object.assign(new Error("El servicio devolvio datos incompletos o invalidos."), { status: 502 });
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw signal.reason || error;
    if (timedOut) {
      throw Object.assign(new Error("La consulta demoro demasiado. Intenta de nuevo."), { status: 504 });
    }
    if (error?.status) throw error;
    throw new Error("No se pudo conectar con el servicio. Intenta de nuevo.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

// Publish each independent read immediately; a slow wallet must not hide a ready tree.
// Any authorization failure cancels the other reads and invalidates the entire view.
export async function readMemberParts(parts, { signal, onPart, ...options }) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  try {
    return Object.fromEntries(await Promise.all(Object.entries(parts).map(async ([key, { url, validate }]) => {
      let result;
      try { result = { data: await readMemberJson(url, { ...options, validate, signal: controller.signal }) }; }
      catch (error) { result = { error }; }
      if (!controller.signal.aborted) {
        const denied = [401, 403].includes(result.error?.status);
        if (denied) controller.abort();
        onPart(key, result);
      }
      return [key, result];
    })));
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
