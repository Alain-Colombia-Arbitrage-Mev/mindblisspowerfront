/**
 * MASTER PROFILE CARD
 * Displays top showcase account using shared data service
 * Used by both user dashboard and admin overview
 */

import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Zap } from 'lucide-react';
import dashboardDataService from '@/lib/DashboardDataService';

export default function MasterProfileCard({ onSelectMember, isAdmin = false }) {
  const masterProfile = dashboardDataService.getMasterProfile();

  if (!masterProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl text-center"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Master profile loading...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelectMember?.(masterProfile.id)}
      className={`p-6 rounded-2xl cursor-pointer transition-all ${isAdmin ? 'hover:border-blue-400' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
        border: '1px solid rgba(139,92,246,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            👑 Master Account
          </p>
          <h3 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '6px 0 0' }}>
            {masterProfile.full_name}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
            {masterProfile.rank} • {masterProfile.country}
          </p>
        </div>
        <span
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: 'rgba(16,185,129,0.15)',
            color: '#10b981',
          }}
        >
          ✓ Activo
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users, label: 'Red Activa', value: masterProfile.deep_generation || 0, color: '#10b981' },
          { icon: TrendingUp, label: 'Inversión Personal', value: `$${masterProfile.personal_investment?.toLocaleString() || 0}`, color: '#3b82f6' },
          { icon: DollarSign, label: 'Inversión de Red', value: `$${masterProfile.network_investment?.toLocaleString() || 0}`, color: '#fb923c' },
          { icon: Zap, label: 'Ingresos Mes', value: `$${masterProfile.monthly_income?.toLocaleString() || 0}`, color: '#a855f7' },
        ].map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${metric.color}30` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={14} style={{ color: metric.color }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0, fontWeight: 700 }}>
                  {metric.label}
                </p>
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 900, margin: 0 }}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Binary Structure */}
      <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex-1">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Línea Izquierda</p>
          <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 900, margin: 0 }}>{masterProfile.left_count}</p>
        </div>
        <div className="flex-1">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Línea Derecha</p>
          <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 900, margin: 0 }}>{masterProfile.right_count}</p>
        </div>
        <div className="flex-1">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Referidos Directos</p>
          <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 900, margin: 0 }}>{masterProfile.direct_referrals}</p>
        </div>
      </div>

      {isAdmin && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '12px 0 0', fontStyle: 'italic' }}>
          Haz clic para ver ADN completo →
        </p>
      )}
    </motion.div>
  );
}