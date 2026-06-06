/**
 * Gamification Engine — derives progress, level, achievements, missions
 * from REAL session/platform data only. No fake data.
 */

import platformDataCore from '@/lib/platformDataCore';

// ── LEVELS ────────────────────────────────────────────────────────────
export const LEVELS = [
  { id: 1, name: 'Inicio',         minXP: 0,    color: '#6B7280', glow: 'rgba(107,114,128,0.3)',  icon: '🌱' },
  { id: 2, name: 'Activación',     minXP: 100,  color: '#3b82f6', glow: 'rgba(59,130,246,0.3)',   icon: '⚡' },
  { id: 3, name: 'Expansión',      minXP: 300,  color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)',   icon: '🌐' },
  { id: 4, name: 'Consolidación',  minXP: 700,  color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',   icon: '🏆' },
  { id: 5, name: 'Liderazgo',      minXP: 1500, color: '#10b981', glow: 'rgba(16,185,129,0.35)',  icon: '👑' },
];

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  {
    id: 'primer_acceso',
    label: 'Primer Acceso',
    desc: 'Iniciaste sesión por primera vez',
    icon: '🚀',
    xp: 50,
    color: '#3b82f6',
    check: () => !!localStorage.getItem('user_auth'),
  },
  {
    id: 'perfil_completo',
    label: 'Perfil Completo',
    desc: 'Completaste tu información de perfil',
    icon: '✅',
    xp: 75,
    color: '#10b981',
    check: () => {
      try {
        const d = JSON.parse(localStorage.getItem('user_data') || '{}');
        return !!(d.name && d.email);
      } catch { return false; }
    },
  },
  {
    id: 'cuenta_activada',
    label: 'Cuenta Activada',
    desc: 'Completaste tu proceso de activación',
    icon: '⚡',
    xp: 100,
    color: '#f59e0b',
    check: () => {
      try {
        const d = JSON.parse(localStorage.getItem('user_data') || '{}');
        return !!(d.planValue || d.path);
      } catch { return false; }
    },
  },
  {
    id: 'primer_miembro',
    label: 'Primer Miembro',
    desc: 'Tienes al menos 1 persona en tu red',
    icon: '👥',
    xp: 150,
    color: '#8b5cf6',
    check: () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return false;
        const desc = platformDataCore.getDescendantsForLeader(userId);
        return desc.length >= 1;
      } catch { return false; }
    },
  },
  {
    id: 'red_activa',
    label: 'Red Activa',
    desc: 'Tienes 5 o más personas activas en tu red',
    icon: '🌐',
    xp: 300,
    color: '#06b6d4',
    check: () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return false;
        const desc = platformDataCore.getDescendantsForLeader(userId);
        const active = desc.filter(d => platformDataCore.getUserById(d.user_id)?.status === 'activo');
        return active.length >= 5;
      } catch { return false; }
    },
  },
  {
    id: 'crecimiento_constante',
    label: 'Crecimiento Constante',
    desc: 'Tu red supera los 20 miembros',
    icon: '📈',
    xp: 500,
    color: '#10b981',
    check: () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return false;
        const desc = platformDataCore.getDescendantsForLeader(userId);
        return desc.length >= 20;
      } catch { return false; }
    },
  },
];

// ── MISSIONS ──────────────────────────────────────────────────────────
export const MISSIONS = [
  {
    id: 'completa_perfil',
    label: 'Completa tu perfil',
    desc: 'Añade nombre y email a tu cuenta',
    icon: '👤',
    xp: 30,
    route: '/dashboard/profile',
    check: () => {
      try {
        const d = JSON.parse(localStorage.getItem('user_data') || '{}');
        return !!(d.name && d.email);
      } catch { return false; }
    },
  },
  {
    id: 'activa_cuenta',
    label: 'Activa tu cuenta',
    desc: 'Completa el proceso de activación',
    icon: '⚡',
    xp: 50,
    route: '/onboarding/start',
    check: () => {
      try {
        const d = JSON.parse(localStorage.getItem('user_data') || '{}');
        return !!(d.planValue || d.path);
      } catch { return false; }
    },
  },
  {
    id: 'explora_plataforma',
    label: 'Explora la plataforma',
    desc: 'Visita al menos 3 secciones distintas',
    icon: '🗺️',
    xp: 25,
    route: '/dashboard/activity',
    check: () => {
      try {
        const visited = JSON.parse(localStorage.getItem('vp_visited_routes') || '[]');
        return visited.length >= 3;
      } catch { return false; }
    },
  },
  {
    id: 'invita_miembro',
    label: 'Invita a tu primer miembro',
    desc: 'Incorpora alguien a tu red',
    icon: '🤝',
    xp: 100,
    route: '/dashboard/network',
    check: () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return false;
        const desc = platformDataCore.getDescendantsForLeader(userId);
        return desc.length >= 1;
      } catch { return false; }
    },
  },
  {
    id: 'configura_seguridad',
    label: 'Configura tu seguridad',
    desc: 'Actualiza tu contraseña en el perfil',
    icon: '🔒',
    xp: 20,
    route: '/dashboard/profile',
    check: () => !!localStorage.getItem('vp_security_configured'),
  },
];

// ── MAIN ENGINE ───────────────────────────────────────────────────────
export function computeGamification() {
  // Evaluate all achievements
  const achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check() }));

  // Evaluate all missions
  const missions = MISSIONS.map(m => ({ ...m, completed: m.check() }));

  // Calculate total XP
  const xpFromAchievements = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const xpFromMissions     = missions.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);

  // Network-based bonus XP
  let networkXP = 0;
  try {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const desc = platformDataCore.getDescendantsForLeader(userId);
      networkXP = Math.min(desc.length * 10, 400); // cap at 400
    }
  } catch {}

  const totalXP = xpFromAchievements + xpFromMissions + networkXP;

  // Determine current level
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }

  // Progress to next level
  const xpForCurrent = currentLevel.minXP;
  const xpForNext    = nextLevel ? nextLevel.minXP : currentLevel.minXP;
  const xpInLevel    = totalXP - xpForCurrent;
  const xpNeeded     = xpForNext - xpForCurrent;
  const progressPct  = nextLevel ? Math.round((xpInLevel / xpNeeded) * 100) : 100;

  // Recent unlocked achievements (for "recent achievement" display)
  const recentAchievement = achievements.filter(a => a.unlocked).slice(-1)[0] || null;

  // Next suggested mission
  const nextMission = missions.find(m => !m.completed) || null;

  return {
    totalXP,
    currentLevel,
    nextLevel,
    progressPct,
    xpInLevel,
    xpNeeded,
    achievements,
    missions,
    recentAchievement,
    nextMission,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    completedMissions: missions.filter(m => m.completed).length,
  };
}

// ── ROUTE TRACKER (call this on navigation) ───────────────────────────
export function trackRouteVisit(path) {
  try {
    const visited = JSON.parse(localStorage.getItem('vp_visited_routes') || '[]');
    if (!visited.includes(path)) {
      visited.push(path);
      localStorage.setItem('vp_visited_routes', JSON.stringify(visited));
    }
  } catch {}
}