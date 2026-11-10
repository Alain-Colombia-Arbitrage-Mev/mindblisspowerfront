import { KYC_STATUS_LABELS } from "./kycConfig";

const TONES = {
  green: { color: "var(--vp-success)", background: "var(--vp-success-muted)", border: "var(--vp-success-border)" },
  amber: { color: "var(--vp-amber)", background: "var(--vp-amber-muted)", border: "var(--vp-amber-border)" },
  red: { color: "var(--vp-danger)", background: "var(--vp-danger-muted)", border: "var(--vp-danger-border)" },
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
