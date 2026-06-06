import {
  LEADER_NETWORK_MEMBERS,
  MEMBER_ACTIVITY_LOG,
} from "./memberNetworkData.js";

const COMPANY_FUND_RATE = 0.5;
const RANK_ORDER = [
  "Embajador Corona",
  "E. Corona",
  "Diamante Negro",
  "Diamante Azul",
  "Diamante",
  "Esmeralda",
  "Rubi",
  "Rubí",
  "Zafiro",
  "Platino",
  "Oro",
  "Plata",
  "Bronce",
  "Principiante",
  "Inicial",
];

const DEMO_USER = {
  id: "master-root-001",
  name: "Embajador Corona",
  email: "corona@vicion.com",
  rank: "Embajador Corona",
};

export function buildReferralCode(user = DEMO_USER) {
  const rawName = normalizeName(user.name || user.email || user.id || "vicion");
  const source = `${user.id || ""}|${user.email || ""}|${user.name || ""}`;
  const hash = stableNumericHash(source).toString().padStart(6, "0").slice(-6);
  return `VP-${rawName}-${hash}`;
}

export function summarizeNetworkMembers(members = []) {
  const normalizedMembers = members.map(normalizeMember);
  const leftMembers = normalizedMembers.filter((member) => member.side === "left");
  const rightMembers = normalizedMembers.filter((member) => member.side === "right");
  const activeMembers = normalizedMembers.filter((member) => member.status === "activo");
  const highPriorityMembers = normalizedMembers.filter((member) =>
    ["alta", "high", "urgente"].includes(member.followUpPriority)
  );
  const totalNetworkBonuses = normalizedMembers.reduce(
    (sum, member) => sum + member.networkBonusesHistorical,
    0
  );

  const leftLeg = buildLegSummary("left", leftMembers);
  const rightLeg = buildLegSummary("right", rightMembers);
  const weakLeg = getWeakLeg(leftLeg, rightLeg);
  const strongLeg = weakLeg.side === "left" ? rightLeg : leftLeg;

  return {
    totalMembers: normalizedMembers.length,
    activeMembers: activeMembers.length,
    activeRate: percent(activeMembers.length, normalizedMembers.length),
    inactiveMembers: normalizedMembers.length - activeMembers.length,
    highPriorityMembers: highPriorityMembers.length,
    totalNetworkBonuses,
    companyFundEstimate: Math.round(totalNetworkBonuses * COMPANY_FUND_RATE),
    leftLeg,
    rightLeg,
    weakLeg,
    strongLeg,
    rankMix: buildRankMix(normalizedMembers),
    rankLeaders: getRankLeaders(normalizedMembers),
    proTeam: getProTeam(normalizedMembers),
    activityReport: buildActivityReport(normalizedMembers),
  };
}

export function buildNetworkLLMContext(model) {
  const network = model.network;
  return {
    member: model.user?.name || "Miembro",
    referralCode: model.referralCode,
    analysisFocus: [
      "derrame",
      "derrame binario",
      "pierna debil",
      "riesgo de inactividad",
      "avance de rango",
      "prioridad de seguimiento",
    ],
    network: {
      totalMembers: network.totalMembers,
      activeRate: network.activeRate,
      weakLeg: network.weakLeg.side,
      strongLeg: network.strongLeg.side,
      leftMembers: network.leftLeg.members,
      rightMembers: network.rightLeg.members,
      highPriorityMembers: network.highPriorityMembers,
      companyFundEstimate: network.companyFundEstimate,
      rankMix: network.rankMix,
    },
  };
}

export function buildNetworkInsights(network) {
  const weakLabel = network.weakLeg.side === "left" ? "izquierda" : "derecha";
  const strongLabel = network.strongLeg.side === "left" ? "izquierda" : "derecha";
  const activationGap = 100 - network.activeRate;

  return [
    {
      title: "Derrame hacia pierna debil",
      severity: network.weakLeg.members === 0 ? "alta" : "media",
      detail: `La pierna ${weakLabel} tiene ${network.weakLeg.members} miembros contra ${network.strongLeg.members} en la pierna ${strongLabel}. Prioriza nuevos referidos y seguimiento en la pierna debil.`,
    },
    {
      title: "Actividad recuperable",
      severity: activationGap >= 25 ? "alta" : "normal",
      detail: `La red activa esta en ${network.activeRate}%. Hay ${network.inactiveMembers} miembros que pueden recuperar volumen con contacto directo.`,
    },
    {
      title: "Proteccion del fondo",
      severity: "normal",
      detail: `Con bonos historicos de red por $${network.totalNetworkBonuses.toLocaleString("en-US")}, el fondo estimado de empresa queda en $${network.companyFundEstimate.toLocaleString("en-US")}.`,
    },
  ];
}

export function getNetworkDashboardModel({
  user = DEMO_USER,
  members = LEADER_NETWORK_MEMBERS,
  activityLog = MEMBER_ACTIVITY_LOG,
} = {}) {
  const network = summarizeNetworkMembers(members);
  return {
    user,
    referralCode: buildReferralCode(user),
    network,
    llmContext: buildNetworkLLMContext({
      user,
      referralCode: buildReferralCode(user),
      network,
    }),
    insights: buildNetworkInsights(network),
    activityLog: activityLog.slice(0, 8),
  };
}

function normalizeMember(member) {
  return {
    ...member,
    side: member.binary_side || member.side || "left",
    status: String(member.status || "").toLowerCase(),
    rank: member.rank || "Inicial",
    activityLevel: String(member.activity_level || "baja").toLowerCase(),
    followUpPriority: String(member.follow_up_priority || "normal").toLowerCase(),
    networkBonusesHistorical: Number(member.network_bonuses_historical || 0),
    teamVolume: Number(member.team_volume || member.membership_amount || 0),
  };
}

function buildLegSummary(side, members) {
  return {
    side,
    members: members.length,
    activeMembers: members.filter((member) => member.status === "activo").length,
    volume: members.reduce((sum, member) => sum + member.teamVolume, 0),
    bonuses: members.reduce((sum, member) => sum + member.networkBonusesHistorical, 0),
  };
}

function getWeakLeg(leftLeg, rightLeg) {
  if (leftLeg.members === rightLeg.members) {
    return leftLeg.volume <= rightLeg.volume ? leftLeg : rightLeg;
  }

  return leftLeg.members < rightLeg.members ? leftLeg : rightLeg;
}

function buildRankMix(members) {
  return members.reduce((mix, member) => {
    mix[member.rank] = (mix[member.rank] || 0) + 1;
    return mix;
  }, {});
}

function getRankLeaders(members) {
  return [...members]
    .sort((a, b) => rankWeight(a.rank) - rankWeight(b.rank))
    .slice(0, 5)
    .map((member) => ({
      id: member.id,
      name: member.name,
      rank: member.rank,
      side: member.side,
      activityLevel: member.activityLevel,
    }));
}

function getProTeam(members) {
  return members
    .filter((member) =>
      ["alta", "media"].includes(member.activityLevel) ||
      rankWeight(member.rank) <= rankWeight("Platino")
    )
    .slice(0, 6)
    .map((member) => ({
      id: member.id,
      name: member.name,
      rank: member.rank,
      side: member.side,
      status: member.status,
      activityLevel: member.activityLevel,
      priority: member.followUpPriority,
    }));
}

function buildActivityReport(members) {
  return members
    .map((member) => ({
      id: member.id,
      name: member.name,
      side: member.side,
      rank: member.rank,
      status: member.status,
      activityLevel: member.activityLevel,
      priority: member.followUpPriority,
      lastMovement: member.last_movement || "sin registro",
    }))
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
}

function normalizeName(value) {
  const clean = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  return clean || "VICION";
}

function stableNumericHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000000;
  }
  return Math.abs(hash);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function rankWeight(rank) {
  const index = RANK_ORDER.indexOf(rank);
  return index === -1 ? RANK_ORDER.length : index;
}

function priorityWeight(priority) {
  if (priority === "alta") return 0;
  if (priority === "media") return 1;
  return 2;
}
