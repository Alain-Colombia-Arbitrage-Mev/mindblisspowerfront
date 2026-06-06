import { motion } from 'framer-motion';
import { X, Mail, Phone, Globe, Flag, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import platformDataCore from '@/lib/platformDataCore';

export default function NodeDetailPanel({ node, allNodes, onClose, onSelectNode }) {
  const navigate = useNavigate();
  if (!node) return null;

  const memberships = platformDataCore.getMembershipsForUser(node.user_id);
  const investment = memberships.reduce((s, m) => s + (m.amount || 0), 0);
  const directChildren = allNodes.filter(n => n.upline_id === node.user_id);
  const leftChild  = directChildren.find(n => n.binary_side === 'left');
  const rightChild = directChildren.find(n => n.binary_side === 'right');

  const sideColor = node.binary_side === 'left' ? '#3b82f6' : node.binary_side === 'right' ? '#8b5cf6' : '#fbbf24';
  const sideLabel = node.binary_side === 'left' ? '← Izquierda' : node.binary_side === 'right' ? '→ Derecha' : '⭐ Raíz';

  const initials = (node.name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        width: 320, borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(4,10,22,0.97)', display: 'flex', flexDirection: 'column',
        boxShadow: `inset 1px 0 0 ${sideColor}20`,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${sideColor}20`, border: `2px solid ${sideColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: sideColor }}>
            {initials}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: 0 }}>{node.name}</p>
            <p style={{ color: sideColor, fontSize: 9, fontWeight: 700, margin: '2px 0 0 0' }}>{sideLabel}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '4px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700 }}>
            {node.rank || 'Principiante'}
          </span>
          <span style={{ background: node.status === 'activo' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: node.status === 'activo' ? '#10b981' : '#9ca3af', padding: '4px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700 }}>
            {node.status === 'activo' ? '🟢 Activo' : '⚫ Inactivo'}
          </span>
        </div>

        {/* Investment highlight */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: `${sideColor}10`, border: `1px solid ${sideColor}25`, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 4px 0' }}>INVERSIÓN ACTIVA</p>
          <p style={{ color: sideColor, fontSize: 24, fontWeight: 900, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
            ${investment.toLocaleString()}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: '4px 0 0 0' }}>USD</p>
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { Icon: Globe, label: 'País', value: node.country || '-' },
            { Icon: Mail, label: 'Email', value: node.email || '-' },
            { Icon: Phone, label: 'Teléfono', value: node.phone || '-' },
          ].map(({ Icon, label, value }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon size={12} style={{ color: sideColor, flexShrink: 0 }} />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, margin: 0 }}>{label}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Network position */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Posición en Red</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Profundidad', value: node.depth ?? '-' },
              { label: 'Lado', value: sideLabel },
              { label: 'Hijo Izq', value: leftChild ? leftChild.name?.split(' ')[0] : '—' },
              { label: 'Hijo Der', value: rightChild ? rightChild.name?.split(' ')[0] : '—' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 700, margin: '0 0 3px 0' }}>{s.label}</p>
                <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct children navigation */}
        {directChildren.length > 0 && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Hijos Directos ({directChildren.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {directChildren.map((child, i) => (
                <motion.div key={i} whileHover={{ x: 3 }}
                  onClick={() => onSelectNode(child)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                  <div>
                    <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{child.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>{child.binary_side === 'left' ? '← Izq' : '→ Der'}</p>
                  </div>
                  <span style={{ color: child.binary_side === 'left' ? '#3b82f6' : '#8b5cf6', fontSize: 9, fontWeight: 700 }}>Ver →</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => navigate('/dashboard/communications')}
          style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: `1px solid ${sideColor}35`, background: `${sideColor}12`, color: sideColor, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <MessageSquare size={12} /> Enviar Mensaje
        </button>
      </div>
    </motion.div>
  );
}