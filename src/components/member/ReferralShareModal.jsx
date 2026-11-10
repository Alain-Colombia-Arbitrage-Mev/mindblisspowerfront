import { useEffect, useRef, useState } from 'react';
import { Copy, Link as LinkIcon, Mail, MessageCircle, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { buildReferralLinks } from '@/lib/referral-links.mjs';
import { createClipboardFeedback } from '@/lib/member-view-effects.mjs';

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

export default function ReferralShareModal({ isOpen, onClose, code, side }) {
  const [copyFeedback, setCopyFeedback] = useState({ pending: '', copied: '', error: '' });
  const [sharing, setSharing] = useState(null);
  const [shareError, setShareError] = useState('');
  const clipboard = useRef(null);
  const copied = copyFeedback.copied;

  useEffect(() => {
    const active = createClipboardFeedback(setCopyFeedback);
    clipboard.current = active;
    return () => { active.dispose(); if (clipboard.current === active) clipboard.current = null; };
  }, []);

  const canonicalLinks = buildReferralLinks(code);
  const referralLink = side === 'right' ? canonicalLinks.right : canonicalLinks.left;
  const sideLabel = side === 'right' ? 'derecha' : 'izquierda';
  const shareText = `Únete a mi red en Mindbliss Power por mi rama ${sideLabel}, usando mi código de referido: ${code}. ${referralLink}`;

  const handleShare = (type) => {
    if (!referralLink) return;
    setShareError('');
    if (type === 'link') return clipboard.current?.copy(referralLink, 'link');
    const message = encodeURIComponent(shareText);
    const destinations = {
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`,
      email: `mailto:?subject=${encodeURIComponent('Te invito a unirte a Mindbliss Power')}&body=${message}`,
    };
    if (!destinations[type]) return;
    setSharing(type);
    try { window.open(destinations[type], '_blank', 'noopener,noreferrer'); }
    catch { setShareError('No se pudo abrir la aplicación para compartir. Puedes copiar el enlace manualmente.'); }
    finally { setSharing(null); }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40"
            style={{
              background: 'color-mix(in srgb, var(--vp-bg) 78%, transparent)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-5 sm:p-6"
            style={{
              background: 'var(--vp-surface)',
              border: '1px solid var(--vp-border)',
              boxShadow: 'var(--vp-shadow)',
              overscrollBehavior: 'contain',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title asChild><p style={{ color: 'var(--vp-accent)', fontSize: 10, fontWeight: 850, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                Compartir rama {sideLabel}
              </p></Dialog.Title>
              <Dialog.Close asChild><button
                  aria-label="Cerrar"
                  style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)', color: 'var(--vp-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                ><X size={16} /></button></Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Comparte tu código y el enlace de la rama {sideLabel}.</Dialog.Description>

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
                  onClick={() => clipboard.current?.copy(code, 'code')}
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
                const isLoading = sharing === option.id || copyFeedback.pending === option.id;
                const tone = toneStyles[option.tone];
                return (
                  <button
                    key={option.id}
                    onClick={() => handleShare(option.id)}
                    disabled={isLoading || !referralLink}
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
                    <span>{isLoading ? '...' : copied === option.id ? 'Copiado' : option.label}</span>
                  </button>
                );
              })}
            </div>
            {copyFeedback.error || shareError ? <p role="alert" className="mb-4 text-xs" style={{ color: 'var(--vp-danger)' }}>{copyFeedback.error || shareError}</p> : null}

            <div className="rounded-lg p-3" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-text-soft)', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                Enlace {sideLabel}: <span className="break-all" style={{ color: 'var(--vp-accent)', fontFamily: 'monospace', fontSize: 10 }}>{referralLink}</span>
              </p>
            </div>

            <Dialog.Close asChild><button
                className="mt-6 w-full rounded-lg px-4 py-2.5 font-semibold"
                style={{ background: 'var(--vp-surface-raised)', color: 'var(--vp-text-soft)', border: '1px solid var(--vp-border)', fontSize: 12 }}
              >Cerrar</button></Dialog.Close>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
