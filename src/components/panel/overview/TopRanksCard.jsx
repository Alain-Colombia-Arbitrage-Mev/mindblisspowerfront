import Link from "next/link";
import RankItem from "./RankItem";

export default function TopRanksCard({ ranks, tableHref = "/dashboard/rank" }) {
  return (
    <section
      className="flex min-w-0 w-full flex-col overflow-hidden rounded-3xl"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="border-b px-6 py-5" style={{ borderColor: "var(--vp-border)" }}>
        <h2 className="m-0 text-lg font-semibold" style={{ color: "var(--vp-text)" }}>
          Rangos en tu red
        </h2>
        <p className="m-0 mt-1 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
          Muestra de la red visible
        </p>
      </div>

      <div className="flex flex-1 flex-col p-2">
        {!ranks.length ? <p className="p-4 text-sm" style={{ color: "var(--vp-muted)" }}>No hay rangos en esta muestra de tu red.</p> : null}
        {ranks.map((rank) => (
          <RankItem key={rank.username} rank={rank} />
        ))}
      </div>

      <div className="border-t p-4" style={{ borderColor: "var(--vp-border)" }}>
        <Link
          href={tableHref}
          className="block rounded-xl p-2.5 text-center text-sm font-semibold no-underline"
          style={{ border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
        >
          Ver rangos
        </Link>
      </div>
    </section>
  );
}
