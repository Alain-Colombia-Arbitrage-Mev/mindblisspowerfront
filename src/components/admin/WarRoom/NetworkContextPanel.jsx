import { motion } from 'framer-motion';
import { ChevronUp, Share2, AlertCircle, Users } from 'lucide-react';
import unifiedDataEngine from '@/lib/UnifiedDataEngine';

export default function NetworkContextPanel({ node }) {
  // Get upline chain
  const getUplineChain = (userId) => {
    const chain = [];
    let current = unifiedDataEngine.integrityModel.users.find(u => u.id === userId);
    while (current && current.upline) {
      const uplineUser = unifiedDataEngine.integrityModel.users.find(u => u.id === current.upline);
      if (uplineUser) {
        chain.unshift(uplineUser);
        current = uplineUser;
      } else {
        break;
      }
    }
    return chain;
  };

  // Get immediate upline
  const getImmediateUpline = (userId) => {
    const current = unifiedDataEngine.integrityModel.users.find(u => u.id === userId);
    if (current?.upline) {
      return unifiedDataEngine.integrityModel.users.find(u => u.id === current.upline);
    }
    return null;
  };

  // Get branch placement
  const getBranchPlacement = (userId) => {
    const upline = getImmediateUpline(userId);
    if (upline) {
      if (upline.leftSide?.includes(userId)) return 'Izquierda (IZQ)';
      if (upline.rightSide?.includes(userId)) return 'Derecha (DER)';
    }
    return 'Raíz';
  };

  // Get descendants
  const getDirectChildren = (userId) => {
    return unifiedDataEngine.integrityModel.users.filter(u => u.upline === userId);
  };

  // Get branch health
  const getBranchHealth = (userId) => {
    const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(userId);
    if (!profile) return 'normal';
    const payments = unifiedDataEngine.integrityModel.payments?.filter(p => p.user_id === userId) || [];
    const overdue = payments.filter(p => p.status === 'vencido').length;
    if (overdue > 0) return 'critical';
    return profile.total_descendants === 0 ? 'inactive' : 'active';
  };

  const uplineChain = getUplineChain(node.id);
  const immediateUpline = getImmediateUpline(node.id);
  const branch = getBranchPlacement(node.id);
  const children = getDirectChildren(node.id);
  const health = getBranchHealth(node.id);

  const healthColors = {
    critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', text: 'Crítico' },
    active: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', text: 'Activo' },
    inactive: { bg: 'rgba(156,163,175,0.1)', color: 'rgba(255,255,255,0.5)', text: 'Inactivo' },
    normal: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', text: 'Normal' },
  };

  const healthStyle = healthColors[health];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 pt-3 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
        Contexto de Red
      </p>

      {/* BRANCH HEALTH */}
      <div className="p-2 rounded-lg flex items-center gap-2" style={{ background: healthStyle.bg, border: `1px solid ${healthStyle.color}30` }}>
        <div className="w-2 h-2 rounded-full" style={{ background: healthStyle.color }} />
        <div className="flex-1">
          <p style={{ color: healthStyle.color, fontSize: 10, fontWeight: 700, margin: 0 }}>{healthStyle.text}</p>
        </div>
      </div>

      {/* BRANCH PLACEMENT */}
      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>Ubicación</p>
        <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '2px 0 0 0' }}>{branch}</p>
      </div>

      {/* IMMEDIATE UPLINE */}
      {immediateUpline && (
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>Patrocinador</p>
          <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '2px 0 0 0' }}>{immediateUpline.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '1px 0 0 0' }}>{immediateUpline.rank}</p>
        </div>
      )}

      {/* UPLINE CHAIN */}
      {uplineChain.length > 0 && (
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>Cadena de Rango</p>
          <div className="flex items-center gap-1 mt-1 text-xs flex-wrap">
            {uplineChain.map((user, idx) => (
              <div key={user.id} className="flex items-center gap-1">
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{user.rank}</span>
                {idx < uplineChain.length - 1 && <ChevronUp size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIRECT CHILDREN */}
      {children.length > 0 && (
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={11} style={{ color: '#10b981' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>{children.length} Referidos Directos</p>
          </div>
          <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
            {children.slice(0, 5).map((child) => (
              <div key={child.id} className="flex items-center justify-between p-1 rounded" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span style={{ color: 'white', fontWeight: 600 }}>{child.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{child.rank}</span>
              </div>
            ))}
            {children.length > 5 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0 0', fontStyle: 'italic' }}>
                +{children.length - 5} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* WARNING IF AFFECTS BRANCH */}
      {health === 'critical' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-2 rounded-lg flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 700, margin: 0 }}>⚠️ Urgencia de Rama</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: '1px 0 0 0' }}>Afecta salud de red descendente</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}