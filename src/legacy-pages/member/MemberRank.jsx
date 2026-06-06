import { useState, useMemo } from 'react';
import { TrendingUp, Users, Target, CheckCircle, Lock, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants, getUserInvestment, getNetworkInvestment } from '@/lib/warRoomDataAdapter';

const RANK_LADDER = [
  { rank: 'Principiante', investment: 0, directReferrals: 0, networkActive: 0, position: 0 },
  { rank: 'Bronce', investment: 500, directReferrals: 2, networkActive: 2, position: 1 },
  { rank: 'Plata', investment: 1500, directReferrals: 4, networkActive: 4, position: 2 },
  { rank: 'Oro', investment: 3000, directReferrals: 6, networkActive: 6, position: 3 },
  { rank: 'Platino', investment: 5000, directReferrals: 8, networkActive: 8, position: 4 },
  { rank: 'Zafiro', investment: 8000, directReferrals: 12, networkActive: 10, position: 5 },
  { rank: 'Rubí', investment: 12000, directReferrals: 15, networkActive: 15, position: 6 },
  { rank: 'Esmeralda', investment: 18000, directReferrals: 20, networkActive: 20, position: 7 },
  { rank: 'Diamante', investment: 25000, directReferrals: 25, networkActive: 25, position: 8 },
  { rank: 'Diamante Azul', investment: 40000, directReferrals: 35, networkActive: 35, position: 9 },
  { rank: 'Diamante Negro', investment: 60000, directReferrals: 50, networkActive: 50, position: 10 },
  { rank: 'Corona', investment: 100000, directReferrals: 75, networkActive: 75, position: 11 },
];

export default function MemberRank() {
  const userId = localStorage.getItem('user_id');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const descendants = useMemo(() => {
    return getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
  }, [userId]);

  const metrics = useMemo(() => {
    const personalInvestment = getUserInvestment(userId) || 0;
    const networkInvestment = getNetworkInvestment(userId) || 0;
    const directReferrals = platformDataCore.network_nodes.filter(n => n.upline_id === userId).length;
    const activeMembers = descendants.filter(d => d.status === 'activo').length;

    return {
      personalInvestment,
      networkInvestment,
      totalInvestment: personalInvestment + networkInvestment,
      directReferrals,
      activeMembers,
      descendants: descendants.length,
    };
  }, [userId, descendants]);

  // Find current and next rank
  const currentRankIndex = RANK_LADDER.findIndex(r => r.rank === (userData.rank || 'Principiante'));
  const currentRank = RANK_LADDER[currentRankIndex];
  const nextRank = currentRankIndex < RANK_LADDER.length - 1 ? RANK_LADDER[currentRankIndex + 1] : null;

  // Calculate progress towards next rank
  const progressMetrics = useMemo(() => {
    if (!nextRank) return { investment: 100, referrals: 100, active: 100 };

    const investmentDelta = nextRank.investment - (currentRank?.investment || 0);
    const currentDelta = metrics.totalInvestment - (currentRank?.investment || 0);
    const investmentProgress = Math.min(100, (currentDelta / investmentDelta) * 100);

    const referralsDelta = nextRank.directReferrals - (currentRank?.directReferrals || 0);
    const currentReferralDelta = metrics.directReferrals - (currentRank?.directReferrals || 0);
    const referralsProgress = Math.min(100, (currentReferralDelta / referralsDelta) * 100);

    const activeDelta = nextRank.networkActive - (currentRank?.networkActive || 0);
    const currentActiveDelta = metrics.activeMembers - (currentRank?.networkActive || 0);
    const activeProgress = Math.min(100, (currentActiveDelta / activeDelta) * 100);

    return {
      investment: investmentProgress,
      referrals: referralsProgress,
      active: activeProgress,
    };
  }, [metrics, currentRank, nextRank]);

  const recommendations = useMemo(() => {
    const recs = [];
    if (!nextRank) return recs;

    const investmentGap = nextRank.investment - metrics.totalInvestment;
    if (investmentGap > 0) {
      recs.push({
        type: 'investment',
        priority: investmentGap < 1000 ? 'high' : 'medium',
        label: 'Inversión Requerida',
        current: `$${metrics.totalInvestment.toLocaleString()}`,
        required: `$${nextRank.investment.toLocaleString()}`,
        gap: `$${Math.round(investmentGap).toLocaleString()}`,
      });
    }

    const referralGap = nextRank.directReferrals - metrics.directReferrals;
    if (referralGap > 0) {
      recs.push({
        type: 'referrals',
        priority: referralGap < 3 ? 'high' : 'medium',
        label: 'Directos Requeridos',
        current: metrics.directReferrals,
        required: nextRank.directReferrals,
        gap: referralGap,
      });
    }

    const activeGap = nextRank.networkActive - metrics.activeMembers;
    if (activeGap > 0) {
      recs.push({
        type: 'activity',
        priority: activeGap < 5 ? 'high' : 'medium',
        label: 'Miembros Activos',
        current: metrics.activeMembers,
        required: nextRank.networkActive,
        gap: activeGap,
      });
    }

    return recs;
  }, [metrics, nextRank]);

  return (
    <div className="p-8 space-y-8 max-w-6xl" style={{ background: '#05070D', minHeight: '100vh' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>Panel · Rango</p>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Progresión de Rango</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          Tu camino hacia el liderazgo en la plataforma
        </p>
      </motion.div>

      {/* CURRENT RANK BANNER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ padding: '32px 36px', borderRadius: 20, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #080D1C 0%, #0C1630 100%)', border: '1px solid rgba(59,130,246,0.18)', boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 700px 400px at 15% 60%, rgba(59,130,246,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 300px 300px at 85% 40%, rgba(124,58,237,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Current rank identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            {/* Rank emblem — numerical, not iconographic */}
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(145deg, #0d1f3c 0%, #162540 100%)', border: '1px solid rgba(59,130,246,0.28)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(59,130,246,0.12), inset 0 1px 1px rgba(255,255,255,0.07)' }}>
              <p style={{ color: '#3b82f6', fontSize: 8, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Nivel</p>
              <p style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>{currentRankIndex + 1}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px 0' }}>Rango Actual</p>
              <h2 style={{ color: 'white', fontSize: 30, fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.8px' }}>{userData.rank || 'Principiante'}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93C5FD', fontSize: 9, fontWeight: 700 }}>
                  Posición {currentRankIndex + 1} / {RANK_LADDER.length}
                </span>
                {currentRankIndex > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 600 }}>
                    {currentRankIndex} rangos desbloqueados
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Next rank */}
          {nextRank && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 10px 0' }}>Siguiente Rango</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#A78BFA', fontSize: 14, fontWeight: 900, margin: 0 }}>{currentRankIndex + 2}</p>
                </div>
                <div>
                  <p style={{ color: '#C4B5FD', fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>{nextRank.rank}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '2px 0 0 0' }}>Próximo objetivo</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* PROGRESS TOWARD NEXT RANK */}
      {nextRank && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-lg"
          style={{
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Progreso hacia {nextRank.rank}</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Inversión', progress: progressMetrics.investment, current: `$${metrics.totalInvestment.toLocaleString()}`, required: `$${nextRank.investment.toLocaleString()}`, color: '#93C5FD', bar: 'linear-gradient(90deg,#1d6ef5,#3b82f6)' },
              { label: 'Directos',  progress: progressMetrics.referrals,  current: metrics.directReferrals,  required: nextRank.directReferrals,  color: '#93C5FD', bar: 'linear-gradient(90deg,#1d6ef5,#3b82f6)' },
              { label: 'Activos',   progress: progressMetrics.active,      current: metrics.activeMembers,    required: nextRank.networkActive,    color: '#A78BFA', bar: 'linear-gradient(90deg,#5b21b6,#7C3AED)' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, margin: 0 }}>
                    {item.label}
                  </p>
                  <span style={{ color: item.color, fontSize: 10, fontWeight: 700 }}>
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: item.bar, borderRadius: 3 }}
                  />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                  {item.current} / {item.required}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* RANK LADDER — ceremonial, not childish */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ borderRadius: 16, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Estructura de Rangos</p>
        </div>
        <div style={{ padding: '8px 0' }}>
          {RANK_LADDER.map((rank, i) => {
            const isUnlocked = currentRankIndex >= i;
            const isCurrent = userData.rank === rank.rank;
            const isNext = i === currentRankIndex + 1;
            return (
              <div key={rank.rank} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 22px',
                background: isCurrent ? 'rgba(59,130,246,0.07)' : isNext ? 'rgba(124,58,237,0.04)' : 'transparent',
                borderLeft: isCurrent ? '2px solid rgba(59,130,246,0.5)' : isNext ? '2px solid rgba(124,58,237,0.3)' : '2px solid transparent',
                opacity: (!isUnlocked && !isNext) ? 0.45 : 1,
                transition: 'all 200ms ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  {/* Rank number pill */}
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCurrent ? 'rgba(59,130,246,0.15)' : isNext ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCurrent ? 'rgba(59,130,246,0.35)' : isNext ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#93C5FD' : isNext ? '#C4B5FD' : 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: isCurrent ? 'white' : isNext ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: isCurrent ? 800 : 600, margin: '0 0 3px 0' }}>
                      {rank.rank}
                      {isCurrent && <span style={{ color: '#93C5FD', marginLeft: 8, fontSize: 8, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>· Activo</span>}
                      {isNext && <span style={{ color: '#C4B5FD', marginLeft: 8, fontSize: 8, fontWeight: 700 }}>· Siguiente</span>}
                    </p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                      <span>${rank.investment.toLocaleString()}</span>
                      <span>·</span>
                      <span>{rank.directReferrals} directos</span>
                      <span>·</span>
                      <span>{rank.networkActive} activos</span>
                    </div>
                  </div>
                </div>
                <div style={{ color: isCurrent ? '#3b82f6' : isUnlocked ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)' }}>
                  {isUnlocked ? <CheckCircle size={14} strokeWidth={2} /> : <Lock size={12} strokeWidth={1.5} />}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-lg"
          style={{
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
            Recomendaciones para {nextRank.rank}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg flex items-start gap-4"
                style={{
                  background: 'rgba(8,18,40,0.6)',
                  borderLeft: `2px solid ${rec.priority === 'high' ? '#7C3AED' : 'rgba(59,130,246,0.4)'}`,
                  border: '1px solid rgba(59,130,246,0.08)',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: rec.priority === 'high' ? '#7C3AED' : 'rgba(59,130,246,0.5)' }} />
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                    {rec.label}
                    {rec.priority === 'high' && <span style={{ color: '#A78BFA', marginLeft: 8, fontSize: 9 }}>● Prioritario</span>}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>
                    Actual: {rec.current} → Requerido: {rec.required}
                    {typeof rec.gap === 'number' && <span style={{ color: rec.priority === 'high' ? '#A78BFA' : '#93C5FD', fontWeight: 700 }}> (Faltan {rec.gap})</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* KEY MEMBERS FOR GROWTH */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-lg"
        style={{
          background: 'rgba(8,18,40,0.8)',
          border: '1px solid rgba(59,130,246,0.1)',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
          Miembros Clave
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 12px 0' }}>
          Enfócate en activar y desarrollar a estos miembros para acelerar tu progresión
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Más Activos', value: metrics.activeMembers, unit: 'miembros' },
            { label: 'Directos Totales', value: metrics.directReferrals, unit: 'referidos' },
            { label: 'Red Profunda', value: descendants.length, unit: 'descendientes' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.08)' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>
                {item.label}
              </p>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 2px 0' }}>
                {item.value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: 0 }}>
                {item.unit}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* METHODOLOGY */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-lg"
        style={{
          background: 'rgba(8,18,40,0.6)',
          border: '1px solid rgba(59,130,246,0.1)',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#93C5FD' }}>Nota:</strong> Cada rango requiere inversión personal, directos y activos en tu red. Completa los tres requisitos para desbloquear el siguiente rango.
        </p>
      </motion.div>
    </div>
  );
}