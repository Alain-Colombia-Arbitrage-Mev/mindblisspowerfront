import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, Home, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { sessionManager } from '@/lib/sessionManager';

const VALID_CREDENTIALS = {
  email: 'corona@vicion.com',
  password: '123456'
};

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shakeError, setShakeError] = useState(false);

  // Phase 6: Block login page if already authenticated
  useEffect(() => {
    sessionManager.validate();
    if (sessionManager.isAuthenticated()) {
      const status = sessionManager.getStatus();
      if (status === 'active') {
        navigate('/dashboard/home', { replace: true });
      } else if (status === 'onboarding') {
        navigate('/onboarding/resume', { replace: true });
      }
    }
  }, [navigate]);

  // SECURITY FAILSAFE: Remove any Google/external auth elements on mount
  // DOM manipulation removed — was causing null reference errors in platform layer

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShakeError(false);
    setLoading(true);

    // Validate input
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      setLoading(false);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }

    // Simulate network request
    setTimeout(() => {
      const emailLower = email.toLowerCase().trim();
      const hashed = btoa(unescape(encodeURIComponent(password)));

      // 1. Check registered onboarding users first
      const accounts = JSON.parse(localStorage.getItem('vp_user_accounts') || '{}');
      const vpUser = accounts[emailLower];

      if (vpUser && vpUser.password_hash === hashed) {
        setSuccess('✓ Acceso exitoso');
        sessionManager.activateUser({
          id: `vp_${emailLower.replace(/[^a-z0-9]/g, '_')}`,
          name: `${vpUser.nombre} ${vpUser.apellido}`,
          email: vpUser.email,
          rank: vpUser.planLabel || 'Miembro',
          role: 'user',
          path: vpUser.path,
          planLabel: vpUser.planLabel,
          planValue: vpUser.planValue,
        });
        setTimeout(() => navigate('/dashboard/home', { replace: true }), 800);
        return;
      }

      // 2. Fall back to hardcoded demo credentials
      if (emailLower === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
        const rootUser = platformDataCore.users.find(u => u.email === VALID_CREDENTIALS.email);
        if (!rootUser) {
          setError('Error del sistema: Usuario no encontrado');
          setLoading(false);
          setShakeError(true);
          setTimeout(() => setShakeError(false), 500);
          return;
        }
        setSuccess('✓ Acceso exitoso');
        sessionManager.activateUser({
          id: rootUser.id,
          name: rootUser.name,
          email: rootUser.email,
          rank: rootUser.rank,
          role: 'user',
        });
        localStorage.setItem('selected_user', rootUser.id);
        localStorage.setItem('selected_node', rootUser.id);
        setTimeout(() => navigate('/dashboard/home', { replace: true }), 800);
        return;
      }

      // 3. Invalid credentials
      setError('Credenciales incorrectas. Intenta de nuevo.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)'
    }}>
      {/* ANIMATED BACKGROUND ELEMENTS */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-100px',
        right: '-100px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-50px',
        left: '-50px',
        pointerEvents: 'none'
      }} />

      {/* HOME BUTTON */}
      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 rounded-lg transition-all hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.6)' }}
        title="Volver a Home"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Home size={20} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-6 relative z-10"
      >
        {/* PREMIUM CARD */}
        <motion.div 
          className="rounded-2xl p-8 backdrop-blur-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(13,31,60,0.5) 0%, rgba(8,18,40,0.35) 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
          animate={shakeError ? {
            x: [-10, 10, -10, 10, 0],
          } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* HEADER */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
              }}
            >
              <Lock size={32} style={{ color: 'white' }} />
            </motion.div>
            <h1 style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 900,
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>Acceso Plataforma</h1>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              margin: 0,
              fontWeight: 500
            }}>Control total de tu red</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* EMAIL INPUT */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontWeight: 700,
                display: 'block',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Email</label>
              <div className="relative group">
                <Mail size={16} style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(59,130,246,0.5)',
                  pointerEvents: 'none'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/25 focus:outline-none transition-all text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: email ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                />
              </div>
            </motion.div>

            {/* PASSWORD INPUT */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontWeight: 700,
                display: 'block',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Contraseña</label>
              <div className="relative group">
                <Lock size={16} style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(59,130,246,0.5)',
                  pointerEvents: 'none'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 rounded-lg text-white placeholder-white/25 focus:outline-none transition-all text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: password ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-all"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  whileHover={{ scale: 1.1 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
              </div>
            </motion.div>

            {/* ERROR MESSAGE */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex items-start gap-3 p-4 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.4)',
                }}
              >
                <AlertTriangle size={16} style={{ color: '#ff6b6b', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0, fontWeight: 600 }}>{error}</p>
              </motion.div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-lg backdrop-blur-sm"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.4)',
                }}
              >
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: '#10b981', fontSize: 12, margin: 0, fontWeight: 600 }}>{success}</p>
              </motion.div>
            )}

            {/* SUBMIT BUTTON */}
            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              whileHover={!loading && email && password ? { scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.4)' } : {}}
              whileTap={!loading && email && password ? { scale: 0.98 } : {}}
              className="w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
              style={{
                background: (email && password && !loading) ? 'linear-gradient(135deg, #1d6ef5, #3b82f6)' : 'rgba(59,130,246,0.3)',
                opacity: (loading || !email || !password) ? 0.6 : 1,
                boxShadow: (email && password && !loading) ? '0 8px 24px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar sesión
                </>
              )}
            </motion.button>
          </form>

          {/* FOOTER */}
          <motion.div 
            style={{ marginTop: 28, textAlign: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 14px 0' }}>
              ¿Aún no tienes acceso?
            </p>
            <motion.button
              onClick={() => navigate('/onboarding/start')}
              className="text-sm font-bold transition-all"
              style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
              whileHover={{ scale: 1.05 }}
            >
              Activar participación →
            </motion.button>
          </motion.div>

          {/* CREDENTIALS HINT */}
          <motion.p 
            style={{
              color: 'rgba(59,130,246,0.4)',
              fontSize: 10,
              textAlign: 'center',
              margin: '16px 0 0 0',
              fontWeight: 500,
              letterSpacing: '0.3px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Demo: corona@vicion.com / 123456
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}