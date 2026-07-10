import { KYC_STATUS_LABELS } from "./kycConfig";

const TONES = {
  green: { color: "#4ade80", background: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)" },
  amber: { color: "var(--vp-accent)", background: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.3)" },
  red: { color: "#f87171", background: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.3)" },
  gray: { color: "var(--vp-muted)", background: "var(--vp-surface-raised)", border: "var(--vp-border)" },
};

export default function KycStatusBadge({ status }) {
  const meta = KYC_STATUS_LABELS[status] ?? KYC_STATUS_LABELS.not_started;
  const tone = TONES[meta.tone] ?? TONES.gray;
  return (
    <span
      className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase"
      style={{ color: tone.color, background: tone.background, borderColor: tone.border, letterSpacing: "0.08em" }}
    >
      {meta.label}
    </span>
  );
}
