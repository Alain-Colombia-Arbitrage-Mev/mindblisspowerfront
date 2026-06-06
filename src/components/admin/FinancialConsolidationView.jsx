import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function FinancialConsolidationView() {
  const [activeTab, setActiveTab] = useState('overview');

  const financialData = {
    received: 127500,
    pending: 18750,
    overdue: 4200,
    inProgress: 8500
  };

  const urgentCases = [
    { id: 1, name: 'John Participant', amount: 2100, daysOverdue: 15, status: 'overdue' },
    { id: 2, name: 'Sarah Lead', amount: 1500, daysOverdue: 8, status: 'overdue' },
    { id: 3, name: 'Mike Network', amount: 1200, daysOverdue: 0, status: 'pending', daysDue: 3 }
  ];

  const tabs = ['Overview', 'Pending', 'Overdue', 'Cases'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Received', value: financialData.received, icon: CheckCircle, color: '#10b981' },
          { label: 'Pending', value: financialData.pending, icon: DollarSign, color: '#fbbf24' },
          { label: 'Overdue', value: financialData.overdue, icon: AlertCircle, color: '#ef4444' },
          { label: 'In Progress', value: financialData.inProgress, icon: TrendingUp, color: '#3b82f6' }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-2xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
              border: `1px solid ${item.color}30`
            }}>
            <div className="flex items-start justify-between mb-3">
              <div style={{ color: item.color, opacity: 0.7 }}>
                <item.icon size={20} />
              </div>
              <span className="text-xs font-bold text-gray-400">{item.label}</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className="text-2xl font-black" style={{ color: item.color }}>
              ${(item.value / 1000).toFixed(0)}k
            </motion.div>
            <p className="text-xs text-gray-500 mt-2">USD</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className="py-3 px-1 font-semibold text-sm transition-all relative"
              style={{ color: activeTab === tab.toLowerCase() ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              {tab}
              {activeTab === tab.toLowerCase() && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#3b82f6' }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Flow */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs text-gray-400 mb-3">Income Flow</p>
              <p className="text-3xl font-black text-green-400 mb-2">${financialData.received.toLocaleString()}</p>
              <p className="text-xs text-gray-500">↑ 12% from last month</p>
            </div>

            {/* Financial Health */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p className="text-xs text-gray-400 mb-3">Health Score</p>
              <div className="flex items-end gap-3 mb-2">
                <p className="text-3xl font-black text-blue-400">87%</p>
                <p className="text-xs text-gray-500 mb-1">Excellent</p>
              </div>
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ duration: 1 }} className="h-full bg-blue-400" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'overdue' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {urgentCases.filter(c => c.status === 'overdue').map((case_, idx) => (
            <motion.div
              key={case_.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">{case_.name}</p>
                  <p className="text-xs text-gray-400">{case_.daysOverdue} days overdue</p>
                </div>
                <p className="text-lg font-black text-red-400">${case_.amount.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === 'pending' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {urgentCases.filter(c => c.status === 'pending').map((case_, idx) => (
            <motion.div
              key={case_.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">{case_.name}</p>
                  <p className="text-xs text-gray-400">Due in {case_.daysDue} days</p>
                </div>
                <p className="text-lg font-black text-amber-400">${case_.amount.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === 'cases' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-xs text-gray-400">
          <p>All urgent financial cases consolidated here for priority handling.</p>
          <p>Total urgent cases: {urgentCases.length}</p>
        </motion.div>
      )}
    </div>
  );
}