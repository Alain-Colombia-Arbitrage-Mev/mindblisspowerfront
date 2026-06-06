import { useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, DollarSign, MessageCircle, Plus, Search, Wrench, X } from 'lucide-react';
import { motion } from 'framer-motion';

const SUPPORT_CASES = [
  {
    id: 'CASE-001',
    subject: 'Consulta sobre bonificación',
    status: 'resolved',
    priority: 'high',
    date: '2 días atrás',
    response: 'Tu bonificación ha sido procesada correctamente.',
    icon: DollarSign,
  },
  {
    id: 'CASE-002',
    subject: 'Problema de acceso a red',
    status: 'in_progress',
    priority: 'high',
    date: '5 horas atrás',
    response: 'Nuestro equipo está revisando tu acceso...',
    icon: Wrench,
  },
  {
    id: 'CASE-003',
    subject: 'Actualización de datos personales',
    status: 'pending',
    priority: 'medium',
    date: '1 hora atrás',
    response: 'En espera de tu confirmación',
    icon: ClipboardList,
  },
];

export default function MemberSupport() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'medium' });
  const [search, setSearch] = useState('');

  const filteredCases = SUPPORT_CASES.filter(c =>
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return { color: '#10b981', label: 'Resuelto', icon: CheckCircle2 };
      case 'in_progress': return { color: '#3b82f6', label: 'En Progreso', icon: Clock };
      case 'pending': return { color: '#fb923c', label: 'Pendiente', icon: AlertCircle };
      default: return { color: 'rgba(255,255,255,0.4)', label: 'Desconocido', icon: AlertCircle };
    }
  };

  const StatusIcon = getStatusColor(selectedCase?.status).icon;

  return (
    <div className="p-8 space-y-6 max-w-5xl" style={{ background: 'linear-gradient(135deg, #060e1c 0%, #0a1628 100%)' }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, margin: '0 0 8px 0' }}>
              Soporte y Asistencia
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
              Gestiona tus solicitudes y obtén ayuda rápida
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={16} /> Nueva Solicitud
          </button>
        </div>
      </motion.div>

      {/* NEW CASE FORM */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(13,31,60,0.4)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>
            Crear Nueva Solicitud
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Asunto
              </label>
              <input
                type="text"
                placeholder="Describe tu consulta..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Descripción
              </label>
              <textarea
                placeholder="Detalle de tu solicitud..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-white text-sm"
                rows={4}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Solicitud creada: ' + formData.subject);
                  setShowForm(false);
                  setFormData({ subject: '', description: '', priority: 'medium' });
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SEARCH */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Buscar casos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>
      </motion.div>

      {/* CASES LIST */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
        {filteredCases.map((supportCase, i) => {
          const statusInfo = getStatusColor(supportCase.status);
          const StatusIcon = statusInfo.icon;
          const CaseIcon = supportCase.icon;

          return (
            <motion.div
              key={supportCase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCase(supportCase)}
              className="p-4 rounded-lg cursor-pointer transition-all"
              style={{
                background: selectedCase?.id === supportCase.id ? 'rgba(59,130,246,0.2)' : 'rgba(13,31,60,0.4)',
                border: selectedCase?.id === supportCase.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)', color: statusInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CaseIcon size={16} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>
                      {supportCase.id} - {supportCase.subject}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                      {supportCase.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon size={16} style={{ color: statusInfo.color }} />
                  <span style={{ color: statusInfo.color, fontSize: 11, fontWeight: 600 }}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CASE DETAIL */}
      {selectedCase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {selectedCase.subject}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
                {selectedCase.id}
              </p>
            </div>
            <button
              onClick={() => setSelectedCase(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}
            >
              <X size={18} />
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            {selectedCase.response}
          </p>
          <button
            style={{
              background: 'rgba(59,130,246,0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.3)',
              padding: '10px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MessageCircle size={14} /> Responder
          </button>
        </motion.div>
      )}
    </div>
  );
}
