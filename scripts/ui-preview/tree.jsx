import { useState } from "react";
import { createRoot } from "react-dom/client";
import BinaryTreeView from "../../src/components/panel/network/BinaryTreeView.jsx";

const allNodes = [
  { id: "102", parentId: "101", side: "L", rootSide: "L", level: 1, name: "Not Available", unavailable: true, status: "unavailable", hasChildren: true, childrenComplete: true },
  { id: "103", parentId: "101", side: "R", rootSide: "R", level: 1, name: "Nombre extenso de prueba", status: "active", activePackage: true, hasChildren: false, childrenComplete: true },
  { id: "104", parentId: "102", side: "R", rootSide: "L", level: 2, name: "Descendiente conservado", status: "active", activePackage: true, hasChildren: false, childrenComplete: true },
];

function TreePreview() {
  const partial = new URLSearchParams(window.location.search).get("state") === "partial";
  const nodes = partial ? allNodes.filter(node => node.id !== "103") : allNodes;
  const [depth, setDepth] = useState("4");
  return <main style={{ padding: 20, minWidth: 0 }}>
    <h1 className="executive-title" style={{ marginBottom: 24 }}>Red binaria</h1>
    <BinaryTreeView nodes={nodes} me={{ affiliateId: "101", name: "Raíz de prueba", status: "active", activePackage: true, hasChildren: true, childrenComplete: !partial }} meta={{ depth: Number(depth) || "all", returned: nodes.length, limit: 64, truncated: partial }} depth={depth} onDepthChange={setDepth} onRefresh={() => {}} refreshing={false} />
  </main>;
}

createRoot(document.getElementById("root")).render(<TreePreview />);
