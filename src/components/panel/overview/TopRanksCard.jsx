import Link from "next/link";
import RankItem from "./RankItem";

export default function TopRanksCard({ ranks, tableHref = "/dashboard/rank" }) {
  return (
    <section
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl xl:w-[380px]"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="border-b px-6 py-5" style={{ borderColor: "var(--vp-border)" }}>
        <h2 className="m-0 text-lg font-semibold" style={{ color: "var(--vp-text)" }}>
          Top Rangos
        </h2>
        <p className="m-0 mt-1 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
          Últimos clasificados
        </p>
      </div>

      <div className="flex flex-1 flex-col p-2">
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
          Ver Tabla Completa
        </Link>
      </div>
    </section>
  );
}
