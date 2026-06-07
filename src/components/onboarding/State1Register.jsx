import { useState } from 'react';
import { Mail, Lock, User, Loader, CheckCircle } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

export default function State1Register({ onComplete }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nombre || !email || !password) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await simulatedApi.register(email, nombre, password);
      setSuccess(true);
      setTimeout(() => {
        onComplete({ userId: result.userId, email, nombre });
      }, 1500);
    } catch (err) {
      setError('Error al crear cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <User size={24} style={{ color: '#3b82f6' }} />
        </div>
        <h1 className="font-montserrat font-black text-2xl text-white mb-2">Crea tu cuenta</h1>
        <p className="text-white/50 text-sm">Inicia tu participación en Mindbliss Power</p>
      </div>

      {success ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} style={{ color: '#10b981' }} />
          </div>
          <p className="text-white font-semibold mb-2">Cuenta creada correctamente</p>
          <p className="text-white/50 text-sm">Redirigiendo a verificación...</p>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Nombre completo</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <User size={18} style={{ color: '#3b82f6' }} />
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-transparent text-white outline-none flex-1"
                placeholder="María García"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Correo electrónico</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Mail size={18} style={{ color: '#3b82f6' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-white outline-none flex-1"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Contraseña</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock size={18} style={{ color: '#3b82f6' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-white outline-none flex-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold font-montserrat transition-all duration-200 text-white flex items-center justify-center gap-2"
            style={{
              background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Creando tu acceso…
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>
      )}
    </div>
  );
}