import { motion } from 'framer-motion';

const PRESETS = {
  network: { emoji: '🌐', title: 'Tu red está vacía', subtitle: 'Invita a tu primer miembro para empezar a crecer.' },
  activity: { emoji: '⚡', title: 'Sin actividad reciente', subtitle: 'Las acciones de tu red aparecerán aquí.' },
  messages: { emoji: '✉️', title: 'Sin mensajes', subtitle: 'Tus comunicaciones con el equipo aparecerán aquí.' },
  bonuses: { emoji: '💰', title: 'Sin bonificaciones aún', subtitle: 'Activa tu red para empezar a generar ingresos.' },
  search: { emoji: '🔍', title: 'Sin resultados', subtitle: 'Prueba con otro término de búsqueda.' },
  default: { emoji: '📭', title: 'Nada aquí por ahora', subtitle: 'Este espacio se llenará pronto.' },
};

export default function EmptyState({ type = 'default', title, subtitle, action, actionLabel = 'Comenzar' }) {
  const preset = PRESETS[type] || PRESETS.default;
  const displayTitle = title || preset.title;
  const displaySubtitle = subtitle || preset.subtitle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        {preset.emoji}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 700, margin: '0 0 6px 0' }}>
          {displayTitle}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
          {displaySubtitle}
        </p>
      </motion.div>

      {action && (
        <motion.button
          onClick={action}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
          }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}