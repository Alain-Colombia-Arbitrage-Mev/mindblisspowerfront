import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/admin/AnimatedNumber';
import { Zap, Target, TrendingUp, BarChart3 } from 'lucide-react';

export default function WarRoomScreen6Marketing({ sim, presentationMode }) {
  const campaigns = [
    { name: 'LATAM Growth Push', impressions: '184K', clicks: '12.4K', conversions: 847, ctr: '6.7%', cvr: '6.8%', status: 'active', color: '#3b82f6' },
    { name: 'APAC Expansion', impressions: '128K', clicks: '8.2K', conversions: 612, ctr: '6.4%', cvr: '7.5%', status: 'active', color: '#10b981' },
    { name: 'Email Nurture Series', impressions: '94K', clicks: '7.1K', conversions: 568, ctr: '7.6%', cvr: '8.0%', status: 'active', color: '#8b5cf6' },
    { name: 'Referral Incentive A/B', impressions: '56K', clicks: '4.2K', conversions: 284, ctr: '7.5%', cvr: '6.8%', status: 'testing', color: '#fb923c' },
  ];

  const metrics = [
    { label: 'Total Impressions', value: '462K', icon: BarChart3, color: '#3b82f6' },
    { label: 'Click-Through Rate', value: '6.8%', icon: Target, color: '#06b6d4' },
    { label: 'Conversions Today', value: '2,311', icon: TrendingUp, color: '#10b981' },
  ];

  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>Campaigns & Marketing Intelligence</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Real-time campaign performance and growth metrics</p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-8 flex items-start gap-6 premium-card data-glow"
              style={{
                background: `linear-gradient(135deg, ${metric.color}08 0%, ${metric.color}04 100%)`,
                border: `1.5px solid ${metric.color}30`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.08), 0 12px 48px ${metric.color}20`
              }}
              whileHover={{ y: -4, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 16px 56px ${metric.color}35` }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${metric.color}18` }}>
                <Icon size={28} style={{ color: metric.color }} />
              </div>
              <div className="flex-1">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                  {metric.label.toUpperCase()}
                </p>
                <AnimatedNumber
                  value={metric.value}
                  style={{ color: metric.color, fontSize: 28, fontWeight: 900, margin: '6px 0 0', display: 'block', letterSpacing: -0.5 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Campaign Table */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>ACTIVE CAMPAIGNS</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-4">
          {campaigns.map((campaign, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-xl p-6 premium-card transition-all"
              style={{
                background: `linear-gradient(135deg, ${campaign.color}06 0%, ${campaign.color}02 100%)`,
                border: `1.5px solid ${campaign.color}25`,
                boxShadow: `inset 0 1px 2px rgba(255,255,255,0.06), 0 8px 24px ${campaign.color}15`
              }}
              whileHover={{ y: -3, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1), 0 12px 32px ${campaign.color}25` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>{campaign.name}</p>
                  <span className="inline-block px-2 py-1 rounded text-xs font-bold mt-2" style={{ background: `${campaign.color}20`, color: campaign.color }}>
                    {campaign.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: campaign.color, fontSize: 20, fontWeight: 900, margin: 0 }}>{campaign.conversions}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>conversions</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Impressions</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, margin: '4px 0 0' }}>{campaign.impressions}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Clicks</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, margin: '4px 0 0' }}>{campaign.clicks}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>CTR</p>
                  <p style={{ color: campaign.color, fontSize: 14, fontWeight: 700, margin: '4px 0 0' }}>{campaign.ctr}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>CVR</p>
                  <p style={{ color: campaign.color, fontSize: 14, fontWeight: 700, margin: '4px 0 0' }}>{campaign.cvr}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}