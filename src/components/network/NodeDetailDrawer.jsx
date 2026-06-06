/**
 * NODE DETAIL DRAWER — Premium side panel
 * Opens when a tree node is selected
 * Shows full member profile, contact, position, actions
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Globe, CreditCard, Layers, Activity, User, Star, Clock, ChevronRight, Network, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SIDE_COLORS = {
  left:  'var(--vp-accent)',
  right: 'var(--vp-amber)',
  root:  'var(--vp-amber)',
};

const RANK_COLORS = {
  'Embajador': '#fbbf24', 'Diamante Negro': '#c084fc', 'Diamante Azul': '#60a5fa',
  'Diamante': '#a78bfa', 'Platino': '#e2e8f0', 'Oro': '#f59e0b',
  'Plata': '#94a3b8', 'Bronce': '#d97706', 'Principiante': '#6b7280',
};

const ACTIONS = [
  { key: 'contact',    icon: Mail,            label: 'Contactar',          type: 'contact' },
  { key: 'network',    icon: Network,         label: 'Ver Red',            type: 'network' },
  { key: 'profile',    icon: User,            label: 'Ver Perfil',         type: 'navigate', route: '/dashboard/team' },
  { key: 'followup',   icon: Clock,           label: 'Seguimiento',        type: 'followup' },
  { key: 'priority',   icon: Star,            label: 'Marcar Prioridad',   type: 'priority' },
];

export default function NodeDetailDrawer({ member, dataset, onClose, onSelect }) {
  const navigate = useNavigate();
  const [actionFeedback, setActionFeedback] = useState(null);
  const [prioritized, setPrioritized] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [activePanel, setActivePanel] = useState(null);  // Phase 3: 'contact' | 'network' | null
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const sideColor = SIDE_COLORS[member.binary_side] || SIDE_COLORS.root;
  const sideBg = member.binary_side === 'left' ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)';
  const sideBorder = member.binary_side === 'left' ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)';
  const rankColor = RANK_COLORS[member.rank] || '#6b7280';
  const initials = member.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
  const children = dataset.getChildren(member.user_id);
  const leftChild = children.find(c => c.binary_side === 'left');
  const rightChild = children.find(c => c.binary_side === 'right');

  const upline = dataset.getMember(member.upline_id);

  const infoRows = [
    { Icon: Mail, label: 'Email', value: member.email },
    { Icon: Phone, label: 'Teléfono', value: member.phone },
    { Icon: Globe, label: 'País', value: member.country_name || member.country },
    { Icon: CreditCard, label: 'Plan', value: member.membership_plan },
    { Icon: Layers, label: 'Generación', value: `Gen. ${member.generation_depth}` },
    { Icon: Activity, label: 'Actividad', value: member.activity_level === 'high' ? 'Alta' : member.activity_level === 'medium' ? 'Media' : 'Baja' },
  ];

  const positionRows = [
    { label: 'Lado', value: member.binary_side === 'left' ? '◀ Izquierda' : member.binary_side === 'right' ? '▶ Derecha' : '⭐ Raíz', color: sideColor },
    { label: 'Profundidad', value: `Nivel ${member.generation_depth}` },
    { label: 'Patrocinador', value: upline ? upline.full_name.split(' ')[0] + ' ' + upline.full_name.split(' ')[1] : 'Embajador Corona' },
    { label: 'Hijo Izq.', value: leftChild ? leftChild.full_name.split(' ')[0] : '—' },
    { label: 'Hijo Der.', value: rightChild ? rightChild.full_name.split(' ')[0] : '—' },
    { label: 'Unión', value: member.join_date || '—' },
  ];

  const handleAction = (action) => {
    // Phase 4 — each action type triggers different behavior
    switch (action.type) {
      case 'navigate':
        // Phase 4 — route navigation
        navigate(action.route);
        break;

      case 'contact':
        // Phase 5 — show contact card
        setActivePanel(activePanel === 'contact' ? null : 'contact');
        break;

      case 'network':
        // Phase 6 — re-center tree on this node
        if (onSelect) {
          onSelect(member);
          setActionFeedback('🌳 Red centrada en ' + member.full_name.split(' ')[0]);
          setTimeout(() => setActionFeedback(null), 1500);
        }
        break;

      case 'followup':
        // Phase 7 — mark as tracked
        setFollowed(f => !f);
        setActionFeedback(followed ? 'Seguimiento removido' : '✓ Marcado para seguimiento');
        setTimeout(() => setActionFeedback(null), 1500);
        break;

      case 'priority':
        // Phase 8 — highlight and store state
        setPrioritized(p => !p);
        setActionFeedback(prioritized ? 'Prioridad removida' : '⭐ Marcado como prioridad');
        setTimeout(() => setActionFeedback(null), 1500);
        break;

      default:
        setActionFeedback(`✓ ${action.label}`);
        setTimeout(() => setActionFeedback(null), 1500);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(member.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* Backdrop fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Drawer slide */}
      <motion.div
        initial={{ x: 360, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          width: 340,
          borderLeft: `1px solid ${sideBorder}`,
          background: 'var(--vp-shell)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: 'var(--vp-shadow)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 20,
        }}
      >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--vp-border)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: sideBg,
              border: `2px solid ${sideBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: sideColor,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {initials}
          </motion.div>
          <div>
            <p style={{ color: 'var(--vp-text)', fontWeight: 800, fontSize: 13, margin: '0 0 2px 0', lineHeight: 1.2 }}>{member.full_name}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ background: sideBg, color: sideColor, padding: '2px 7px', borderRadius: 12, fontSize: 8, fontWeight: 800, border: `1px solid ${sideBorder}` }}>
                {member.binary_side === 'left' ? '◀ IZQ' : member.binary_side === 'right' ? '▶ DER' : '⭐ RAÍZ'}
              </span>
              <span style={{ background: `${rankColor}15`, color: rankColor, padding: '2px 7px', borderRadius: 12, fontSize: 8, fontWeight: 800 }}>
                {member.rank}
              </span>
              <span style={{ background: member.status === 'activo' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)', color: member.status === 'activo' ? 'var(--vp-accent)' : 'var(--vp-subtle)', padding: '2px 7px', borderRadius: 12, fontSize: 8, fontWeight: 800, border: `1px solid ${member.status === 'activo' ? 'var(--vp-accent-border)' : 'var(--vp-border)'}` }}>
                {member.status === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
              {prioritized && (
                <span style={{ background: 'var(--vp-amber-muted)', color: 'var(--vp-amber)', padding: '2px 7px', borderRadius: 12, fontSize: 8, fontWeight: 800, border: '1px solid var(--vp-amber-border)' }}>Prioridad</span>
              )}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--vp-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--vp-text-soft)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--vp-muted)'}
        >
          <X size={16} />
        </motion.button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Investment highlight */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: sideBg, border: `1px solid ${sideBorder}`, textAlign: 'center' }}>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 700, margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Inversión Activa</p>
          <p style={{ color: sideColor, fontSize: 26, fontWeight: 900, margin: 0, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
            ${member.investment_amount.toLocaleString()}
          </p>
          <p style={{ color: 'var(--vp-muted)', fontSize: 8, margin: '4px 0 0 0' }}>USD · Plan {member.membership_plan}</p>
        </div>

        {/* Contact info */}
        <div>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 800, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Datos de Contacto</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {infoRows.map(({ Icon, label, value }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}>
                <Icon size={11} style={{ color: sideColor, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{label}</p>
                  <p style={{ color: 'var(--vp-text-soft)', fontSize: 10, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network position */}
        <div>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 800, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Posición en Red</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {positionRows.map((r, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: '0 0 2px 0', textTransform: 'uppercase' }}>{r.label}</p>
                <p style={{ color: r.color || 'var(--vp-text-soft)', fontSize: 9, fontWeight: 700, margin: 0 }}>{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct children */}
        {children.length > 0 && (
          <div>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 800, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Hijos Directos ({children.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {children.map((child, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 3 }}
                  onClick={() => onSelect && onSelect(child)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <div>
                    <p style={{ color: 'var(--vp-text)', fontSize: 10, fontWeight: 700, margin: 0 }}>
                      {child.full_name.split(' ').slice(0,2).join(' ')}
                    </p>
                    <p style={{ color: 'var(--vp-muted)', fontSize: 8, margin: 0 }}>
                      {child._local_side === 'left' ? '◀ Izq' : '▶ Der'} · ${child.investment_amount.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight size={12} style={{ color: 'var(--vp-subtle)' }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Panel (Phase 5) */}
      <AnimatePresence>
        {activePanel === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--vp-border)',
              background: 'var(--vp-surface-raised)',
              flexShrink: 0,
            }}
          >
            <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase' }}>DATOS DE CONTACTO</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Email */}
              <motion.div
                whileHover={{ x: 2 }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--vp-surface)',
                  border: `1px solid ${sideBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={handleCopyEmail}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Mail size={11} style={{ color: sideColor, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Email</p>
                    <p style={{ color: 'var(--vp-text-soft)', fontSize: 9, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: copied ? 0 : -90 }} style={{ color: copied ? 'var(--vp-accent)' : 'var(--vp-subtle)', flexShrink: 0 }}>
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                </motion.div>
              </motion.div>

              {/* Phone */}
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--vp-surface)', border: `1px solid ${sideBorder}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={11} style={{ color: sideColor, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Teléfono</p>
                  <p style={{ color: 'var(--vp-text-soft)', fontSize: 9, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.phone}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions (Phase 3, 4) */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--vp-border)', flexShrink: 0 }}>
        {/* Action feedback */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 8 }}
            >
              <p style={{ color: 'var(--vp-accent)', fontSize: 10, fontWeight: 700, margin: 0 }}>{actionFeedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            const isActive = 
              (action.key === 'priority' && prioritized) || 
              (action.key === 'followup' && followed) ||
              (action.key === 'contact' && activePanel === 'contact');

            return (
              <motion.button
                key={action.key}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(action)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${isActive ? sideBorder : 'var(--vp-border)'}`,
                  background: isActive ? sideBg : 'var(--vp-surface)',
                  color: isActive ? sideColor : sideColor,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={11} />
                {action.label}
                {isActive && ' ✓'}
              </motion.button>
            );
          })}
        </div>
      </div>
      </motion.div>
    </>
  );
}
