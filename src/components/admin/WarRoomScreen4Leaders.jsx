import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/admin/AnimatedNumber';
import { Users, Globe, TrendingUp, Award } from 'lucide-react';

export default function WarRoomScreen4Leaders({ sim, presentationMode }) {
  const kpis = sim.kpis;

  const regions = [
    { name: 'Latin America', leaders: 58, growth: '+14%', color: '#ef4444' },
    { name: 'Europe', leaders: 47, growth: '+8%', color: '#3b82f6' },
    { name: 'Asia-Pacific', leaders: 38, growth: '+22%', color: '#10b981' },
    { name: 'Middle East', leaders: 20, growth: '+5%', color: '#fb923c' },
  ];

  const leaderStats = [
    { label: 'Certified Leaders', value: kpis.activeLeaders, icon: Award, color: '#8b5cf6' },
    { label: 'Network Nodes', value: '1,247', icon: Globe, color: '#06b6d4' },
    { label: 'Direct Members', value: kpis.totalParticipants, icon: Users, color: '#10b981' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>Leaders & Network Expansion</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Global leader metrics and network growth</p>
      </motion.div>

      <div className="flex-1 flex gap-12">
        {/* Left: Regional Breakdown */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: '0 0 8px', letterSpacing: 1 }}>REGIONAL DISTRIBUTION</h2>
          {regions.map((region, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl p-6 premium-card transition-all"
              style={{
                background: `linear-gradient(135deg, ${region.color}06 0%, ${region.color}02 100%)`,
                border: `1.5px solid ${region.color}25`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 24px ${region.color}15`
              }}
              whileHover={{ y: -3, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1), 0 12px 32px ${region.color}25` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{region.name}</p>
                <span style={{ color: region.color, fontSize: 14, fontWeight: 700 }}>{region.growth}</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(region.leaders / 60) * 100}%`,
                    background: `linear-gradient(90deg, ${region.color}, ${region.color}dd)`,
                    boxShadow: `0 0 12px ${region.color}40`,
                  }}
                />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '6px 0 0', textAlign: 'right' }}>
                {region.leaders} leaders
              </p>
            </motion.div>
          ))}
        </div>

        {/* Right: Key Stats */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {leaderStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl p-8 flex items-start gap-6 premium-card data-glow"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}08 0%, ${stat.color}04 100%)`,
                    border: `1.5px solid ${stat.color}30`,
                    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.08), 0 12px 48px ${stat.color}20`
                  }}
                  whileHover={{ y: -4, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 16px 56px ${stat.color}35` }}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}18` }}>
                    <Icon size={28} style={{ color: stat.color }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                      {stat.label.toUpperCase()}
                    </p>
                    <AnimatedNumber
                      value={typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                      style={{ color: stat.color, fontSize: 32, fontWeight: 900, margin: '6px 0 0', display: 'block', letterSpacing: -0.5 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Network Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl premium-card data-glow"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)',
              border: '1.5px solid rgba(16,185,129,0.35)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.08), 0 12px 40px rgba(16,185,129,0.2)'
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 1 }}>NETWORK HEALTH</p>
            <p style={{ color: '#10b981', fontSize: 24, fontWeight: 900, margin: '8px 0 0' }}>Expanding</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>All regions growing YoY</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}