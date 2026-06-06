import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ContentVelocityCard from './ContentVelocityCard';

export default function ContentVelocity() {
  const [timeframe, setTimeframe] = useState('week');

  // Daily velocity data
  const dailyData = [
    { date: 'Mon', created: 12, published: 8, testing: 4, archived: 2 },
    { date: 'Tue', created: 15, published: 10, testing: 5, archived: 1 },
    { date: 'Wed', created: 18, published: 14, testing: 4, archived: 3 },
    { date: 'Thu', created: 22, published: 16, testing: 6, archived: 2 },
    { date: 'Fri', created: 25, published: 20, testing: 5, archived: 4 },
    { date: 'Sat', created: 8, published: 6, testing: 2, archived: 1 },
    { date: 'Sun', created: 5, published: 4, testing: 1, archived: 0 }
  ];

  // Weekly velocity data
  const weeklyData = [
    { week: 'W1', created: 68, published: 52, testing: 16, archived: 8 },
    { week: 'W2', created: 95, published: 74, testing: 21, archived: 12 },
    { week: 'W3', created: 112, published: 88, testing: 24, archived: 15 },
    { week: 'W4', created: 145, published: 118, testing: 27, archived: 18 }
  ];

  const chartData = timeframe === 'week' ? dailyData : weeklyData;

  // Current status snapshot
  const currentStatus = {
    created: 347,
    published: 282,
    testing: 65,
    archived: 53
  };

  // Velocity metrics
  const dailyVelocity = {
    created: 22.4,
    published: 17.9,
    testing: 4.6,
    archived: 2.1
  };

  const weeklyVelocity = {
    created: 420,
    published: 332,
    testing: 88,
    archived: 53
  };

  const publishRate = ((currentStatus.published / currentStatus.created) * 100).toFixed(1);
  const testingBacklog = currentStatus.testing;
  const cycleTime = (currentStatus.created / dailyVelocity.published).toFixed(1);

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
          <TrendingUp size={24} style={{ color: '#3b82f6' }} />
          <div className="flex-1">
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              PRODUCTION VELOCITY
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Content Velocity Tracker
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Monitor production rhythm across creation, publishing, testing, and archival
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <ContentVelocityCard
          label="Total Created"
          value={currentStatus.created}
          daily={dailyVelocity.created}
          weekly={weeklyVelocity.created}
          color="#3b82f6"
          subtext="per day avg"
        />
        <ContentVelocityCard
          label="Total Published"
          value={currentStatus.published}
          daily={dailyVelocity.published}
          weekly={weeklyVelocity.published}
          color="#10b981"
          subtext="per day avg"
        />
        <ContentVelocityCard
          label="In Testing Queue"
          value={currentStatus.testing}
          daily={dailyVelocity.testing}
          weekly={weeklyVelocity.testing}
          color="#fb923c"
          subtext="current backlog"
        />
        <ContentVelocityCard
          label="Archived"
          value={currentStatus.archived}
          daily={dailyVelocity.archived}
          weekly={weeklyVelocity.archived}
          color="#8b5cf6"
          subtext="per day avg"
        />
      </motion.div>

      {/* Health Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            PUBLISH RATE
          </p>
          <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {publishRate}%
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Created → Published
          </p>
          <div style={{ height: 3, background: '#10b9813d', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${publishRate}%`,
                background: '#10b981',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            TESTING BACKLOG
          </p>
          <p style={{ color: '#fb923c', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {testingBacklog}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Items awaiting evaluation
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            AVG CYCLE TIME
          </p>
          <p style={{ color: '#a855f7', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {cycleTime}d
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Create to publish
          </p>
        </div>
      </motion.div>

      {/* Velocity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
            Velocity Trend
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
          <BarChart data={chartData}>
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
            <Bar dataKey="created" fill="#3b82f6" name="Created" />
            <Bar dataKey="published" fill="#10b981" name="Published" />
            <Bar dataKey="testing" fill="#fb923c" name="Testing" />
            <Bar dataKey="archived" fill="#8b5cf6" name="Archived" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Throughput Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: '0 0 6px 0' }}>
          WEEKLY VELOCITY TRENDS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 8px 0' }}>
              Creation Rate
            </p>
            <p style={{ color: '#3b82f6', fontSize: 24, fontWeight: 900, margin: '0 0 12px 0' }}>
              +34%
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
              Week 1 to Week 4 growth
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 8px 0' }}>
              Publishing Throughput
            </p>
            <p style={{ color: '#10b981', fontSize: 24, fontWeight: 900, margin: '0 0 12px 0' }}>
              +127%
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
              Week 1 to Week 4 growth
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}