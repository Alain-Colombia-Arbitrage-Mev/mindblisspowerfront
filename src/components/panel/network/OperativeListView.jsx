import NetworkViewCard from "./NetworkViewCard";

export default function OperativeListView({ nodes }) {
  return (
    <NetworkViewCard title="Lista operativa" memberCount={nodes.length}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {["Miembro", "Nivel", "Rama", "Estado", "Rango"].map((header) => (
                <th
                  key={header}
                  className="border-b px-4 py-3 text-[11px] font-semibold uppercase"
                  style={{ borderColor: "var(--vp-border)", color: "var(--vp-muted)", letterSpacing: "0.05em" }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id} className="border-b" style={{ borderColor: "var(--vp-border)" }}>
                <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--vp-text)" }}>
                  {node.name}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--vp-muted)" }}>
                  Nivel {node.level}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--vp-muted)" }}>
                  {node.rootSide === "L" ? "Izquierda" : node.rootSide === "R" ? "Derecha" : "—"}
                </td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: node.activePackage ? "var(--vp-success)" : "var(--vp-muted)" }}>
                  {node.activePackage ? "Paquete activo" : node.status === "active" ? "Nodo activo" : "Inactivo"}
                </td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: node.rank ? "var(--vp-accent)" : "var(--vp-muted)" }}>
                  {node.rank?.name ?? "Sin Rango"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NetworkViewCard>
  );
}
