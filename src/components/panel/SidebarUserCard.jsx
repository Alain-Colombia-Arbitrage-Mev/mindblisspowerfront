function initialsOf(name) {
  if (!name) return "MP";
  return name
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function SidebarUserCard({ name, email, role = "Member" }) {
  return (
    <div className="px-4">
      <div
        className="flex flex-col items-center rounded-2xl px-4 py-6"
        style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
      >
        <div className="relative h-16 w-16">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-bold"
            style={{ background: "var(--vp-accent)", color: "#000000" }}
          >
            {initialsOf(name)}
          </span>
          <span
            className="absolute bottom-0 right-0 h-4 w-4 rounded-full"
            style={{ background: "#22c55e", border: "2px solid var(--vp-surface)" }}
          />
        </div>
        <p className="m-0 mt-3 max-w-full truncate text-[13px] font-semibold" style={{ color: "var(--vp-text)" }}>
          {name || "Mi cuenta"}
        </p>
        {email ? (
          <p className="m-0 mt-0.5 max-w-full truncate text-[11px] font-light" style={{ color: "var(--vp-muted)" }}>
            {email}
          </p>
        ) : null}
        <span
          className="mt-2.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase"
          style={{
            color: "var(--vp-accent)",
            background: "rgba(250, 204, 21, 0.1)",
            border: "1px solid rgba(250, 204, 21, 0.2)",
            letterSpacing: "0.08em",
          }}
        >
          {role}
        </span>
      </div>
    </div>
  );
}
