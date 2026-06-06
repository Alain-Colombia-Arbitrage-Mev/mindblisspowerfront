export function buildMemberValidationRecords(core, rootMemberId, descendants = []) {
  if (!core || !rootMemberId) return [];

  const records = [];
  const seen = new Set();

  const pushRecord = (userId, nodeHint = {}) => {
    if (!userId || seen.has(userId)) return;

    const user = core.getUserById?.(userId);
    if (!user) return;

    seen.add(userId);
    records.push(toValidationRecord(core, user, nodeHint));
  };

  const rootNode = findNetworkNode(core, rootMemberId);
  pushRecord(rootMemberId, rootNode);

  descendants.forEach((entry) => {
    const userId = resolveUserId(core, entry);
    pushRecord(userId, entry);
  });

  return records;
}

function resolveUserId(core, entry) {
  if (!entry) return null;
  if (entry.user_id) return entry.user_id;
  if (entry.id && core.getUserById?.(entry.id)) return entry.id;
  return null;
}

function toValidationRecord(core, user, nodeHint = {}) {
  const membership = core.getMembershipsForUser?.(user.id)?.[0] || null;
  const networkNode = nodeHint.user_id === user.id ? nodeHint : findNetworkNode(core, user.id);
  const investmentAmount = Number(
    user.investment_amount ??
    user.investment ??
    membership?.amount ??
    networkNode?.investment ??
    0
  );

  return {
    ...networkNode,
    ...user,
    id: user.id,
    user_id: user.id,
    full_name: user.full_name || user.name,
    investment_amount: Number.isFinite(investmentAmount) ? investmentAmount : 0,
    membership_plan: user.membership_plan || membership?.plan || user.plan,
    upline_id: networkNode?.upline_id ?? user.upline_id ?? null,
    binary_side: networkNode?.binary_side ?? user.binary_side ?? null,
    generation_depth: networkNode?.depth ?? user.generation_depth ?? 0,
  };
}

function findNetworkNode(core, userId) {
  return core.network_nodes?.find((node) => node.user_id === userId) || {};
}
