import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ViralMonitor() {
  const [timeframe, setTimeframe] = useState('week');

  // Daily viral metrics
  const dailyData = [
    { date: 'Mon', invitesSent: 142, invitesAccepted: 28, conversionRate: 19.7, viralCoef: 1.12 },
    { date: 'Tue', invitesSent: 168, invitesAccepted: 36, conversionRate: 21.4, viralCoef: 1.28 },
    { date: 'Wed', invitesSent: 195, invitesAccepted: 48, conversionRate: 24.6, viralCoef: 1.42 },
    { date: 'Thu', invitesSent: 234, invitesAccepted: 62, conversionRate: 26.5, viralCoef: 1.58 },
    { date: 'Fri', invitesSent: 287, invitesAccepted: 84, conversionRate: 29.3, viralCoef: 1.76 },
    { date: 'Sat', invitesSent: 156, invitesAccepted: 38, conversionRate: 24.4, viralCoef: 1.35 },
    { date: 'Sun', invitesSent: 98, invitesAccepted: 18, conversionRate: 18.4, viralCoef: 0.95 }
  ];

  // Weekly viral metrics
  const weeklyData = [
    { week: 'W1', invitesSent: 840, invitesAccepted: 154, conversionRate: 18.3, viralCoef: 1.08 },
    { week: 'W2', invitesSent: 1260, invitesAccepted: 285, conversionRate: 22.6, viralCoef: 1.35 },
    { week: 'W3', invitesSent: 1890, invitesAccepted: 512, conversionRate: 27.1, viralCoef: 1.62 },
    { week: 'W4', invitesSent: 2450, invitesAccepted: 762, conversionRate: 31.1, viralCoef: 1.94 }
  ];

  const chartData = timeframe === 'week' ? dailyData : weeklyData;

  // Current totals
  const totalInvitesSent = 1280;
  const totalInvitesAccepted = 412;
  const overallConversionRate = (412 / 1280 * 100).toFixed(1);
  const currentViralCoef = 1.68;

  // Growth amplification
  const amplificationFactor = (currentViralCoef * 100 - 100).toFixed(1);
  const emailReach = Math.round(totalInvitesSent * 1.8);
  const estimatedNewUsers = Math.round(totalInvitesAccepted * 2.3);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Share2 size={24} style={{ color: '#ec4899' }} />
          <div className="flex-1">
            <p style={{ color: '#ec4899', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              GROWTH MULTIPLICATION
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Viral Monitor
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Track referral loops and measure viral coefficient for exponential growth
            </p>
          </div>
        </div>
      </motion.div>

      {/* Core Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            INVITES SENT
          </p>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: '0 0 4px 0' }}>
            {totalInvitesSent}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
            (+18% this week)
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            INVITES ACCEPTED
          </p>
          <p style={{ color: '#ec4899', fontSize: 32, fontWeight: 900, margin: '0 0 4px 0' }}>
            {totalInvitesAccepted}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
            (+22% this week)
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            CONVERSION RATE
          </p>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: '0 0 4px 0' }}>
            {overallConversionRate}%
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
            Accepted/Sent ratio
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            VIRAL COEFFICIENT
          </p>
          <p style={{ color: '#fb923c', fontSize: 32, fontWeight: 900, margin: '0 0 4px 0' }}>
            {currentViralCoef}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
            Growth multiplier
          </p>
        </div>
      </motion.div>

      {/* Growth Amplification */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              GROWTH AMPLIFICATION
            </p>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
              +{amplificationFactor}% Exponential Growth
            </p>
          </div>
          <div style={{ fontSize: 48 }}>🚀</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
              Email Network Reach
            </p>
            <p style={{ color: '#a855f7', fontSize: 20, fontWeight: 900, margin: 0 }}>
              {emailReach.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
              Estimated New Users (Secondary)
            </p>
            <p style={{ color: '#a855f7', fontSize: 20, fontWeight: 900, margin: 0 }}>
              {estimatedNewUsers.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
              Feedback Loop Status
            </p>
            <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700, margin: 0 }}>
              ✓ Active & Accelerating
            </p>
          </div>
        </div>
      </motion.div>

      {/* Viral Metrics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
            Viral Loop Progression
          </p>
          <div className="flex gap-2">
            {['week', 'month'].map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: timeframe === period ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color: timeframe === period ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                  border: timeframe === period ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorInvites" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
            <XAxis dataKey={timeframe === 'week' ? 'date' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip
              contentStyle={{
                background: '#0a1628',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8
              }}
              labelStyle={{ color: 'white' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="invitesSent"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorInvites)"
              name="Invites Sent"
            />
            <Line type="monotone" dataKey="invitesAccepted" stroke="#ec4899" strokeWidth={2} name="Accepted" />
            <Line type="monotone" dataKey="conversionRate" stroke="#10b981" strokeWidth={2} name="Conv. Rate %" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Viral Coefficient Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(251,146,60,0.15)' }}
      >
        <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 24px 0' }}>
          Viral Coefficient Amplification
        </p>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
            <XAxis dataKey={timeframe === 'week' ? 'date' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip
              contentStyle={{
                background: '#0a1628',
                border: '1px solid rgba(251,146,60,0.3)',
                borderRadius: 8
              }}
              labelStyle={{ color: 'white' }}
            />
            <Line
              type="monotone"
              dataKey="viralCoef"
              stroke="#fb923c"
              strokeWidth={3}
              dot={{ fill: '#fb923c', r: 5 }}
              activeDot={{ r: 7 }}
              name="Viral Coefficient"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.1)' }}>
          <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
            ⚡ Coefficient Status
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
            Trending above 1.0 = Each user recruits &gt;1 new user → Exponential growth achieved. Current momentum: {currentViralCoef}x
          </p>
        </div>
      </motion.div>

      {/* Loop Health */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
            ✓ Loop Health
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Viral coefficient growing + high conversion rate = strong loop momentum
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
            📈 Growth Window
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Coef 1.68 sustains exponential growth if maintained for 4+ weeks
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
            🎯 Next Target
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Push viral coef to 2.0 = doubling user base weekly
          </p>
        </div>
      </motion.div>
    </div>
  );
}