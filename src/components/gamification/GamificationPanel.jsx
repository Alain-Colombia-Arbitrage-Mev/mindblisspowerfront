/**
 * GamificationPanel
 * Executive progress block for member level, missions and achievements.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  ChevronRight,
  Compass,
  Crown,
  LockKeyhole,
  Medal,
  Network,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { computeGamification } from '@/lib/gamificationEngine';

const MISSION_ICONS = {
  completa_perfil: UserRound,
  activa_cuenta: ShieldCheck,
  explora_plataforma: Compass,
  invita_miembro: UserPlus,
  configura_seguridad: LockKeyhole,
};

const ACHIEVEMENT_ICONS = {
  primer_acceso: Activity,
  perfil_completo: UserCheck,
  cuenta_activada: ShieldCheck,
  primer_miembro: Users,
  red_activa: Network,
  crecimiento_constante: TrendingUp,
};

function levelTone(levelId) {
  if (levelId >= 5) {
    return {
      color: 'var(--vp-amber)',
      bg: 'var(--vp-amber-muted)',
      border: 'var(--vp-amber-border)',
      Icon: Crown,
    };
  }
  if (levelId >= 3) {
    return {
      color: 'var(--vp-accent)',
      bg: 'var(--vp-accent-muted)',
      border: 'var(--vp-accent-border)',
      Icon: Award,
    };
  }
  return {
    color: 'var(--vp-text-soft)',
    bg: 'var(--vp-surface-raised)',
    border: 'var(--vp-border)',
    Icon: Trophy,
  };
}

function completionTone(done) {
  return done
    ? { color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)', label: 'Completada' }
    : { color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)', label: 'Pendiente' };
}

export default function GamificationPanel({ compact = false }) {
  const navigate = useNavigate();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showAllMissions, setShowAllMissions] = useState(false);
  const g = useMemo(() => computeGamification(), []);

  return (
    <div className="space-y-4">
      <LevelProgressCard g={g} compact={compact} />
      <MissionsCard g={g} navigate={navigate} showAll={showAllMissions} setShowAll={setShowAllMissions} />
      <AchievementsCard g={g} showAll={showAllAchievements} setShowAll={setShowAllAchievements} />
    </div>
  );
}

function LevelProgressCard({ g, compact }) {
  const { currentLevel, nextLevel, progressPct, totalXP, xpInLevel, xpNeeded, completedMissions, missions, unlockedCount, achievements } = g;
  const tone = levelTone(currentLevel.id);
  const Icon = tone.Icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        padding: compact ? '16px 18px' : '20px 22px',
        borderRadius: 14,
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} style={{ color: tone.color }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: tone.color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px' }}>
              Nivel {currentLevel.id}
            </p>
            <h3 style={{ color: 'var(--vp-text)', fontSize: 17, fontWeight: 900, margin: 0, lineHeight: 1.15 }}>
              {currentLevel.name}
            </h3>
            <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: '4px 0 0' }}>
              {nextLevel ? `Siguiente rango: ${nextLevel.name}` : 'Nivel máximo alcanzado'}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: tone.color, fontSize: 20, fontWeight: 900, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {totalXP.toLocaleString()}
          </p>
          <p style={{ color: 'var(--vp-muted)', fontSize: 10, fontWeight: 700, margin: 0 }}>XP total</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ color: 'var(--vp-muted)', fontSize: 10, fontWeight: 700 }}>
            {nextLevel ? 'Progreso del nivel' : 'Progreso completado'}
          </span>
          <span style={{ color: tone.color, fontSize: 10, fontWeight: 800 }}>
            {nextLevel ? `${xpInLevel} / ${xpNeeded} XP` : '100%'}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 8, background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${nextLevel ? progressPct : 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: tone.color, borderRadius: 8 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" style={{ marginTop: 14 }}>
        <ProgressStat label="Misiones" value={`${completedMissions}/${missions.length}`} tone="accent" />
        <ProgressStat label="Logros" value={`${unlockedCount}/${achievements.length}`} tone="amber" />
        <ProgressStat label="Estado" value={nextLevel ? `${progressPct}%` : 'Max'} tone="neutral" />
      </div>
    </motion.section>
  );
}

function ProgressStat({ label, value, tone }) {
  const styles = {
    accent: { color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' },
    amber: { color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' },
    neutral: { color: 'var(--vp-text-soft)', bg: 'var(--vp-surface-raised)', border: 'var(--vp-border)' },
  }[tone];

  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: styles.bg, border: `1px solid ${styles.border}` }}>
      <p style={{ color: 'var(--vp-muted)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>
        {label}
      </p>
      <p style={{ color: styles.color, fontSize: 14, fontWeight: 900, margin: 0 }}>{value}</p>
    </div>
  );
}

function MissionsCard({ g, navigate, showAll, setShowAll }) {
  const displayed = showAll ? g.missions : g.missions.slice(0, 3);

  return (
    <SectionCard
      icon={Target}
      title="Misiones"
      count={`${g.completedMissions}/${g.missions.length}`}
      tone="accent"
      action={g.missions.length > 3 ? (showAll ? 'Ver menos' : 'Ver todas') : null}
      onAction={() => setShowAll(!showAll)}
    >
      <div className="space-y-2">
        <AnimatePresence>
          {displayed.map((mission, index) => (
            <MissionRow
              key={mission.id}
              mission={mission}
              index={index}
              onClick={() => !mission.completed && navigate(mission.route)}
            />
          ))}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}

function MissionRow({ mission, index, onClick }) {
  const tone = completionTone(mission.completed);
  const Icon = MISSION_ICONS[mission.id] || Target;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      disabled={mission.completed}
      whileHover={!mission.completed ? { x: 2 } : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 12px',
        borderRadius: 10,
        background: mission.completed ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
        border: `1px solid ${mission.completed ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
        cursor: mission.completed ? 'default' : 'pointer',
        textAlign: 'left',
      }}
    >
      <StatusIcon Icon={Icon} tone={tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 800, margin: 0 }}>
            {mission.label}
          </p>
          <span style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 999, padding: '1px 6px', fontSize: 8, fontWeight: 800 }}>
            {tone.label}
          </span>
        </div>
        <p style={{ color: 'var(--vp-muted)', fontSize: 10, lineHeight: 1.4, margin: '2px 0 0' }}>
          {mission.desc}
        </p>
      </div>
      <RewardBadge xp={mission.xp} done={mission.completed} />
      {!mission.completed && <ChevronRight size={14} style={{ color: 'var(--vp-subtle)', flexShrink: 0 }} />}
    </motion.button>
  );
}

function AchievementsCard({ g, showAll, setShowAll }) {
  const displayed = showAll ? g.achievements : g.achievements.slice(0, 4);

  return (
    <SectionCard
      icon={Medal}
      title="Logros"
      count={`${g.unlockedCount}/${g.achievements.length}`}
      tone="amber"
      action={g.achievements.length > 4 ? (showAll ? 'Ver menos' : 'Ver todos') : null}
      onAction={() => setShowAll(!showAll)}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AnimatePresence>
          {displayed.map((achievement, index) => (
            <AchievementRow key={achievement.id} achievement={achievement} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </SectionCard>
  );
}

function AchievementRow({ achievement, index }) {
  const tone = completionTone(achievement.unlocked);
  const Icon = ACHIEVEMENT_ICONS[achievement.id] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ delay: index * 0.04 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 12px',
        borderRadius: 10,
        background: achievement.unlocked ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
        border: `1px solid ${achievement.unlocked ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
      }}
    >
      <StatusIcon Icon={achievement.unlocked ? Icon : LockKeyhole} tone={tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 800, margin: 0 }}>
          {achievement.label}
        </p>
        <p style={{ color: 'var(--vp-muted)', fontSize: 10, lineHeight: 1.4, margin: '2px 0 0' }}>
          {achievement.desc}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <span style={{ color: tone.color, fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {achievement.unlocked ? 'Desbloqueado' : 'Pendiente'}
          </span>
          <RewardBadge xp={achievement.xp} done={achievement.unlocked} />
        </div>
      </div>
    </motion.div>
  );
}

function SectionCard({ icon: Icon, title, count, tone, action, onAction, children }) {
  const styles = tone === 'amber'
    ? { color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' }
    : { color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
      }}
    >
      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 30, height: 30, borderRadius: 9, background: styles.bg, border: `1px solid ${styles.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color: styles.color }} />
          </div>
          <h4 style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 900, margin: 0 }}>
            {title}
          </h4>
          <span style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color, fontSize: 9, fontWeight: 900, padding: '1px 7px', borderRadius: 999 }}>
            {count}
          </span>
        </div>
        {action && (
          <button
            type="button"
            onClick={onAction}
            style={{
              background: 'var(--vp-surface-raised)',
              border: '1px solid var(--vp-border)',
              color: 'var(--vp-text-soft)',
              borderRadius: 8,
              padding: '5px 9px',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function StatusIcon({ Icon, tone }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: tone.bg, border: `1px solid ${tone.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} style={{ color: tone.color }} />
    </div>
  );
}

function RewardBadge({ xp, done }) {
  return (
    <span
      style={{
        color: done ? 'var(--vp-accent)' : 'var(--vp-amber)',
        background: done ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)',
        border: `1px solid ${done ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)'}`,
        borderRadius: 999,
        padding: '2px 7px',
        fontSize: 8,
        fontWeight: 900,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      +{xp} XP
    </span>
  );
}
