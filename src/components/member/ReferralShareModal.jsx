import { useState } from 'react';
import { Copy, Link as LinkIcon, Mail, MessageCircle, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SHARE_OPTIONS = [
  { id: 'link', icon: LinkIcon, label: 'Copiar Enlace', tone: 'accent' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', tone: 'accent' },
  { id: 'telegram', icon: Send, label: 'Telegram', tone: 'neutral' },
  { id: 'email', icon: Mail, label: 'Email', tone: 'amber' },
];

const toneStyles = {
  accent: { background: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)', color: 'var(--vp-accent)' },
  amber: { background: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)', color: 'var(--vp-amber)' },
  neutral: { background: 'var(--vp-surface-raised)', border: 'var(--vp-border)', color: 'var(--vp-text-soft)' },
};

export default function ReferralShareModal({ isOpen, onClose, code }) {
  const [copied, setCopied] = useState(null);
  const [sharing, setSharing] = useState(null);

  const referralLink = `https://app.mindblisspower.com/register?ref=${code}`;
  const shareText = `Únete a mi red en Mindbliss Power usando mi código de referido: ${code}. ${referralLink}`;

  const handleShare = (type) => {
    setSharing(type);

    const shareActions = {
      link: async () => {
        try {
          await navigator.clipboard.writeText(referralLink);
          setCopied('link');
          setTimeout(() => setCopied(null), 2500);
        } finally {
          setTimeout(() => setSharing(null), 300);
        }
      },
      whatsapp: () => {
        const msg = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
        setTimeout(() => setSharing(null), 300);
      },
      telegram: () => {
        const msg = encodeURIComponent(shareText);
        window.open(`https://t.me/share/url?url=${referralLink}&text=${msg}`, '_blank');
        setTimeout(() => setSharing(null), 300);
      },
      email: () => {
        const subject = encodeURIComponent('Te invito a unirte a Vicion');
        const body = encodeURIComponent(shareText);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        setTimeout(() => setSharing(null), 300);
      },
    };

    if (shareActions[type]) shareActions[type]();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{
              background: 'color-mix(in srgb, var(--vp-bg) 78%, transparent)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6"
            style={{
              background: 'var(--vp-surface)',
              border: '1px solid var(--vp-border)',
              boxShadow: 'var(--vp-shadow)',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <p style={{ color: 'var(--vp-accent)', fontSize: 10, fontWeight: 850, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                Compartir Red
              </p>
              <button
                aria-label="Cerrar"
                onClick={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--vp-surface-raised)',
                  border: '1px solid var(--vp-border)',
                  color: 'var(--vp-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6">
              <p style={{ color: 'var(--vp-muted)', fontSize: 12, fontWeight: 700, margin: '0 0 8px' }}>Tu código único</p>
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3"
                style={{
                  background: copied === 'code' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
                  border: `1px solid ${copied === 'code' ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
                }}
              >
                <p style={{ color: 'var(--vp-text)', fontSize: 20, fontWeight: 900, letterSpacing: '1px', margin: 0, flex: 1 }}>{code}</p>
                <motion.button
                  aria-label="Copiar código"
                  onClick={async () => {
                    await navigator.clipboard.writeText(code).catch(() => {});
                    setCopied('code');
                    setTimeout(() => setCopied(null), 2500);
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded p-2"
                  style={{ color: copied === 'code' ? 'var(--vp-accent)' : 'var(--vp-muted)', background: 'transparent', border: 'none' }}
                >
                  <Copy size={16} />
                </motion.button>
                {copied === 'code' && (
                  <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} style={{ color: 'var(--vp-accent)', fontSize: 11, fontWeight: 700 }}>
                    Copiado
                  </motion.span>
                )}
              </div>
            </div>

            <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: '0 0 12px' }}>Comparte a través de:</p>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {SHARE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isLoading = sharing === option.id;
                const tone = toneStyles[option.tone];
                return (
                  <button
                    key={option.id}
                    onClick={() => handleShare(option.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-lg px-4 py-3 transition-all disabled:opacity-50"
                    style={{
                      background: tone.background,
                      border: `1px solid ${tone.border}`,
                      color: tone.color,
                      fontWeight: 720,
                      fontSize: 12,
                    }}
                  >
                    <Icon size={14} />
                    <span>{isLoading ? '...' : option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg p-3" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-text-soft)', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                Enlace: <span style={{ color: 'var(--vp-accent)', fontFamily: 'monospace', fontSize: 10 }}>{referralLink}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg px-4 py-2.5 font-semibold"
              style={{
                background: 'var(--vp-surface-raised)',
                color: 'var(--vp-text-soft)',
                border: '1px solid var(--vp-border)',
                fontSize: 12,
              }}
            >
              Cerrar
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
