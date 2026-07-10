import Link from "next/link";

export default function ShortcutPill({ icon: Icon, label, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full px-5 py-2.5 no-underline"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <Icon size={15} style={{ color: "var(--vp-text)" }} />
      <span className="text-sm font-medium" style={{ color: "var(--vp-text)" }}>
        {label}
      </span>
    </Link>
  );
}
