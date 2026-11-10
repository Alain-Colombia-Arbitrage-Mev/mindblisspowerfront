const ADDRESS = /^0x[0-9a-f]{40}$/i;

export class WalletBindingError extends Error {
  constructor(code = "wallet_link_unavailable", status = 0) {
    super(code);
    this.name = "WalletBindingError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Read the server-verified wallet binding. This never infers ownership from
 * AppKit's connected account: only the authenticated backend may mark it linked.
 * @param {{fetchImpl?: typeof fetch, signal?: AbortSignal}} [options]
 */
export async function readWalletBinding({ fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl("/api/member/wallet-link", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = typeof data?.error === "string" && data.error.length <= 80
      ? data.error
      : "wallet_link_unavailable";
    throw new WalletBindingError(code, response.status);
  }
  if (data?.linked === false) return { linked: false, address: "" };
  if (data?.linked === true && ADDRESS.test(data.address || "")) {
    return { linked: true, address: data.address };
  }
  throw new WalletBindingError("wallet_link_unavailable", 502);
}

export function walletBindingFailure(error) {
  if (error?.name === "AbortError") return "aborted";
  if (error?.status === 401 || error?.code === "unauthenticated") return "session";
  return "unavailable";
}
