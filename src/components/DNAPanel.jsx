/**
 * DNA PANEL — SYNCHRONIZED DISPLAY
 * Shows member/leader details from shared source
 * Used by both user dashboard and admin panels
 */

import { motion } from 'framer-motion';
import { X, Users, TrendingUp, DollarSign, AlertCircle, Zap } from 'lucide-react';
import dashboardDataService from '@/lib/DashboardDataService';

export default function DNAPanel({ userId, onClose, isAdmin = false }) {
  const dna = dashboardDataService.getMemberDNA(userId);

  if (!dna) return null;

  const handleHistoryClick = () => {
    // Action uses real shared data
    console.log(`📋 Loading history for ${dna.full_name}...`);
  };

  const handleAuditClick = () => {
    // Action uses real shared data
    console.log(`🔍 Auditing network for ${dna.full_name}...`);
  };

  const handleInterventionClick = () => {
    // Action uses real shared data
    console.log(`🎯 Manual intervention for ${dna.full_name}...`);
  };

  const handleAIClick = () => {
    // Action uses real shared data
    console.log(`🤖 Executing AI action for ${dna.full_name}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="w-96 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(4,10,22,0.7)',
        border: '1px solid rgba(59,130,246,0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          ADN DEL MIEMBRO
        </p>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* STATUS BADGE */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{
              background: dna.status === 'activo' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: dna.status === 'activo' ? '#10b981' : '#ef4444',
            }}
          >
            {dna.status === 'activo' ? '✓ Activo' : '⚠ ' + dna.status}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }}>
            {dna.country} • {dna.role}
          </span>
        </div>

        {/* NAME & RANK */}
        <div>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 4px 0' }}>
            {dna.full_name}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
            {dna.rank} • {dna.personal_plan}
          </p>
        </div>

        {/* KEY METRICS GRID */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {[
            { icon: Users, label: 'Red Activa', value: dna.deep_generation, color: '#10b981' },
            { icon: TrendingUp, label: 'Inversión Personal', value: `$${dna.personal_investment?.toLocaleString() || 0}`, color: '#3b82f6' },
            { icon: DollarSign, label: 'Inversión de Red', value: `$${dna.network_investment?.toLocaleString() || 0}`, color: '#fb923c' },
            { icon: AlertCircle, label: 'Alertas', value: dna.alerts_count || 0, color: dna.alerts_count > 0 ? '#ef4444' : '#10b981' },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${metric.color}30` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: metric.color }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>
                    {metric.label}
                  </p>
                </div>
                <p style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: 0 }}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* NETWORK STRUCTURE */}
        <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Estructura Binaria
          </p>
          {[
            { label: 'Línea Izquierda', value: dna.left_count },
            { label: 'Línea Derecha', value: dna.right_count },
            { label: 'Referidos Directos', value: dna.direct_referrals },
            { label: 'Profundidad', value: `Nivel ${dna.generation_depth}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 900 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* FINANCIAL STATE */}
        <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Estado Financiero
          </p>
          {[
            { label: 'Ingresos Mes', value: `$${dna.monthly_income?.toLocaleString() || 0}`, color: '#10b981' },
            { label: 'Estado Pago', value: dna.payment_state, color: '#3b82f6' },
            { label: 'Estado Renovación', value: dna.renewal_state, color: dna.renewal_state === 'en revisión' ? '#fb923c' : '#10b981' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: item.color, fontSize: 11, fontWeight: 900 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* RELATIONSHIP INFO */}
        {dna.upline && (
          <div className="pt-2 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, margin: 0 }}>PATROCINADOR</p>
            <p style={{ color: '#8b5cf6', fontSize: 11, fontWeight: 900, margin: '4px 0 0 0' }}>{dna.upline}</p>
          </div>
        )}

        {/* ALERTS IF ANY */}
        {dna.alerts_count > 0 && (
          <div className="pt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, margin: 0 }}>
                  {dna.alerts_count} Alerta{dna.alerts_count !== 1 ? 's' : ''}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                  Requiere atención
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS — Only shown in admin mode */}
        {isAdmin && (
          <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleHistoryClick}
              className="w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: 'rgba(59,130,246,0.15)',
                color: '#3b82f6',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              📋 Ver Historial
            </button>
            <button
              onClick={handleAuditClick}
              className="w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.3)',
              }}
            >
              🔍 Auditar Red
            </button>
            <button
              onClick={handleInterventionClick}
              className="w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              🎯 Intervención Manual
            </button>
            <button
              onClick={handleAIClick}
              className="w-full px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.3)',
              }}
            >
              <Zap size={12} /> Ejecutar Acción IA
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}