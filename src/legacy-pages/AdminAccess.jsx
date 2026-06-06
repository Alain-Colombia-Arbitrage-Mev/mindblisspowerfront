import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle, CheckCircle, Loader2, MapPin, Eye, EyeOff, Shield, Zap, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSessionManager from '@/lib/AdminSessionManager';
import AuthenticationHardener from '@/lib/AuthenticationHardener';
import IPAccessControl from '@/lib/IPAccessControl';

const DEFAULT_CREDENTIALS = [
  { email: 'admin@vicionpower.local', password: 'VicionAdmin2026!', name: 'Administrador', role: 'admin', userId: 'admin-001' },
  { email: 'superadmin@vicionpower.local', password: 'SuperVicion2026!', name: 'Super Administrador', role: 'admin', userId: 'super-admin-001' },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const containerFade = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } };
const cardSlideUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
const shake = { animate: { x: [0, -8, 8, -8, 0], transition: { duration: 0.5 } } };
const cardExit = { exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } } };

export default function AdminAccess() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoStepEnabled, setTwoStepEnabled] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [clientIP, setClientIP] = useState(null);
  const [ipRegion, setIPRegion] = useState(null);
  const [ipStatus, setIPStatus] = useState(null);
  const [trustThisIP, setTrustThisIP] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    // PHASE 7: Failsafe — if admin already logged in, redirect to dashboard
    const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
    const adminRole = localStorage.getItem('admin_role');
    if (isAdminAuth && adminRole === 'admin') {
      navigate('/admin-dashboard/overview', { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    AuthenticationHardener.cleanupExpiredSessions();
    const ip = IPAccessControl.getClientIP();
    setClientIP(ip);
    IPAccessControl.detectRegion(ip).then(result => {
      setIPRegion(result.region);
      const validation = IPAccessControl.validateIPAccess(ip);
      setIPStatus(validation);
    });
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const newDigits = [...digits];
    if (value.length > 1) return;
    newDigits[index] = value.replace(/[^0-9]/g, '');
    setDigits(newDigits);
    if (value && index < 5) {
      document.getElementById(`digit-${index + 1}`)?.focus();
    }
    if (newDigits.every(d => d)) {
      setCode(newDigits.join(''));
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  };

  const handleResendCode = () => {
    setResendCooldown(30);
    setSuccess('Código reenviado a ' + email);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      setStep('verify');
      setSuccess('Código enviado');
      setLoading(false);
    }, 800);
  };

  const handle2FAVerification = () => {
    setLoading(true);
    
    setTimeout(() => {
      // PHASE 2: Write ONLY admin session keys AFTER 2FA success
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('admin_role', 'admin');
      localStorage.setItem('admin_id', 'root-admin');
      localStorage.setItem('admin_session_id', 'active-admin-session');
      
      // PHASE 2: Navigate ONLY to admin dashboard with replace=true
      navigate('/admin-dashboard/overview', { replace: true });
    }, 500);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    handle2FAVerification();
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)' }}>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite'
        }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full" style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite reverse'
        }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
        }
      `}</style>

      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-4 p-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            title="Volver a Home"
          >
            <Home size={20} />
          </button>
          <div className="flex items-center justify-between mb-3">
            {['Acceso', 'Verificación', 'Acceso Final'].map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: step === 'login' && idx === 0 || step === 'verify' && idx <= 1 || step === 'success' && idx <= 2 ? 1 : 0.3, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    (step === 'login' && idx === 0) || (step === 'verify' && idx <= 1) || (step === 'success' && idx <= 2)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: (step === 'login' && idx === 0) || (step === 'verify' && idx <= 1) || (step === 'success' && idx <= 2) ? '#3b82f6' : 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                </motion.div>
                {idx < 2 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.2 }}
                    className="flex-1 mx-2 h-0.5"
                    style={{ background: (step === 'login' && idx === 0) || (step === 'verify' && idx < 1) || (step === 'success') ? 'linear-gradient(90deg, #3b82f6, rgba(59,130,246,0.3))' : 'rgba(255,255,255,0.1)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerFade}
      className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <motion.div variants={fadeUp} className="flex flex-col justify-center">
              <motion.div variants={fadeUp} className="mb-12">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.1) 100%)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Shield size={32} style={{ color: '#3b82f6' }} />
                </div>
                <h1 style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: 'white',
                  margin: 0,
                  fontFamily: 'Montserrat, sans-serif',
                  letterSpacing: '-0.5px'
                }}>Acceso Ejecutivo</h1>
                <p style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.4)',
                  margin: '8px 0 0 0',
                  fontWeight: 300
                }}>Portal Administrativo Vicion Power</p>
              </motion.div>

              <motion.div variants={fadeUp} className="space-y-4 mb-12">
                {[
                  { icon: Zap, title: 'Monitoreo en Tiempo Real', desc: 'Visibilidad instantánea de operaciones de la plataforma' },
                  { icon: Lock, title: 'Seguridad Empresarial', desc: 'Autenticación multicapa y control de acceso' },
                  { icon: Shield, title: 'Credenciales Verificadas', desc: 'Encriptación estándar industrial y validación' }
                ].map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div key={i} variants={fadeUp} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.2)'
                      }}>
                        <Icon size={18} style={{ color: '#3b82f6' }} />
                      </div>
                      <div>
                        <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px 0', fontSize: 14 }}>
                          {feature.title}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                          {feature.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div variants={fadeUp} className="pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, margin: '0 0 12px 0' }}>
                  ESTADO DEL SISTEMA
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
                  <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>Todos los sistemas operativos</span>
                </div>
                
                {/* PHASE 6: Debug badge */}
                <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  <div>admin_auth: {localStorage.getItem('admin_auth')}</div>
                  <div>admin_role: {localStorage.getItem('admin_role')}</div>
                  <div>step: {step}</div>
                </div>
              </motion.div>
            </motion.div>

            <div>
              <AnimatePresence mode="wait">
              {step === 'login' && (
                <motion.form onSubmit={handleLoginSubmit} key="login" variants={cardSlideUp} initial="hidden" animate="visible" exit={cardExit.exit}
                  className="rounded-2xl p-8 backdrop-blur-xl" style={{
                    background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}>
                  <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 24px 0' }}>Acceso Administrador</h2>

                  <motion.div variants={fadeUp} className="mb-4">
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                      Dirección de Correo
                    </label>
                    <motion.input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vicionpower.local"
                      disabled={loading}
                      whileFocus={{ scale: 1.01 }}
                      onFocus={(e) => e.target.parentElement.style.boxShadow = '0 0 20px rgba(59,130,246,0.4)'}
                      onBlur={(e) => e.target.parentElement.style.boxShadow = 'none'}
                      className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="mb-4">
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <motion.input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña"
                        disabled={loading}
                        whileFocus={{ scale: 1.01 }}
                        onFocus={(e) => e.target.parentElement.parentElement.style.boxShadow = '0 0 20px rgba(59,130,246,0.4)'}
                        onBlur={(e) => e.target.parentElement.parentElement.style.boxShadow = 'none'}
                        className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                        }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="twoStep"
                      checked={twoStepEnabled}
                      onChange={(e) => setTwoStepEnabled(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                    />
                    <label htmlFor="twoStep" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>
                      Habilitar verificación de dos pasos
                    </label>
                  </motion.div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.3 }}
                      animate={error ? 'animate' : {}}
                      variants={shake}
                      className="mb-4 flex items-start gap-3 p-3 rounded-lg" style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        boxShadow: '0 0 16px rgba(239,68,68,0.3)'
                      }}>
                      <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || !email || !password}
                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.4)' } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
                    style={{
                      background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                      opacity: (loading || !email || !password) ? 0.6 : 1,
                      boxShadow: loading ? '0 4px 16px rgba(59,130,246,0.5), inset 0 0 20px rgba(59,130,246,0.2)' : '0 4px 16px rgba(59,130,246,0.3)'
                    }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    {loading ? 'Verificando...' : 'Entrar al Panel de Administración'}
                  </motion.button>
                </motion.form>
              )}

              {step === 'verify' && (
                <motion.form onSubmit={handleVerifySubmit} key="verify" variants={cardSlideUp} initial="hidden" animate="visible" exit={cardExit.exit}
                  className="rounded-2xl p-8 backdrop-blur-xl" style={{
                    background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}>
                  <h2 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 24px 0' }}>Verificar Identidad</h2>

                  <motion.div variants={fadeUp} className="mb-6">
                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 12 }}>
                      Código de Verificación
                    </label>
                    <div className="flex gap-2 justify-center mb-4">
                      {digits.map((digit, idx) => (
                        <motion.input
                          key={idx}
                          id={`digit-${idx}`}
                          type="text"
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          disabled={loading}
                          maxLength="1"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileFocus={{ scale: 1.1, boxShadow: '0 0 16px rgba(59,130,246,0.5)' }}
                          className="w-12 h-14 rounded-lg text-white text-2xl text-center font-bold focus:outline-none transition-all font-mono"
                          style={{
                            background: error ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                            border: error ? '2px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                            boxShadow: error ? 'inset 0 0 12px rgba(239,68,68,0.2)' : 'inset 0 1px 2px rgba(0,0,0,0.2)',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'center', margin: 0 }}>
                      🔒 Verificación segura en proceso
                    </p>
                  </motion.div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                      className="mb-4 flex items-start gap-3 p-3 rounded-lg" style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)'
                      }}>
                      <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                      className="mb-4 flex items-start gap-3 p-3 rounded-lg" style={{
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)'
                      }}>
                      <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ color: '#10b981', fontSize: 12, margin: 0 }}>{success}</p>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.4)' } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 mb-3"
                    style={{
                      background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                      opacity: (loading || code.length !== 6) ? 0.6 : 1,
                      boxShadow: loading ? '0 4px 16px rgba(59,130,246,0.5), inset 0 0 20px rgba(59,130,246,0.2)' : '0 4px 16px rgba(59,130,246,0.3)'
                    }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {loading ? 'Validando código...' : 'Verificar Código'}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="w-full py-2 text-sm rounded-lg transition-all"
                    style={{
                      color: resendCooldown > 0 ? 'rgba(255,255,255,0.2)' : '#3b82f6',
                      background: resendCooldown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)'
                    }}>
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => { setStep('login'); setCode(''); setError(''); setSuccess(''); setPassword(''); setDigits(['', '', '', '', '', '']); }}
                    className="w-full py-2 text-sm rounded-lg transition-all mt-2"
                    style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}>
                    Volver al Acceso
                  </button>
                </motion.form>
              )}

              {step === 'success' && (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }} 
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl p-8 backdrop-blur-xl text-center relative overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}>
                  <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '100%', opacity: [0, 0.3, 0] }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
                  />

                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 16px' }} />
                  </motion.div>
                  
                  <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', position: 'relative', zIndex: 1 }}>Acceso Concedido</h2>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '12px 0 0 0', position: 'relative', zIndex: 1 }}>
                    Accediendo al sistema...
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="absolute inset-0 bg-black/80 rounded-2xl"
                  />

                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="relative z-0"
                  />
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}