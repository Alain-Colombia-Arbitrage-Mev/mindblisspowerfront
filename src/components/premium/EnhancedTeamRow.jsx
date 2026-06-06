import { Mail, Phone, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EnhancedTeamRow({ member, onContact = null, onMessage = null, onView = null, isSelected = false }) {
  const isActive = member.status === 'activo';
  const isLeft = member.binary_side === 'left';
  const initials = member.name?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?';

  const sideColor = isLeft ? 'var(--vp-accent)' : 'var(--vp-amber)';
  const avatarBg = isLeft ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)';
  const avatarBorder = isLeft ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)';
  const statusColor = isActive ? 'var(--vp-accent)' : 'var(--vp-subtle)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'var(--vp-surface-raised)', x: 2 }}
      style={{
        padding: '12px 14px',
        borderRadius: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isSelected ? 'var(--vp-accent-muted)' : 'var(--vp-surface)',
        border: isSelected ? '1px solid var(--vp-accent-border)' : '1px solid var(--vp-border)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {/* IDENTITY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {/* Avatar — clean monogram */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: avatarBg,
          border: `1px solid ${avatarBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 900, color: sideColor,
          letterSpacing: '-0.5px',
        }}>
          {initials}
        </div>

        {/* Name + meta */}
        <div style={{ minWidth: 0 }}>
          <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 700, margin: '0 0 3px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: sideColor, fontSize: 9, fontWeight: 700, letterSpacing: '0.3px' }}>
              {isLeft ? '← Izq' : '→ Der'}
            </span>
            <span style={{ color: 'var(--vp-border-strong)', fontSize: 8 }}>·</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              color: statusColor,
              padding: '1px 6px', borderRadius: 4,
              background: isActive ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
              border: `1px solid ${isActive ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
            }}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
            {member.generation && (
              <>
                <span style={{ color: 'var(--vp-border-strong)', fontSize: 8 }}>·</span>
                <span style={{ color: 'var(--vp-subtle)', fontSize: 9 }}>G{member.generation}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* INVESTMENT */}
      <div style={{ textAlign: 'right', minWidth: 90, marginLeft: 12 }}>
        <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 600, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inversión</p>
        <p style={{ color: sideColor, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
          ${(member.investment || 0).toLocaleString()}
        </p>
      </div>

      {/* ACTIONS — enterprise-clean */}
      <div style={{ display: 'flex', items: 'center', gap: 6, marginLeft: 14, display: 'flex', alignItems: 'center' }}>
        {member.email && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={(e) => { e.stopPropagation(); onMessage?.(member); }}
            title="Mensaje"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)',
              color: 'var(--vp-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--vp-accent-muted)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--vp-accent-muted)'}
          >
            <Mail size={12} />
          </motion.button>
        )}
        {member.phone && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={(e) => { e.stopPropagation(); onContact?.(member); }}
            title="Llamar"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)',
              color: 'var(--vp-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--vp-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--vp-surface-raised)'}
          >
            <Phone size={12} />
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={(e) => { e.stopPropagation(); onView?.(member); }}
          title="Ver Perfil"
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--vp-amber-muted)', border: '1px solid var(--vp-amber-border)',
            color: 'var(--vp-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--vp-amber-muted)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--vp-amber-muted)'}
        >
          <Eye size={12} />
        </motion.button>
      </div>
    </motion.div>
  );
}
