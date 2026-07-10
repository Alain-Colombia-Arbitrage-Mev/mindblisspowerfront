import MemberChip from "./MemberChip";
import NetworkViewCard from "./NetworkViewCard";

function sideLabel(side) {
  return side === "L" ? "Izq" : side === "R" ? "Der" : "—";
}

export default function GenerationView({ nodes }) {
  const generations = new Map();
  for (const node of nodes) {
    const gen = node.level ?? 0;
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen).push(node);
  }
  const ordered = [...generations.entries()].sort(([a], [b]) => a - b);

  return (
    <NetworkViewCard title="Vista por generación" memberCount={nodes.length}>
      <div className="space-y-6">
        {ordered.map(([gen, members]) => (
          <div key={gen} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "var(--vp-accent)", color: "#000000" }}
              >
                G{gen}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--vp-text-soft)" }}>
                Generación {gen} - {members.length} {members.length === 1 ? "Miembro" : "Miembros"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {members.map((node) => (
                <MemberChip
                  key={node.id}
                  name={node.name}
                  detail={node.rank?.name ?? sideLabel(node.side)}
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
