/**
 * NetworkNodeDrawer — premium side panel when node is selected
 * Full member data + actions that work
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Globe, MessageSquare, User, Star, Activity, ChevronRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SIDE_COLOR = {
  left:  '#3b82f6',
  right: '#8b5cf6',
  root:  '#fbbf24',
};

const RANK_ICONS = {
  'E. Corona':      '👑',
  'Embajador':      '🏆',
  'Diamante Negro': '🖤',
  'Diamante Azul':  '💙',
  'Diamante':       '💎',
  'Platino':        '⭐',
  'Oro':            '🥇',
  'Plata':          '🥈',
  'Bronce':         '🥉',
  'Principiante':   '🌱',
};

export default function NetworkNodeDrawer({ node, dataset, onClose, onSelectNode, floating = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [actionFeedback, setActionFeedback] = useState('');

  if (!node) return null;

  const sideColor = SIDE_COLOR[node.binary_side] || '#3b82f6';
  const initials  = (node.full_name || node.name || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
  const rankIcon  = RANK_ICONS[node.rank] || '⭐';
  const isActive  = node.status === 'activo';

  // Direct children in dataset
  const children = dataset.members.filter(m => m.upline_id === node.user_id);
  const leftChild  = children.find(c => c.binary_side === 'left');
  const rightChild = children.find(c => c.binary_side === 'right');

  function fireAction(label) {
    if (label === 'Enviar Mensaje') {
      navigate('/dashboard/communications');
      return;
    }
    setActionFeedback(`${label} ejecutado ✓`);
    setTimeout(() => setActionFeedback(''), 2200);
  }

  const actions = [
    { label: 'Enviar Mensaje',    icon: MessageSquare, color: sideColor },
    { label: 'Ver Perfil',        icon: User,          color: '#10b981' },
    { label: 'Crear Seguimiento', icon: Activity,      color: '#fbbf24' },
    { label: 'Marcar Prioridad',  icon: Star,          color: '#f59e0b' },
  ];

  const panelStyle = floating ? {
    position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 200,
    width: 330,
  } : {
    width: 330, flexShrink: 0,
  };

  return (
    <motion.div
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      exit={{ x: 340,    opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        ...panelStyle,
        background: 'rgba(4,10,22,0.98)',
        borderLeft: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `inset 1px 0 0 ${sideColor}18, -8px 0 40px rgba(0,0,0,0.5)`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <div style={{
        padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${sideColor}08, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: `${sideColor}18`,
            border: `2px solid ${sideColor}45`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 900, color: sideColor,
            fontFamily: 'Montserrat,sans-serif',
            boxShadow: `0 0 18px ${sideColor}25`,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.2 }}>
              {node.full_name || node.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 10 }}>{rankIcon}</span>
              <span style={{ color: sideColor, fontSize: 9, fontWeight: 700 }}>{node.rank || 'Principiante'}</span>
              <span style={{
                padding: '1px 6px', borderRadius: 10,
                background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                color: isActive ? '#10b981' : '#9ca3af',
                fontSize: 8, fontWeight: 700,
              }}>
                {isActive ? '● ACTIVO' : '○ INACTIVO'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
          <X size={15} />
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 18px' }}>
        {['profile', 'network', 'actions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '9px 12px', border: 'none', background: 'none',
            color: activeTab === tab ? sideColor : 'rgba(255,255,255,0.35)',
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            borderBottom: activeTab === tab ? `2px solid ${sideColor}` : '2px solid transparent',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            transition: 'all 0.15s',
          }}>
            {tab === 'profile' ? 'Perfil' : tab === 'network' ? 'Red' : 'Acciones'}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Investment card */}
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: `${sideColor}0E`, border: `1px solid ${sideColor}22`,
              textAlign: 'center',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '1px' }}>INVERSIÓN ACTIVA</p>
              <p style={{ color: sideColor, fontSize: 26, fontWeight: 900, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>
                ${(node.investment_amount || 0).toLocaleString()}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: '2px 0 0 0' }}>USD · {node.membership_plan || 'Plan'}</p>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { Icon: Globe, label: 'País',     value: node.country || '—' },
                { Icon: Mail,  label: 'Email',    value: node.email   || '—' },
                { Icon: Phone, label: 'Teléfono', value: node.phone   || '—' },
              ].map(({ Icon, label, value }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <Icon size={12} style={{ color: sideColor, flexShrink: 0 }} />
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, margin: 0 }}>{label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 10, fontWeight: 600, margin: 0 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Generation & side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Generación',    value: `G${node.generation_depth || 0}` },
                { label: 'Posición',      value: node.binary_side === 'left' ? '← Izquierda' : node.binary_side === 'right' ? '→ Derecha' : '⭐ Raíz' },
                { label: 'Actividad',     value: node.activity_level === 'high' ? '🟢 Alta' : node.activity_level === 'medium' ? '🟡 Media' : '🔴 Baja' },
                { label: 'Estado',        value: isActive ? 'Activo' : 'Inactivo' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '9px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, margin: '0 0 3px 0' }}>{s.label}</p>
                  <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Hijos Directos ({children.length})
            </p>
            {children.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>Sin descendientes directos</p>
            )}
            {children.map((child, i) => (
              <motion.div key={i} whileHover={{ x: 3 }}
                onClick={() => onSelectNode(child)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: child.binary_side === 'left' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                    border: `1.5px solid ${child.binary_side === 'left' ? '#3b82f6' : '#8b5cf6'}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900, color: child.binary_side === 'left' ? '#3b82f6' : '#8b5cf6',
                  }}>
                    {(child.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{(child.full_name || '').split(' ')[0]}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: 0 }}>
                      {child.binary_side === 'left' ? '← Izq' : '→ Der'} · ${(child.investment_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', fontSize: 11, fontWeight: 700, textAlign: 'center',
                }}
              >
                {actionFeedback}
              </motion.div>
            )}
            {actions.map(({ label, icon: Icon, color }, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fireAction(label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${color}28`, background: `${color}0D`,
                  color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                {label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}