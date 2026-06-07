import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Download, Loader2, Wallet, X } from 'lucide-react';

const IDENTITY = {
  name: 'Javier Demo MVP',
  username: '@javierdemo.mvp',
  userId: 'VP-CA-0426-917',
  joinDate: '26/04/2026',
  status: 'Diamante Negro',
  plan: 'Elite Network',
};

const actionButton = {
  width: '100%',
  padding: '12px 18px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 820,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export default function DigitalIDModal({ onClose }) {
  const [walletState, setWalletState] = useState('idle');
  const [printState, setPrintState] = useState('idle');

  const handleWallet = () => {
    setWalletState('loading');
    setTimeout(() => setWalletState('done'), 1800);
  };

  const handlePrint = () => {
    setPrintState('loading');
    setTimeout(() => setPrintState('done'), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'color-mix(in srgb, var(--vp-bg) 84%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.16 }}
        style={{
          width: '100%',
          maxWidth: 500,
          background: 'var(--vp-surface)',
          border: '1px solid var(--vp-border)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: 'var(--vp-shadow)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--vp-border)',
          }}
        >
          <div>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 5px' }}>
              Mindbliss Power
            </p>
            <h2 style={{ color: 'var(--vp-text)', fontSize: 17, fontWeight: 900, margin: 0 }}>ID Digital Oficial</h2>
          </div>
          <motion.button
            aria-label="Cerrar"
            onClick={onClose}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'var(--vp-surface-raised)',
              border: '1px solid var(--vp-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--vp-muted)',
            }}
          >
            <X size={15} strokeWidth={2} />
          </motion.button>
        </header>

        <div
          style={{
            padding: '28px clamp(22px, 5vw, 34px) 22px',
            background: 'var(--vp-shell)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              borderRadius: 15,
              overflow: 'hidden',
              maxWidth: 390,
              width: '100%',
              background: 'var(--vp-surface)',
              border: '1px solid var(--vp-border)',
              boxShadow: 'var(--vp-shadow)',
            }}
          >
            <div style={{ padding: 26, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'var(--vp-text)', fontSize: 14, letterSpacing: '1.4px', margin: '0 0 3px' }}>
                    VICION
                  </p>
                  <p style={{ color: 'var(--vp-accent)', fontSize: 8, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', margin: 0 }}>
                    Power Network
                  </p>
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--vp-accent-muted)',
                    border: '1px solid var(--vp-accent-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'var(--vp-accent)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 22 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'var(--vp-accent-muted)',
                    border: '1px solid var(--vp-accent-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 21,
                    fontWeight: 900,
                    color: 'var(--vp-accent)',
                    flexShrink: 0,
                  }}
                >
                  J
                </div>
                <div>
                  <p style={{ color: 'var(--vp-text)', fontSize: 15, fontWeight: 900, margin: '0 0 4px' }}>{IDENTITY.name}</p>
                  <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: '0 0 7px' }}>{IDENTITY.username}</p>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: 'var(--vp-amber-muted)',
                      border: '1px solid var(--vp-amber-border)',
                      color: 'var(--vp-amber)',
                      fontSize: 8,
                      fontWeight: 850,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {IDENTITY.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'USER ID', value: IDENTITY.userId },
                  { label: 'INGRESO', value: IDENTITY.joinDate },
                  { label: 'ESTADO', value: 'Activo' },
                  { label: 'NIVEL', value: IDENTITY.plan },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '9px 10px', borderRadius: 8, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
                    <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ color: 'var(--vp-text-soft)', fontSize: 10, fontWeight: 750, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ height: 3, borderRadius: 3, background: 'var(--vp-accent)' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button
            onClick={handleWallet}
            disabled={walletState !== 'idle'}
            whileHover={walletState === 'idle' ? { y: -1, backgroundColor: 'var(--vp-accent-strong)' } : {}}
            whileTap={walletState === 'idle' ? { scale: 0.98 } : {}}
            style={{
              ...actionButton,
              background: walletState === 'done' ? 'var(--vp-accent-muted)' : 'var(--vp-accent)',
              border: walletState === 'done' ? '1px solid var(--vp-accent-border)' : '1px solid var(--vp-accent-strong)',
              color: walletState === 'done' ? 'var(--vp-accent)' : 'var(--vp-shell)',
              cursor: walletState !== 'idle' ? 'default' : 'pointer',
            }}
          >
            {walletState === 'loading' && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {walletState === 'done' && <Check size={14} />}
            {walletState === 'idle' && <Wallet size={14} strokeWidth={2} />}
            {walletState === 'loading' ? 'Guardando...' : walletState === 'done' ? 'Guardado en Wallet' : 'Guardar en Wallet'}
          </motion.button>

          <motion.button
            onClick={handlePrint}
            disabled={printState !== 'idle'}
            whileHover={printState === 'idle' ? { y: -1 } : {}}
            whileTap={printState === 'idle' ? { scale: 0.98 } : {}}
            style={{
              ...actionButton,
              background: printState === 'done' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
              border: `1px solid ${printState === 'done' ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
              color: printState === 'done' ? 'var(--vp-accent)' : 'var(--vp-text-soft)',
              cursor: printState !== 'idle' ? 'default' : 'pointer',
            }}
          >
            {printState === 'loading' && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {printState === 'done' && <Check size={13} />}
            {printState === 'idle' && <Download size={13} strokeWidth={1.7} />}
            {printState === 'loading' ? 'Preparando...' : printState === 'done' ? 'Listo para imprimir' : 'Descargar versión imprimible'}
          </motion.button>

          <p style={{ color: 'var(--vp-muted)', fontSize: 10, textAlign: 'center', margin: '0 0 2px' }}>
            Formato optimizado para impresión en tamaño 8.5 x 5.3 cm
          </p>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 9,
              borderRadius: 9,
              background: 'transparent',
              border: 'none',
              color: 'var(--vp-muted)',
              fontSize: 11,
              fontWeight: 650,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
