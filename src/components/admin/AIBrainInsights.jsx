import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertCircle, Star } from 'lucide-react';

export default function AIBrainInsights({ insights }) {
  if (!insights) return null;

  const { top_leaders, high_value_users, growing_networks, at_risk_users, platform_stats } = insights;

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Usuarios', value: platform_stats.total_users, color: '#3b82f6' },
          { label: 'Usuarios Activos', value: platform_stats.active_users, color: '#10b981' },
          { label: 'Volumen Total', value: `$${(platform_stats.total_volume / 1000).toFixed(1)}K`, color: '#8b5cf6' },
          { label: 'Líderes', value: platform_stats.total_leaders, color: '#fb923c' },
        ].map((stat, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 4px 0' }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Top Leaders */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="p-4 border-b border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#8b5cf6', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            🏆 Top Líderes
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {top_leaders?.slice(0, 5).map((leader, i) => (
            <div key={i} className="p-3 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>
                  #{i + 1} {leader.name}
                </p>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
                  Score: {Math.round(leader.score)}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Red: {leader.network_size} miembros · Activos: {leader.active_members} · Volumen: ${leader.volume.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* High Value Users */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="p-4 border-b border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#8b5cf6', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            💎 Usuarios de Alto Valor
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {high_value_users?.slice(0, 5).map((user, i) => (
            <div key={i} className="p-3 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
                    {user.full_name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
                    {user.email}
                  </p>
                </div>
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                  ${user.investment_total.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Growing Networks */}
      {growing_networks?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
              📈 Redes en Crecimiento
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {growing_networks.map((net, i) => (
              <div key={i} className="p-3 hover:bg-white/5 transition-all">
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
                  {net.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                  Crecimiento: +{net.network_size} miembros · Score: {Math.round(net.score)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* At Risk Users */}
      {at_risk_users?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
              ⚠️ Usuarios en Riesgo
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {at_risk_users.slice(0, 5).map((user, i) => (
              <div key={i} className="p-3 hover:bg-white/5 transition-all">
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
                  {user.full_name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                  Inversión: ${user.investment_total} · Estado: {user.status}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}