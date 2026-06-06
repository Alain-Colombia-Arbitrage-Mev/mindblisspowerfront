import { motion, AnimatePresence } from 'framer-motion';
import { Eye, AlertTriangle } from 'lucide-react';

/**
 * Module Presence Component
 * Shows which admins are viewing/working in the current module
 * Warns about conflicts
 */

export default function ModulePresence({
  adminsInModule = [],
  conflictDetected = null,
  currentAdminId = null,
}) {
  if (!adminsInModule || adminsInModule.length === 0) {
    return null;
  }

  // Filter out current admin
  const otherAdmins = adminsInModule.filter(a => a.adminId !== currentAdminId);

  if (otherAdmins.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {/* Conflict Warning */}
        {conflictDetected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <AlertTriangle size={14} style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
                Conflict Detected
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
                {conflictDetected.admins.length} admins performing "{conflictDetected.action}" in this module
              </p>
            </div>
          </motion.div>
        )}

        {/* Active Admins in Module */}
        {otherAdmins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <Eye size={14} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
            <div className="flex-1">
              <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: '0 0 3px 0' }}>
                {otherAdmins.length} Admin{otherAdmins.length > 1 ? 's' : ''} Active
              </p>
              <div className="space-y-1">
                {otherAdmins.map((admin) => (
                  <div key={admin.adminId} className="flex items-center justify-between">
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, margin: 0 }}>
                        {admin.name}
                      </p>
                      {admin.action && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '1px 0 0 0' }}>
                          {admin.action}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}