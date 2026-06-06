/**
 * Withdrawal Modal with BMP Integration
 * Step-by-step withdrawal process
 */
import { useState } from 'react';
import { X, Check, Download, Mail, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = ['info', 'bmp', 'email', 'amount', 'confirm', 'success'];

export default function WithdrawalModal({ isOpen, onClose, availableBalance, onWithdrawalSubmit }) {
  const [step, setStep] = useState('info');
  const [bmpEmail, setBmpEmail] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const handleNextStep = async () => {
    if (step === 'info') setStep('bmp');
    else if (step === 'bmp') setStep('email');
    else if (step === 'email') {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setEmailVerified(true);
      setLoading(false);
      setStep('amount');
    } else if (step === 'amount') {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > availableBalance) return;
      setStep('confirm');
    } else if (step === 'confirm') {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onWithdrawalSubmit({ email: bmpEmail, amount: parseFloat(withdrawAmount) });
      setStep('success');
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (step === 'amount') setStep(emailVerified ? 'amount' : 'email');
    else if (step === 'confirm') setStep('amount');
    else if (step === 'email') setStep('bmp');
    else if (step === 'bmp') setStep('info');
  };

  const handleClose = () => {
    setStep('info');
    setBmpEmail('');
    setWithdrawAmount('');
    setEmailVerified(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl z-50 p-6"
            style={{ background: 'rgba(8,18,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            
            <div className="flex items-center justify-between mb-6">
              <p style={{ color: '#10b981', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>SISTEMA DE RETIROS</p>
              <button onClick={handleClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 flex gap-1">
              {['info', 'bmp', 'email', 'amount', 'confirm'].map((s, i) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: STEPS.indexOf(step) >= i ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            {/* STEP 1: Info */}
            {step === 'info' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 12px 0' }}>¿Cómo funcionan los retiros?</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                      Para realizar retiros de forma segura, utilizamos BMP (Be-Mind Power), una plataforma financiera confiable con la que trabajamos para procesar tus pagos.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, margin: 0 }}>✓ Pagos seguros y verificados</p>
                    <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>✓ Proceso rápido y transparente</p>
                    <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>✓ Sin comisiones ocultas</p>
                  </div>
                </div>
                <button onClick={handleNextStep}
                  className="w-full mt-6 px-4 py-2.5 rounded-lg font-semibold"
                  style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12 }}>
                  Continuar
                </button>
              </motion.div>
            )}

            {/* STEP 2: BMP */}
            {step === 'bmp' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 12px 0' }}>Crear cuenta en BMP</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: '0 0 12px 0' }}>
                      Necesitas una cuenta en BMP para recibir tus retiros. Si aún no tienes una, descárgala ahora:
                    </p>
                  </div>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Download size={16} />
                    Descargar BMP (Android)
                  </button>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center', margin: 0 }}>iOS y versión web próximamente</p>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>
                      <strong style={{ color: '#fb923c' }}>Importante:</strong> Sin una cuenta en BMP activa, no podemos procesar tu retiro.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePrev}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
                    Atrás
                  </button>
                  <button onClick={handleNextStep}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12 }}>
                    Ya tengo BMP
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Email */}
            {step === 'email' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 12px 0' }}>Vincular cuenta BMP</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                      Ingresa el email de tu cuenta BMP. Es necesario para procesar tus retiros.
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, margin: '0 0 6px 0' }}>Email de BMP</label>
                    <input type="email" value={bmpEmail} onChange={e => setBmpEmail(e.target.value)} placeholder="tu.email@bmp.com"
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-white/30 focus:outline-none transition-all"
                      style={{ background: bmpEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bmpEmail) ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.06)', border: bmpEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bmpEmail) ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  {emailVerified && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <Check size={16} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                      <p style={{ color: '#10b981', fontSize: 11, margin: 0 }}>✓ Email verificado correctamente</p>
                    </motion.div>
                  )}
                  {!emailVerified && bmpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bmpEmail) && (
                    <p style={{ color: '#fb923c', fontSize: 10, margin: 0 }}>⚠ Ingresa un email válido (ej: usuario@bmp.com)</p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePrev}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
                    Atrás
                  </button>
                  <button onClick={handleNextStep} disabled={!bmpEmail || loading}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12, opacity: !bmpEmail || loading ? 0.5 : 1 }}>
                    {loading ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Amount */}
            {step === 'amount' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 12px 0' }}>Monto del retiro</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 12px 0' }}>
                      Disponible: <strong style={{ color: '#10b981' }}>${availableBalance.toLocaleString()}</strong>
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, margin: '0 0 6px 0' }}>Cantidad a retirar</label>
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Ej: 1000"
                      max={availableBalance}
                      className="w-full px-4 py-2.5 rounded-lg text-white placeholder-white/30 focus:outline-none transition-all"
                      style={{ background: withdrawAmount && parseFloat(withdrawAmount) <= availableBalance && parseFloat(withdrawAmount) > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.06)', border: withdrawAmount && parseFloat(withdrawAmount) <= availableBalance && parseFloat(withdrawAmount) > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  {withdrawAmount && parseFloat(withdrawAmount) > availableBalance && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>⚠ Monto excede lo disponible</motion.p>
                  )}
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= availableBalance && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#10b981', fontSize: 11, margin: 0 }}>✓ Monto válido</motion.p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePrev}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
                    Atrás
                  </button>
                  <button onClick={handleNextStep} disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > availableBalance}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12, opacity: !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > availableBalance ? 0.5 : 1 }}>
                    Continuar
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Confirm */}
            {step === 'confirm' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="space-y-4">
                  <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 12px 0' }}>Confirmación</h3>
                  <div className="space-y-2">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Monto a retirar</span>
                      <span style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>${parseFloat(withdrawAmount).toLocaleString()}</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Cuenta BMP</span>
                      <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600 }}>{bmpEmail}</span>
                    </motion.div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center', margin: 0 }}>Los pagos se procesan únicamente a través de BMP usando el email asociado a tu cuenta.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePrev} disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, opacity: loading ? 0.5 : 1 }}>
                    Atrás
                  </button>
                  <button onClick={handleNextStep} disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold"
                    style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12, opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'Procesando...' : 'Confirmar retiro'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Success */}
            {step === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)', border: '2px solid #10b981' }}>
                    <Check size={24} style={{ color: '#10b981' }} />
                  </motion.div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 4px 0' }}>Retiro solicitado</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                      ${parseFloat(withdrawAmount).toLocaleString()} será transferido a tu cuenta BMP en 1-3 días hábiles.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ color: '#10b981', fontSize: 11, margin: 0 }}>Estado: <strong>En proceso</strong></p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '4px 0 0 0' }}>Recibirás confirmación en tu email BMP</p>
                  </div>
                </div>
                <button onClick={handleClose}
                  className="w-full mt-6 px-4 py-2.5 rounded-lg font-semibold"
                  style={{ background: '#10b981', color: 'white', border: 'none', fontSize: 12 }}>
                  Cerrar
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}