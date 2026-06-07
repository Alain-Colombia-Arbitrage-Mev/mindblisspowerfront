import { Award, Lock, Star, TrendingUp, Zap } from 'lucide-react';

const C = ({ children, style }) => (
  <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20, ...style }}>
    {children}
  </div>
);
const Label = ({ children }) => (
  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: 14 }}>
    {children}
  </div>
);

const RANKS = [
  { level: 1,  name: 'Associate',     color: '#8b9ab0', glow: '#8b9ab0',  desc: 'Entry level — learning the system, first activation',          criteria: ['Activated account', 'Profile complete', 'Platform orientation'] },
  { level: 2,  name: 'Builder',        color: '#3b82f6', glow: '#3b82f6',  desc: 'Growing structure — first members, active participation',        criteria: ['3 direct members', '1,000 structure pts', 'Both sides active'] },
  { level: 3,  name: 'Coordinator',    color: '#06b6d4', glow: '#06b6d4',  desc: 'Organizing team — early leadership responsibilities',             criteria: ['6 direct members', '3,000 structure pts', 'Team coordination'] },
  { level: 4,  name: 'Manager',        color: '#10b981', glow: '#10b981',  desc: 'Stable structure — consistent activity across team',              criteria: ['10 direct members', '6,000 structure pts', 'Consistent cycles'] },
  { level: 5,  name: 'Director',       color: '#f59e0b', glow: '#f59e0b',  desc: 'Recognized leader — strong bilateral network',                   criteria: ['18 direct members', '12,000 structure pts', '60% team activity'] },
  { level: 6,  name: 'Executive',      color: '#e5e7eb', glow: '#c0c0c0',  desc: 'Advanced leadership — strategic growth across markets',           criteria: ['30 direct members', '25,000 structure pts', '2 Director legs'] },
  { level: 7,  name: 'Ambassador',     color: '#a78bfa', glow: '#a78bfa',  desc: 'Brand representative — large influence & international reach',    criteria: ['50 direct members', '50,000 structure pts', '3 Executive legs'] },
  { level: 8,  name: 'Presidential',   color: '#ef4444', glow: '#ef4444',  desc: 'Elite leadership — top-tier structure control & recognition',     criteria: ['80 direct members', '100,000 structure pts', '2 Ambassador legs'] },
  { level: 9,  name: 'Global Leader',  color: '#d4af37', glow: '#d4af37',  desc: 'International impact — highest field leadership recognition',     criteria: ['120 direct members', '250,000 structure pts', '3 Presidential legs'] },
  { level: 10, name: 'Chairman',       color: '#f8fafc', glow: '#e2e8f0',  desc: 'Legacy status — pinnacle of the Mindbliss Power structure',         criteria: ['200+ direct members', '500,000+ structure pts', 'Global presence'] },
];

// Current user is Director (level 5) — simulate unlock up to level 5
const CURRENT_LEVEL = 5;

const criteria = [
  { label: 'Direct Members',        current: 14,   target: 18,    unit: '' },
  { label: 'Active Structure Members', current: 11, target: 14,   unit: '' },
  { label: 'Left Structure Points', current: 3200, target: 6000,  unit: '' },
  { label: 'Right Structure Points',current: 2800, target: 6000,  unit: '' },
  { label: 'Team Activity Rate',    current: 78,   target: 100,   unit: '%' },
];

const rankHistory = [
  { level: 1, name: 'Associate',   date: '2025-01-15', duration: '20 days' },
  { level: 2, name: 'Builder',     date: '2025-02-04', duration: '26 days' },
  { level: 3, name: 'Coordinator', date: '2025-03-02', duration: '40 days' },
  { level: 4, name: 'Manager',     date: '2025-04-11', duration: '62 days' },
  { level: 5, name: 'Director',    date: '2025-06-12', duration: 'Ongoing' },
];

export default function DashProgression() {
  const current = RANKS[CURRENT_LEVEL - 1];
  const next = RANKS[CURRENT_LEVEL];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Progression & Level</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Your current status, advancement criteria, and progression history</p>
      </div>

      {/* Motivation strip */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { icon: Zap, msg: `You are 4 direct members away from ${next.name}`, color: '#3b82f6' },
          { icon: TrendingUp, msg: 'Your structure grew 18% this cycle', color: '#34d399' },
          { icon: Star, msg: 'You unlocked Leadership Alignment Incentive at Director', color: '#f59e0b' },
        ].map(({ icon: Icon, msg, color }) => (
          <div key={msg} style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 10, padding: '10px 14px' }}>
            <Icon size={14} style={{ color, flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.4 }}>{msg}</span>
          </div>
        ))}
      </div>

      {/* Current rank hero */}
      <div style={{ background: `linear-gradient(135deg, ${current.color}12, rgba(29,110,245,0.08))`, border: `1px solid ${current.color}35`, borderRadius: 20, padding: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${current.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg, ${current.color}30, ${current.color}15)`, border: `2px solid ${current.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 30px ${current.color}30` }}>
          <Award size={40} style={{ color: current.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: `${current.color}cc`, fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>LEVEL {current.level} — CURRENT STATUS</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 32, marginBottom: 6, textShadow: `0 0 30px ${current.color}50` }}>{current.name}</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.5, maxWidth: 380 }}>{current.desc}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '14px 20px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 }}>Next Level</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: next.color, fontSize: 16 }}>{next.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>Level {next.level}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 20px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10 }}>
            <div style={{ color: '#34d399', fontSize: 12, fontWeight: 700 }}>68% Progress</div>
          </div>
        </div>
      </div>

      {/* Criteria progress */}
      <C>
        <Label>Qualification Criteria — {next.name}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {criteria.map(c => {
            const pct = Math.min((c.current / c.target) * 100, 100);
            return (
              <div key={c.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{c.label}</span>
                  <span style={{ color: pct >= 100 ? '#34d399' : 'white', fontSize: 12, fontWeight: 600 }}>
                    {c.current.toLocaleString()}{c.unit} / {c.target.toLocaleString()}{c.unit}
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 100 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #1d6ef5, #3b82f6)', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3 }}>{pct >= 100 ? '✓ Requirement met' : `${Math.round(pct)}% — ${(c.target - c.current).toLocaleString()}${c.unit} remaining`}</div>
              </div>
            );
          })}
        </div>
      </C>

      {/* Full rank ladder */}
      <C>
        <Label>Full Level Ladder</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RANKS.map((rank) => {
            const unlocked = rank.level <= CURRENT_LEVEL;
            const isCurrent = rank.level === CURRENT_LEVEL;
            return (
              <div key={rank.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: isCurrent ? `${rank.color}12` : unlocked ? 'rgba(255,255,255,0.02)' : 'transparent', border: isCurrent ? `1px solid ${rank.color}40` : unlocked ? `1px solid rgba(255,255,255,0.07)` : '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
                {/* Level badge */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: unlocked ? `${rank.color}25` : 'rgba(255,255,255,0.04)', border: unlocked ? `2px solid ${rank.color}60` : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isCurrent ? `0 0 14px ${rank.color}40` : 'none' }}>
                  {unlocked
                    ? <Award size={15} style={{ color: rank.color }} />
                    : <Lock size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                </div>
                {/* Name + desc */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 13, color: unlocked ? 'white' : 'rgba(255,255,255,0.3)' }}>{rank.name}</span>
                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: rank.color, background: `${rank.color}20`, padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5 }}>CURRENT</span>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>{rank.desc}</div>
                </div>
                {/* Level number */}
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 11, color: unlocked ? rank.color : 'rgba(255,255,255,0.15)' }}>LVL {rank.level}</div>
              </div>
            );
          })}
        </div>
      </C>

      {/* Progression history */}
      <C>
        <Label>Progression History</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rankHistory.map((r, i) => {
            const rankDef = RANKS[r.level - 1];
            return (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: rankDef.color, boxShadow: `0 0 8px ${rankDef.color}60`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{r.name} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 400 }}>— Level {r.level}</span></div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Achieved {r.date}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{r.duration}</div>
                <span style={{ fontSize: 10, color: r.duration === 'Ongoing' ? '#34d399' : 'rgba(255,255,255,0.3)', background: r.duration === 'Ongoing' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                  {r.duration === 'Ongoing' ? 'Active' : 'Completed'}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.5 }}>
          Results depend on individual participation and activity. No specific progression outcomes are guaranteed.
        </div>
      </C>
    </div>
  );
}