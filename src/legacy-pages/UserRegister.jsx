import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';

export default function UserRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Check if email already exists
    const existingUser = platformDataCore.users.find(u => u.email === formData.email);
    if (existingUser) {
      setError('El email ya está registrado');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        password: formData.password, // In production, never store plaintext passwords
        role: 'inversor',
        rank: 'Principiante',
        rank_icon: '🌱',
        status: 'activo',
        country: 'CO',
        created_at: new Date().toISOString(),
      };

      // Add to platform core
      platformDataCore.users.push(newUser);

      setSuccess('Cuenta creada exitosamente');
      
      setTimeout(() => {
        // Auto-login
        localStorage.setItem('user_auth', 'true');
        localStorage.setItem('user_id', newUser.id);
        localStorage.setItem('user_data', JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          rank: newUser.rank,
          role: newUser.role,
          type: 'user'
        }));
        
        navigate('/dashboard/network', { replace: true });
      }, 1000);

      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)'
    }}>
      {/* HOME BUTTON */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 rounded-lg transition-all hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.6)' }}
        title="Volver a Home"
      >
        <Home size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6"
      >
        <div className="rounded-2xl p-8 backdrop-blur-xl" style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 8px 0'
          }}>Crear Cuenta</h1>
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
            margin: '0 0 32px 0'
          }}>Únete a la Red Binaria Vicion</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 8
              }}>Nombre Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>

            <div>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 8
              }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>

            <div>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 8
              }}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 600,
                display: 'block',
                marginBottom: 8
              }}>Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu contraseña"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: '#10b981', fontSize: 12, margin: 0 }}>{success}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Crear Cuenta'}
            </motion.button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 12px 0' }}>
              ¿Ya tienes cuenta?
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold transition-colors hover:text-white"
              style={{ color: '#3b82f6' }}
            >
              Iniciar sesión aquí
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}