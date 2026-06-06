import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Auto Mode Rules & Safety Guidelines
 * Display operational restrictions
 */

export default function AutoModeRules() {
  const allowedActions = [
    'Execute low-risk operational tasks',
    'Flag notifications and alerts',
    'Prepare medium-risk actions for approval',
    'Generate reports and analytics',
    'Archive old records and logs',
  ];

  const restrictedActions = [
    'Execute destructive operations',
    'Modify financial approvals automatically',
    'Change user permissions or roles',
    'Reverse or cancel transactions',
    'Delete records permanently',
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <p style={{ color: '#10b981', fontSize: 12, fontWeight: 800, letterSpacing: 1, margin: 0 }}>ALLOWED ACTIONS</p>
        </div>
        <div className="space-y-2">
          {allowedActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>• {action}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={16} style={{ color: '#ef4444' }} />
          <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 800, letterSpacing: 1, margin: 0 }}>STRICTLY PROHIBITED</p>
        </div>
        <div className="space-y-2">
          {restrictedActions.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, delay: 0.25 }}
              className="p-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>✕ {action}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}