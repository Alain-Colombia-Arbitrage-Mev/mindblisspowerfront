import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GrowthCharts({ timeframe, metric }) {
  // Sample data for different timeframes
  const chartData = {
    '7d': [
      { day: 'Sun', acquisition: 120, conversion: 8.2, retention: 68, referral: 22, roi: 2.1 },
      { day: 'Mon', acquisition: 156, conversion: 11.4, retention: 67.8, referral: 23.1, roi: 2.3 },
      { day: 'Tue', acquisition: 198, conversion: 12.1, retention: 67.5, referral: 23.4, roi: 2.4 },
      { day: 'Wed', acquisition: 245, conversion: 13.2, retention: 67.2, referral: 24.2, roi: 2.6 },
      { day: 'Thu', acquisition: 267, conversion: 12.8, retention: 67.1, referral: 23.8, roi: 2.5 },
      { day: 'Fri', acquisition: 312, conversion: 14.5, retention: 68.1, referral: 25.1, roi: 2.8 },
      { day: 'Sat', acquisition: 289, conversion: 13.2, retention: 68.3, referral: 24.5, roi: 2.7 },
    ],
    '30d': [
      { week: 'W1', acquisition: 892, conversion: 9.2, retention: 65, referral: 20, roi: 1.8 },
      { week: 'W2', acquisition: 1045, conversion: 10.8, retention: 66, referral: 21.5, roi: 2.0 },
      { week: 'W3', acquisition: 1234, conversion: 12.4, retention: 67.8, referral: 23.2, roi: 2.3 },
      { week: 'W4', acquisition: 1847, conversion: 14.2, retention: 68.5, referral: 25.1, roi: 2.5 },
    ]
  };

  const data = chartData[timeframe] || chartData['30d'];

  // Determine which chart to show
  if (metric === 'acquisition' || !metric) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          USER ACQUISITION TREND
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Area type="monotone" dataKey="acquisition" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAcq)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (metric === 'conversion') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          CONVERSION RATE ANALYSIS
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="conversion" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (metric === 'retention') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          30-DAY RETENTION CURVE
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="retention" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7' }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (metric === 'referral') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          REFERRAL PERFORMANCE
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="referral" stroke="#fb923c" strokeWidth={3} dot={{ fill: '#fb923c' }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  if (metric === 'roi') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          CAMPAIGN ROI BREAKDOWN
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="roi" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }

  // Overview: Show all metrics
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          USER ACQUISITION
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Area type="monotone" dataKey="acquisition" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAcq)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          CONVERSION RATE & REFERRAL
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={timeframe === '7d' ? 'day' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Legend />
            <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="referral" stroke="#fb923c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}