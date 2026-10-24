export function canonicalSide(side) {
  const value = String(side || "").trim().toUpperCase();
  if (["L", "LEFT", "IZQ", "IZQUIERDA"].includes(value)) return "L";
  if (["R", "RIGHT", "DER", "DERECHA"].includes(value)) return "R";
  return null;
}

export function loadedChildCounts(nodes) {
  const children = new Map();
  for (const node of nodes) {
    if (node.parent_id == null || node.id == null) continue;
    const parent = String(node.parent_id);
    if (!children.has(parent)) children.set(parent, new Set());
    children.get(parent).add(String(node.id));
  }
  return new Map([...children].map(([parent, ids]) => [parent, ids.size]));
}

export function childCoverage(id, childCount, loadedCounts) {
  const count = Number(childCount);
  const supplied = typeof childCount === "number" || (typeof childCount === "string" && childCount.trim() !== "");
  const known = supplied && Number.isInteger(count) && count >= 0 && count <= 2;
  return {
    hasChildren: !known || count > 0,
    childrenComplete: known && count === (loadedCounts.get(String(id)) || 0),
  };
}

export function childSlotState(node, child) {
  if (child) return "occupied";
  return node?.childrenComplete === true ? "available" : "unloaded";
}

export function buildBinaryTreeIndex(nodes) {
  const bySide = new Map();
  const issues = [];
  for (const node of nodes) {
    const parent = node.parentId == null ? null : String(node.parentId);
    const side = canonicalSide(node.side);
    if (!parent || !side) continue;
    if (!bySide.has(parent)) bySide.set(parent, {});
    const existing = bySide.get(parent)[side];
    if (!existing) bySide.get(parent)[side] = node;
    else if (String(existing.id) !== String(node.id)) issues.push({ parentId: parent, side });
  }
  const cache = new Map();
  function countDescendants(id) {
    const root = String(id);
    if (cache.has(root)) return cache.get(root);
    const seen = new Set([root]);
    const pending = Object.values(bySide.get(root) || {});
    let count = 0;
    while (pending.length) {
      const child = pending.pop();
      const key = String(child.id);
      if (seen.has(key)) continue;
      seen.add(key);
      count++;
      pending.push(...Object.values(bySide.get(key) || {}));
    }
    cache.set(root, count);
    return count;
  }
  return { bySide, countDescendants, issues };
}

export function treeRefreshFailure(previous, status, message) {
  const accessDenied = status === 401 || status === 403;
  if (accessDenied || !previous.data) {
    return { ...previous, loading: false, refreshing: false, syncing: false,
      error: message, errorStatus: status, refreshError: "", data: null, summary: null, referral: null, summaryError: null, referralError: null };
  }
  return { ...previous, loading: false, refreshing: false, syncing: false,
    error: "", refreshError: "No se pudo actualizar la red. Se conserva la última lectura." };
}
