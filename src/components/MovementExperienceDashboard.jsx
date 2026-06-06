import { motion } from 'framer-motion';
import { TrendingUp, Zap } from 'lucide-react';

export default function MovementExperienceDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        border: '1px solid rgba(30, 64, 175, 0.12)',
        borderRadius: 16,
        padding: '32px 28px',
        marginBottom: 28
      }}
    >
      <div className="space-y-4">
        {/* Top message with icon */}
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(30, 64, 175, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <TrendingUp size={18} style={{ color: '#1e40af' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ flex: 1 }}
          >
            <p
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#0F1419',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4
              }}
            >
              Tu proceso ya está en marcha
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#4b5563',
                margin: '6px 0 0 0',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Cada decisión dentro del sistema suma. Nada se pierde.
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            height: 1,
            background: 'rgba(30, 64, 175, 0.1)',
            margin: '12px 0'
          }}
        />

        {/* Evolution message with icon */}
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transformOrigin: 'center'
            }}
          >
            <Zap size={18} style={{ color: '#10b981' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#10b981',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4
              }}
            >
              Esto no es un sistema estático.
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#10b981',
                margin: '2px 0 0 0',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4
              }}
            >
              Evoluciona contigo.
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: '#4b5563',
                margin: '6px 0 0 0',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Tu crecimiento es el crecimiento del ecosistema.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Micro animation - subtle pulsing border */}
      <motion.div
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          border: '1px solid rgba(16, 185, 129, 0.3)',
          pointerEvents: 'none'
        }}
      />
    </motion.div>
  );
}