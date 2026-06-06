/**
 * REALISTIC FICTIONAL MEMBER NETWORK DATA
 * For Embajador Corona's operational leadership platform
 * Real linked records with contact, activity, and history
 */

export const LEADER_NETWORK_MEMBERS = [
  // Direct Left Team
  {
    id: 'member-left-001',
    name: 'María Rodríguez García',
    email: 'maria.rodriguez@network.local',
    phone: '+34 912 345 678',
    country: 'España',
    rank: 'Diamante Azul',
    membership_plan: 'VIP Plus',
    membership_amount: 5000,
    side: 'left',
    generation: 1,
    status: 'activo',
    activity_level: 'alta',
    last_movement: '2026-04-11',
    direct_sponsor: 'master-root-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 8,
    left_count: 4,
    right_count: 4,
    direct_bonuses_historical: 24500,
    network_bonuses_historical: 8900,
    follow_up_priority: 'normal',
    notes: 'Activa y consistente. Buen crecimiento mensual.',
    badge_icon: '💙',
  },
  // Direct Right Team
  {
    id: 'member-right-001',
    name: 'Carlos Mendez López',
    email: 'carlos.mendez@network.local',
    phone: '+1 305 867 5309',
    country: 'USA',
    rank: 'Platino',
    membership_plan: 'Premium',
    membership_amount: 3000,
    side: 'right',
    generation: 1,
    status: 'activo',
    activity_level: 'media',
    last_movement: '2026-04-10',
    direct_sponsor: 'master-root-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 5,
    left_count: 2,
    right_count: 3,
    direct_bonuses_historical: 15200,
    network_bonuses_historical: 4400,
    follow_up_priority: 'normal',
    notes: 'Estable. Potencial de crecimiento en rama derecha.',
    badge_icon: '⭐',
  },
  // Deep Left Team
  {
    id: 'member-left-002',
    name: 'Ana Martínez Sánchez',
    email: 'ana.martinez@network.local',
    phone: '+34 650 123 456',
    country: 'España',
    rank: 'Oro',
    membership_plan: 'Standard Plus',
    membership_amount: 2000,
    side: 'left',
    generation: 2,
    status: 'activo',
    activity_level: 'alta',
    last_movement: '2026-04-12',
    direct_sponsor: 'member-left-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 3,
    left_count: 1,
    right_count: 2,
    direct_bonuses_historical: 8700,
    network_bonuses_historical: 1200,
    follow_up_priority: 'normal',
    notes: 'Crecimiento constante. Próxima a Platino.',
    badge_icon: '🥇',
  },
  {
    id: 'member-left-003',
    name: 'Jorge Fernández Ruiz',
    email: 'jorge.fernandez@network.local',
    phone: '+34 689 234 567',
    country: 'España',
    rank: 'Oro',
    membership_plan: 'Standard',
    membership_amount: 1500,
    side: 'right',
    generation: 2,
    status: 'activo',
    activity_level: 'media',
    last_movement: '2026-04-09',
    direct_sponsor: 'member-left-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 2,
    left_count: 1,
    right_count: 1,
    direct_bonuses_historical: 5200,
    network_bonuses_historical: 800,
    follow_up_priority: 'media',
    notes: 'Actividad fluctuante. Requiere motivación.',
    badge_icon: '🥇',
  },
  // Deep Right Team
  {
    id: 'member-right-002',
    name: 'Diana Castellanos López',
    email: 'diana.castellanos@network.local',
    phone: '+1 786 234 5678',
    country: 'USA',
    rank: 'Plata',
    membership_plan: 'Standard Plus',
    membership_amount: 2000,
    side: 'left',
    generation: 2,
    status: 'activo',
    activity_level: 'alta',
    last_movement: '2026-04-11',
    direct_sponsor: 'member-right-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 4,
    left_count: 2,
    right_count: 2,
    direct_bonuses_historical: 9800,
    network_bonuses_historical: 2100,
    follow_up_priority: 'normal',
    notes: 'Muy activa. Proyección hacia Oro próximamente.',
    badge_icon: '🥈',
  },
  {
    id: 'member-right-003',
    name: 'Roberto Sánchez Garay',
    email: 'roberto.sanchez@network.local',
    phone: '+1 305 555 0123',
    country: 'USA',
    rank: 'Bronce',
    membership_plan: 'Standard',
    membership_amount: 1500,
    side: 'right',
    generation: 2,
    status: 'inactivo',
    activity_level: 'baja',
    last_movement: '2026-03-28',
    direct_sponsor: 'member-right-001',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 0,
    left_count: 0,
    right_count: 0,
    direct_bonuses_historical: 2100,
    network_bonuses_historical: 0,
    follow_up_priority: 'alta',
    notes: 'Inactivo por 15 días. Requiere reactivación urgente.',
    badge_icon: '🥉',
  },
  // Deep generation members
  {
    id: 'member-gen3-001',
    name: 'Patricia Alonso García',
    email: 'patricia.alonso@network.local',
    phone: '+34 722 345 678',
    country: 'España',
    rank: 'Plata',
    membership_plan: 'Standard',
    membership_amount: 1500,
    side: 'left',
    generation: 3,
    status: 'activo',
    activity_level: 'media',
    last_movement: '2026-04-08',
    direct_sponsor: 'member-left-002',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 1,
    left_count: 0,
    right_count: 1,
    direct_bonuses_historical: 3400,
    network_bonuses_historical: 200,
    follow_up_priority: 'normal',
    notes: 'Nuevo sponsor con potencial.',
    badge_icon: '🥈',
  },
  {
    id: 'member-gen3-002',
    name: 'Marco Antonio Díaz',
    email: 'marco.diaz@network.local',
    phone: '+34 699 876 543',
    country: 'España',
    rank: 'Principiante',
    membership_plan: 'Basic',
    membership_amount: 999,
    side: 'right',
    generation: 3,
    status: 'activo',
    activity_level: 'baja',
    last_movement: '2026-04-01',
    direct_sponsor: 'member-left-002',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 0,
    left_count: 0,
    right_count: 0,
    direct_bonuses_historical: 400,
    network_bonuses_historical: 0,
    follow_up_priority: 'media',
    notes: 'Miembro muy nuevo. En fase de onboarding.',
    badge_icon: '🌱',
  },
  {
    id: 'member-gen3-003',
    name: 'Sofia Rivera Navarro',
    email: 'sofia.rivera@network.local',
    phone: '+1 786 876 5432',
    country: 'USA',
    rank: 'Plata',
    membership_plan: 'Premium',
    membership_amount: 3000,
    side: 'left',
    generation: 3,
    status: 'activo',
    activity_level: 'alta',
    last_movement: '2026-04-12',
    direct_sponsor: 'member-right-002',
    upline: 'master-root-001',
    activation_status: 'completado',
    network_members: 2,
    left_count: 1,
    right_count: 1,
    direct_bonuses_historical: 5600,
    network_bonuses_historical: 800,
    follow_up_priority: 'normal',
    notes: 'Estrella en ascenso. Excelente proyección.',
    badge_icon: '🥈',
  },
];

export const MEMBER_ACTIVITY_LOG = [
  { date: '2026-04-12', member_id: 'member-left-002', action: 'Actividad de red registrada', amount: 350 },
  { date: '2026-04-12', member_id: 'member-gen3-003', action: 'Actividad de red registrada', amount: 450 },
  { date: '2026-04-11', member_id: 'member-left-001', action: 'Nuevo miembro patrocinado', member_name: 'Sofia Rivera' },
  { date: '2026-04-10', member_id: 'member-right-001', action: 'Actividad de red registrada', amount: 200 },
  { date: '2026-04-09', member_id: 'member-left-003', action: 'Actividad de red registrada', amount: 150 },
];

export const HISTORICAL_BONUSES = [
  { period: 'Marzo 2026', amount: 3450, type: 'network', source: 'Red binaria' },
  { period: 'Febrero 2026', amount: 3200, type: 'network', source: 'Red binaria' },
  { period: 'Enero 2026', amount: 2900, type: 'rank', source: 'Bonificación de rango' },
  { period: 'Diciembre 2025', amount: 4100, type: 'network', source: 'Red binaria' },
  { period: 'Noviembre 2025', amount: 3800, type: 'mixed', source: 'Red + Liderazgo' },
];

export function getMemberById(memberId) {
  return LEADER_NETWORK_MEMBERS.find(m => m.id === memberId);
}

export function getNetworkMembersForLeader() {
  return LEADER_NETWORK_MEMBERS;
}

export function searchMembers(query) {
  return LEADER_NETWORK_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase())
  );
}

export function filterMembersByRank(rank) {
  return LEADER_NETWORK_MEMBERS.filter(m => m.rank === rank);
}

export function filterMembersByActivity(level) {
  return LEADER_NETWORK_MEMBERS.filter(m => m.activity_level === level);
}

export function filterMembersBySide(side) {
  return LEADER_NETWORK_MEMBERS.filter(m => m.side === side);
}

export function getInactiveMembers() {
  return LEADER_NETWORK_MEMBERS.filter(m => m.status === 'inactivo' || m.activity_level === 'baja');
}

export function getPriorityMembers() {
  return LEADER_NETWORK_MEMBERS.filter(m => m.follow_up_priority === 'alta' || m.follow_up_priority === 'media');
}

export default {
  LEADER_NETWORK_MEMBERS,
  MEMBER_ACTIVITY_LOG,
  HISTORICAL_BONUSES,
  getMemberById,
  getNetworkMembersForLeader,
  searchMembers,
  filterMembersByRank,
  filterMembersByActivity,
  filterMembersBySide,
  getInactiveMembers,
  getPriorityMembers,
};