import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Calendar, Shield, Edit2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

const STATUS_COLORS = {
  active: { bg: 'rgba(16,185,129,0.15)', text: '#10b981', label: 'Activo' },
  pending: { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', label: 'Pendiente' },
  under_review: { bg: 'rgba(6,182,212,0.15)', text: '#06b6d4', label: 'En Revisión' },
  blocked: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: 'Bloqueado' },
};

export default function UserDetailPanel({ user, isOpen, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState(user?.upline_id || '');
  const [selectedSide, setSelectedSide] = useState(user?.network_side || 'left');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const config = STATUS_COLORS[user.status] || STATUS_COLORS.pending;

  const handleSendInvitation = () => {
    setLoading(true);
    setTimeout(() => {
      const result = UserManagementEngine.sendInvitation(user.id);
      if (result.success) {
        onUpdated();
        alert(`Invitación enviada a ${user.email}`);
      }
      setLoading(false);
    }, 500);
  };

  const handleGenerateCredentials = () => {
    setLoading(true);
    setTimeout(() => {
      const result = UserManagementEngine.generateCredentials(user.id);
      if (result.success) {
        setCredentials(result.credentials);
        setShowCredentials(true);
        onUpdated();
      }
      setLoading(false);
    }, 500);
  };

  const handleAssignLeader = () => {
    if (selectedLeader) {
      setLoading(true);
      setTimeout(() => {
        UserManagementEngine.assignLeader(user.id, selectedLeader);
        onUpdated();
        setLoading(false);
      }, 300);
    }
  };

  const handleAssignNetworkSide = () => {
    if (selectedLeader) {
      setLoading(true);
      setTimeout(() => {
        UserManagementEngine.assignNetworkSide(user.id, selectedSide, selectedLeader);
        onUpdated();
        setLoading(false);
      }, 300);
    }
  };

  const allUsers = UserManagementEngine.getAllUsers();
  const leaders = allUsers.filter(u => u.role === 'leader' && u.id !== user.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="fixed right-0 top-0 bottom-0 w-96 overflow-y-auto rounded-l-2xl"
        style={{ background: 'rgba(9,21,42,0.95)', border: '1px solid rgba(59,130,246,0.25)', borderRight: 'none' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 sticky top-0" style={{ background: 'rgba(9,21,42,0.98)' }}>
          <div>
            <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: 2, margin: '0 0 2px 0' }}>PERFIL DE USUARIO</p>
            <h3 style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: 0 }}>{user.full_name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4 border-b border-white/8" style={{ background: 'rgba(9,21,42,0.99)' }}>
          {['profile', 'network', 'actions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-2 text-xs font-semibold rounded-t-lg transition-all"
              style={{
                background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
              }}>
              {tab === 'profile' ? 'Perfil' : tab === 'network' ? 'Red' : 'Acciones'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Status */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>ESTADO</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: config.bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: config.text }} />
                  <span style={{ color: config.text, fontSize: 12, fontWeight: 600 }}>{config.label}</span>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'ID', value: user.id, icon: null },
                  { label: 'Rol', value: user.role, icon: Shield },
                  { label: 'Nivel', value: user.access_level, icon: null },
                  { label: 'Tipo', value: user.user_type, icon: null },
                  { label: 'Empresa', value: user.company || 'N/A', icon: null },
                  { label: 'Inversión', value: `$${user.investment_total}`, icon: null },
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 2px 0' }}>{item.label.toUpperCase()}</p>
                    <p style={{ color: 'white', fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Mail size={12} style={{ color: '#3b82f6' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Phone size={12} style={{ color: '#3b82f6' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{user.phone}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Assign Leader */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>ASIGNAR LÍDER</p>
                <div className="space-y-2">
                  <select
                    value={selectedLeader}
                    onChange={e => setSelectedLeader(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="" style={{ background: '#0d1f3c' }}>Seleccionar líder...</option>
                    {leaders.map(leader => (
                      <option key={leader.id} value={leader.id} style={{ background: '#0d1f3c' }}>
                        {leader.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignLeader}
                    disabled={!selectedLeader || loading}
                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                    style={{ background: !selectedLeader ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.3)' }}>
                    {loading ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>

              {/* Network Side */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>LADO DE RED</p>
                <div className="flex gap-2 mb-2">
                  {['left', 'right'].map(side => (
                    <button
                      key={side}
                      onClick={() => setSelectedSide(side)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: selectedSide === side ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
                        color: selectedSide === side ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${selectedSide === side ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                      {side === 'left' ? 'Izquierda' : 'Derecha'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAssignNetworkSide}
                  disabled={!selectedLeader || loading}
                  className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                  style={{ background: !selectedLeader ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.3)' }}>
                  {loading ? 'Asignando...' : 'Asignar Posición'}
                </button>
              </div>

              {/* Current Network */}
              {user.upline_id && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 6px 0', fontWeight: 700 }}>ASIGNACIÓN ACTUAL</p>
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: 0 }}>
                    Líder: {allUsers.find(u => u.id === user.upline_id)?.full_name || 'N/A'}
                  </p>
                  {user.network_side && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '4px 0 0 0' }}>
                      Lado: {user.network_side === 'left' ? 'Izquierda' : 'Derecha'}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'actions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <button
                onClick={handleSendInvitation}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
                <Send size={14} />
                {loading ? 'Enviando...' : 'Enviar Invitación'}
              </button>

              <button
                onClick={handleGenerateCredentials}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                <CheckCircle size={14} />
                {loading ? 'Generando...' : 'Generar Credenciales'}
              </button>

              <AnimatePresence>
                {showCredentials && credentials && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>CREDENCIALES GENERADAS</p>
                    <div className="space-y-1">
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 2px 0' }}>Correo:</p>
                        <p style={{ color: 'white', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>
                          {credentials.email}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 2px 0' }}>Contraseña Temporal:</p>
                        <p style={{ color: '#10b981', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>
                          {credentials.temp_password}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}