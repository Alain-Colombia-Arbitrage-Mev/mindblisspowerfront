import MemberChip from "./MemberChip";
import NetworkViewCard from "./NetworkViewCard";

function Column({ title, nodes }) {
  return (
    <div className="space-y-2.5">
      <span
        className="inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
        style={{
          color: "var(--vp-accent)",
          background: "rgba(250, 204, 21, 0.1)",
          borderColor: "rgba(250, 204, 21, 0.2)",
        }}
      >
        {title}
      </span>
      {nodes.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <MemberChip
              key={node.id}
              name={node.name}
              detail={`N${node.level}${node.rank ? ` · ${node.rank.name}` : ""}`}
              active={Boolean(node.rank)}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
          Posición disponible.
        </p>
      )}
    </div>
  );
}

export default function BinaryTreeView({ nodes }) {
  const left = nodes.filter((node) => node.side === "L");
  const right = nodes.filter((node) => node.side === "R");

  return (
    <NetworkViewCard title="Árbol binario" memberCount={nodes.length}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Column title="Pierna Izquierda" nodes={left} />
        <Column title="Pierna Derecha" nodes={right} />
      </div>
    </NetworkViewCard>
  );
}
