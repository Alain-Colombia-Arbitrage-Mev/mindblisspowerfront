/**
 * BMP App Activation Block
 * Prompt to download BMP if not registered
 */
import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';

export default function BMPActivationBlock() {
  const handleDownload = () => {
    window.open('https://play.google.com/store/apps/details?id=chat.bemindepower.bmpchat', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-2xl p-6"
      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d6ef5 100%)', border: '1px solid rgba(255,255,255,0.15)' }}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Download size={20} style={{ color: 'white' }} />
        </motion.div>

        <div className="flex-1">
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: '0 0 6px 0' }}>
            Necesitas crear tu cuenta en BMP
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: '0 0 12px 0', lineHeight: 1.5 }}>
            BMP es la plataforma de pagos segura donde recibirás tus retiros. Descárgala ahora y vincula tu email para comenzar.
          </p>

          <motion.button
            onClick={handleDownload}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: 'white',
              color: '#3b82f6',
              fontWeight: 700,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={13} /> Descargar BMP
          </motion.button>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, margin: '0' }}>
            Disponible próximamente en iOS y web
          </p>
        </div>

        <motion.a
          href="https://bemindepower.com"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ x: 2 }}
          style={{ color: 'white', cursor: 'pointer', flexShrink: 0 }}
        >
          <ExternalLink size={18} />
        </motion.a>
      </div>
    </motion.div>
  );
}