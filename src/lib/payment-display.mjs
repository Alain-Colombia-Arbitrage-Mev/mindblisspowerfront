// Unknown/recovered commissions are not a zero-dollar balance. Keep this rule
// outside presentation components so every consumer can use the same semantics.
export function knownMoney(value) {
  return (typeof value === "number" || typeof value === "string" && value.trim() !== "")
    && Number.isFinite(Number(value));
}

export function formatPaymentMoney(value) {
  return knownMoney(value)
    ? `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Pendiente de cálculo";
}

export function formatPaymentDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function withdrawalTerms(data) {
  const min = knownMoney(data.min_withdrawal_usd) && Number(data.min_withdrawal_usd) > 0 ? Number(data.min_withdrawal_usd) : 100;
  const available = knownMoney(data.available_for_withdrawal_usd) ? Number(data.available_for_withdrawal_usd) : null;
  return { min, available, allowed: data.payout_locked !== true && available !== null && available >= min };
}
