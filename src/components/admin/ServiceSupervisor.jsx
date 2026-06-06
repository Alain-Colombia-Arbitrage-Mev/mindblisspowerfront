/**
 * ServiceSupervisor — Admin supervision wrapper for any existing internal service component.
 * Renders an admin control bar ABOVE the live component without modifying it.
 */
import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, AlertTriangle, ChevronDown, ChevronUp, Settings, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServiceSupervisor({
  title,
  serviceId,
  description,
  accessLevel = 'full',       // 'full' | 'read_only' | 'suspended'
  userScope = 'platform',     // 'platform' | 'leader' | 'investor' | 'participant'
  defaultOpen = true,
  onAccessChange,
  onFlag,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [access, setAccess] = useState(accessLevel);
  const [flagged, setFlagged] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const ACCESS_COLORS = {
    full: '#10b981',
    read_only: '#fb923c',
    suspended: '#ef4444',
  };

  const SCOPE_COLORS = {
    platform: '#3b82f6',
    leader: '#f59e0b',
    investor: '#8b5cf6',
    participant: '#06b6d4',
  };

  const handleAccessChange = (val) => {
    setAccess(val);
    onAccessChange?.(serviceId, val);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{
      border: flagged ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(59,130,246,0.15)',
      background: 'rgba(5,12,26,0.7)',
    }}>
      {/* Supervisor Header Bar */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <div className="flex items-center gap-3 flex-1" onClick={() => setOpen(!open)}>
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: '#3b82f6' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>ADMIN SUPERVISED</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>|</span>
          <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{title}</span>
          {description && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>— {description}</span>}
        </div>

        <div className="flex items-center gap-3">
          {/* Scope badge */}
          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${SCOPE_COLORS[userScope]}18`, color: SCOPE_COLORS[userScope] }}>
            {userScope.toUpperCase()}
          </span>

          {/* Access badge */}
          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${ACCESS_COLORS[access]}18`, color: ACCESS_COLORS[access] }}>
            {access.replace('_', ' ').toUpperCase()}
          </span>

          {/* Flag button */}
          <button
            onClick={(e) => { e.stopPropagation(); setFlagged(!flagged); onFlag?.(serviceId, !flagged); }}
            className="p-1.5 rounded transition-all hover:bg-white/10"
            style={{ color: flagged ? '#ef4444' : 'rgba(255,255,255,0.3)' }}
            title={flagged ? 'Remove flag' : 'Flag for review'}
          >
            <AlertTriangle size={12} />
          </button>

          {/* Controls toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowControls(!showControls); }}
            className="p-1.5 rounded transition-all hover:bg-white/10"
            style={{ color: showControls ? '#3b82f6' : 'rgba(255,255,255,0.3)' }}
            title="Admin controls"
          >
            <Settings size={12} />
          </button>

          {/* Collapse */}
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Admin Quick Controls (expandable) */}
      <AnimatePresence>
        {showControls && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 py-3 flex items-center gap-4 flex-wrap"
            style={{ background: 'rgba(59,130,246,0.05)', borderBottom: '1px solid rgba(59,130,246,0.12)' }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Access Control:</span>
            {['full', 'read_only', 'suspended'].map(lvl => (
              <button
                key={lvl}
                onClick={() => handleAccessChange(lvl)}
                className="px-3 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: access === lvl ? `${ACCESS_COLORS[lvl]}25` : 'rgba(255,255,255,0.05)',
                  color: access === lvl ? ACCESS_COLORS[lvl] : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${access === lvl ? ACCESS_COLORS[lvl] + '40' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {lvl === 'full' ? '✓ Full Access' : lvl === 'read_only' ? '👁 Read Only' : '✕ Suspended'}
              </button>
            ))}
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginLeft: 'auto' }}>Service ID: {serviceId}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Suspended overlay */}
            {access === 'suspended' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                <div className="text-center">
                  <Lock size={32} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
                  <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, margin: '0 0 4px 0' }}>Service Suspended</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Admin action required to restore access</p>
                </div>
              </div>
            )}
            {/* Read-only overlay indicator */}
            {access === 'read_only' && (
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(251,146,60,0.08)', borderBottom: '1px solid rgba(251,146,60,0.15)' }}>
                <Eye size={12} style={{ color: '#fb923c' }} />
                <span style={{ color: '#fb923c', fontSize: 10, fontWeight: 600 }}>READ ONLY MODE — user interactions disabled at platform level</span>
              </div>
            )}
            <div className="p-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}