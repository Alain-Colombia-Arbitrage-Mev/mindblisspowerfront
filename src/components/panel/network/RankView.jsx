import MemberChip from "./MemberChip";
import NetworkViewCard from "./NetworkViewCard";

export default function RankView({ nodes }) {
  const byRank = new Map();
  for (const node of nodes) {
    const rank = node.rank?.name ?? "Sin Rango";
    if (!byRank.has(rank)) byRank.set(rank, []);
    byRank.get(rank).push(node);
  }
  const ordered = [...byRank.entries()].sort(([, a], [, b]) => b.length - a.length);

  return (
    <NetworkViewCard title="Vista por rango" memberCount={nodes.length}>
      <div className="space-y-6">
        {ordered.map(([rank, members]) => (
          <div key={rank} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  color: "var(--vp-accent)",
                  background: "rgba(250, 204, 21, 0.1)",
                  borderColor: "rgba(250, 204, 21, 0.2)",
                }}
              >
                {rank}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--vp-text-soft)" }}>
                {members.length} {members.length === 1 ? "Miembro" : "Miembros"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {members.map((node) => (
                <MemberChip
                  key={node.id}
                  name={node.name}
                  detail={`N${node.level} · ${node.side === "L" ? "Izq" : node.side === "R" ? "Der" : "—"}`}
                  active={Boolean(node.rank)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </NetworkViewCard>
  );
}
