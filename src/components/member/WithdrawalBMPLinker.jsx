/**
 * WithdrawalBMPLinker — Identity Linking, not a form
 * Feels like account connection, not data entry
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Edit2, ArrowRight, Loader2 } from 'lucide-react';

export default function WithdrawalBMPLinker({ onEmailChange, initialEmail = null }) {
  const [email, setEmail]         = useState(initialEmail || '');
  const [editing, setEditing]     = useState(!initialEmail);
  const [saved, setSaved]         = useState(!!initialEmail);
  const [validating, setValidating] = useState(false);
  const [error, setError]         = useState('');

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSave = async () => {
    if (!email.trim()) { setError('El email es requerido'); return; }
    if (!isValidEmail(email)) { setError('Formato de email inválido'); return; }
    setValidating(true);
    await new Promise(r => setTimeout(r, 900));
    setValidating(false);
    setSaved(true);
    setEditing(false);
    setError('');
    onEmailChange?.(email);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        borderRadius: 16,
        background: '#0B0F1A',
        border: `1px solid ${saved && !editing ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
        overflow: 'hidden',
        transition: 'border-color 300ms ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 5px 0' }}>
            Cuenta Financiera · BMP
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, fontWeight: 400, lineHeight: 1.5 }}>
            Vincula tu identidad BMP para habilitar los retiros
          </p>
        </div>
        {saved && !editing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
          }}>
            <Check size={12} style={{ color: '#60A5FA' }} />
            <span style={{ color: '#93C5FD', fontSize: 10, fontWeight: 700 }}>Vinculado</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 10px 0' }}>
                Introduce el email que usas en tu cuenta BMP para recibir los fondos.
              </p>
              <div style={{ position: 'relative', marginBottom: error ? 8 : 14 }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="tu.email@bmp.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                    borderRadius: 11,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.2)'}`,
                    color: 'white', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', transition: 'border-color 200ms ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.55)'}
                  onBlur={(e) => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.2)'}
                />
              </div>
              {error && (
                <p style={{ color: 'rgba(239,68,68,0.8)', fontSize: 10, margin: '0 0 12px 0' }}>{error}</p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSave} disabled={validating} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 20px', borderRadius: 11,
                  background: validating ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.18)',
                  color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)',
                  fontSize: 12, fontWeight: 700, cursor: validating ? 'default' : 'pointer',
                  opacity: validating ? 0.75 : 1, transition: 'all 200ms ease',
                }}>
                  {validating ? (
                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Validando...</>
                  ) : (
                    <><Check size={13} /> Vincular cuenta</>
                  )}
                </button>
                {saved && (
                  <button onClick={() => setEditing(false)} style={{
                    flex: 1, padding: '11px 16px', borderRadius: 11, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 600,
                    transition: 'all 200ms ease',
                  }}>
                    Cancelar
                  </button>
                )}
              </div>
            </motion.div>
          ) : saved && email ? (
            <motion.div key="saved" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Linked email display */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 12,
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.2)',
                marginBottom: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mail size={15} style={{ color: '#60A5FA' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>BMP Email</p>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </div>
              <button onClick={() => setEditing(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 10, fontWeight: 600, transition: 'all 200ms ease',
              }}>
                <Edit2 size={11} /> Cambiar email BMP
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}