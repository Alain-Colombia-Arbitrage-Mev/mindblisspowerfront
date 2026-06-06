import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, AlertCircle } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

export default function UserCreationForm({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'investor',
    access_level: 'basic',
    status: 'pending',
    user_type: 'Inversor',
    company: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Nombre, correo y teléfono son requeridos');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser = UserManagementEngine.createUser(formData);
      onUserCreated(newUser);
      setFormData({ full_name: '', email: '', phone: '', role: 'investor', access_level: 'basic', status: 'pending', user_type: 'Inversor', company: '', notes: '' });
      setLoading(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'rgba(9,21,42,0.95)', border: '1px solid rgba(59,130,246,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div>
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 4px 0' }}>NUEVO USUARIO</p>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>Crear Usuario</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <X size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@vicion.local"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34912345678"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Rol */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="investor" style={{ background: '#0d1f3c' }}>Inversor</option>
                <option value="leader" style={{ background: '#0d1f3c' }}>Líder</option>
                <option value="admin" style={{ background: '#0d1f3c' }}>Administrador</option>
                <option value="support" style={{ background: '#0d1f3c' }}>Soporte</option>
              </select>
            </div>

            {/* Nivel de Acceso */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nivel de Acceso
              </label>
              <select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="basic" style={{ background: '#0d1f3c' }}>Básico</option>
                <option value="intermediate" style={{ background: '#0d1f3c' }}>Intermedio</option>
                <option value="advanced" style={{ background: '#0d1f3c' }}>Avanzado</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="pending" style={{ background: '#0d1f3c' }}>Pendiente</option>
                <option value="active" style={{ background: '#0d1f3c' }}>Activo</option>
                <option value="under_review" style={{ background: '#0d1f3c' }}>En Revisión</option>
                <option value="blocked" style={{ background: '#0d1f3c' }}>Bloqueado</option>
              </select>
            </div>

            {/* Tipo de Usuario */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Tipo de Usuario
              </label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="Inversor" style={{ background: '#0d1f3c' }}>Inversor</option>
                <option value="Líder" style={{ background: '#0d1f3c' }}>Líder</option>
                <option value="Admin" style={{ background: '#0d1f3c' }}>Administrador</option>
                <option value="Soporte" style={{ background: '#0d1f3c' }}>Soporte</option>
              </select>
            </div>

            {/* Empresa */}
            <div className="col-span-2">
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Empresa (opcional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ej: Vicion España"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Notas */}
            <div className="col-span-2">
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Notas Internas (opcional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Agregar notas internas..."
                rows="3"
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}>
              <Plus size={14} />
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}