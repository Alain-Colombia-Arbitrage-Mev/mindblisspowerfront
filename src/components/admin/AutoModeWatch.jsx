/**
 * AUTO MODE WATCH
 * Compact admin-only widget showing Auto Mode status at a glance.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, AlertTriangle, Clock, BarChart3, ChevronRight } from 'lucide-react';
import { generateExecutionQueue, generateApprovalQueue, generateEscalationQueue, DEFAULT_RULES } from '@/lib/AutoModeEngine';

export default function AutoModeWatch() {
  const execQueue = generateExecutionQueue();
  const approvalQueue = generateApprovalQueue();
  const escalationQueue = generateEscalationQueue();
  const rules = DEFAULT_RULES;

  const executedToday = execQueue.filter(e => e.status === 'executed').length;
  const pendingApprovals = approvalQueue.filter(a => a.status === 'pending').length;
  const escalated = escalationQueue.length;
  const pausedRules = rules.filter(r => !r.enabled).length;
  const autoModeActive = true; // In real implementation, read from state

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl" style={{ background: 'rgba(8,18,40,0.7)', border: '1px solid rgba(59,130,246,0.2)' }}>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Zap size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>Auto Mode Watch</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>Operations engine</p>
          </div>
        </div>
        <Link to="/admin-dashboard/auto-mode" style={{ textDecoration: 'none' }}>
          <button className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: '#3b82f6' }}>
            <ChevronRight size={14} />
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: autoModeActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: autoModeActive ? '#10b981' : '#6b7280' }} />
        <span style={{ color: autoModeActive ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>
          {autoModeActive ? 'ACTIVE & RUNNING' : 'PAUSED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Executed today */}
        <Link to="/admin-dashboard/auto-mode" style={{ textDecoration: 'none' }}>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={11} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981', fontSize: 9, fontWeight: 700 }}>Executed</span>
            </div>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>{executedToday}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>Today</p>
          </div>
        </Link>

        {/* Pending approvals */}
        <Link to="/admin-dashboard/auto-mode" style={{ textDecoration: 'none' }}>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={11} style={{ color: '#fb923c' }} />
              <span style={{ color: '#fb923c', fontSize: 9, fontWeight: 700 }}>Pending</span>
            </div>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>{pendingApprovals}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>Approvals</p>
          </div>
        </Link>

        {/* Escalated */}
        <Link to="/admin-dashboard/auto-mode" style={{ textDecoration: 'none' }}>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={11} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: 9, fontWeight: 700 }}>Critical</span>
            </div>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>{escalated}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>Escalations</p>
          </div>
        </Link>

        {/* Paused rules */}
        <Link to="/admin-dashboard/auto-mode" style={{ textDecoration: 'none' }}>
          <div className="p-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 size={11} style={{ color: '#a855f7' }} />
              <span style={{ color: '#a855f7', fontSize: 9, fontWeight: 700 }}>Disabled</span>
            </div>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: 0 }}>{pausedRules}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>Rules</p>
          </div>
        </Link>
      </div>

      {(pendingApprovals > 0 || escalated > 0) && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 6px' }}>ACTION REQUIRED</p>
          {pendingApprovals > 0 && (
            <p style={{ color: '#fb923c', fontSize: 9, margin: 0 }}>→ {pendingApprovals} approval{pendingApprovals > 1 ? 's' : ''} pending</p>
          )}
          {escalated > 0 && (
            <p style={{ color: '#ef4444', fontSize: 9, margin: '2px 0 0' }}>→ {escalated} critical escalations</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
