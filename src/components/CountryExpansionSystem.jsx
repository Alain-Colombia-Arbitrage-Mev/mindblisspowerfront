import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, User, CheckCircle2, Lock, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CountryExpansionSystem() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await base44.functions.invoke('countryExpansionService', {
          action: 'get_expansion_status'
        });
        if (res.data.success) setStatus(res.data.status);
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteTraining = async (leaderId) => {
    try {
      const res = await base44.functions.invoke('countryExpansionService', {
        action: 'complete_training',
        country_leader_id: leaderId
      });
      if (res.data.success) {
        // Reload
        const res2 = await base44.functions.invoke('countryExpansionService', {
          action: 'get_expansion_status'
        });
        if (res2.data.success) setStatus(res2.data.status);
      }
    } catch (error) {
      console.error('Training error:', error);
    }
  };

  const handleInitiateExpansion = async (leaderId) => {
    try {
      const res = await base44.functions.invoke('countryExpansionService', {
        action: 'initiate_expansion',
        country_leader_id: leaderId
      });
      if (res.data.success) {
        // Reload
        const res2 = await base44.functions.invoke('countryExpansionService', {
          action: 'get_expansion_status'
        });
        if (res2.data.success) setStatus(res2.data.status);
      } else {
        alert('Error: ' + res.data.error);
      }
    } catch (error) {
      console.error('Expansion error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ color: '#3b82f6', fontSize: 14 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: 'Montserrat' }}>
            EXPANSIÓN POR PAÍS
          </p>
        </div>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Sistema de Crecimiento Controlado
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Líder formado → Estructura base → Soporte local → Expansión activa
        </p>
      </motion.div>

      {/* Summary Stats */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              PAÍSES TOTALES
            </p>
            <p style={{ color: '#3b82f6', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {status.total_countries}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              EXPANSIONES ACTIVAS
            </p>
            <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {status.active_expansions}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              PENDIENTES DE ACTIVACIÓN
            </p>
            <p style={{ color: '#fb923c', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {status.pending_approval}
            </p>
          </motion.div>
        </div>
      )}

      {/* Countries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          LÍDERES Y ESTADO
        </p>

        <div className="space-y-3">
          {status?.countries && status.countries.length === 0 ? (
            <div className="text-center p-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No hay líderes de país registrados
            </div>
          ) : (
            status?.countries.map((country, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-lg"
                style={{
                  background:
                    country.expansion_status === 'active'
                      ? 'rgba(16,185,129,0.08)'
                      : country.training_completed
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(251,146,60,0.08)',
                  border:
                    country.expansion_status === 'active'
                      ? '1px solid rgba(16,185,129,0.2)'
                      : country.training_completed
                      ? '1px solid rgba(59,130,246,0.2)'
                      : '1px solid rgba(251,146,60,0.2)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe size={18} style={{ color: '#3b82f6' }} />
                      <div>
                        <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>
                          {country.country_name} ({country.country_code})
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0 0' }}>
                          Líder: {country.leader}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                          Formación
                        </p>
                        <div className="flex items-center gap-2">
                          {country.training_completed ? (
                            <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                          ) : (
                            <Lock size={14} style={{ color: '#fb923c' }} />
                          )}
                          <span
                            style={{
                              color: country.training_completed ? '#10b981' : '#fb923c',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            {country.formation_status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                          Expansión
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            background:
                              country.expansion_status === 'active'
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(251,146,60,0.2)',
                            color:
                              country.expansion_status === 'active'
                                ? '#10b981'
                                : '#fb923c',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {country.expansion_status}
                        </span>
                      </div>

                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                          Mentor
                        </p>
                        <p style={{ color: 'white', fontSize: 12, fontWeight: 500, margin: 0 }}>
                          {country.mentor}
                        </p>
                      </div>

                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                          Compliance
                        </p>
                        <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, margin: 0 }}>
                          {country.compliance_score}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!country.training_completed && (
                      <button
                        onClick={() => handleCompleteTraining(country.country_code)}
                        style={{
                          background: 'rgba(251,146,60,0.2)',
                          border: '1px solid rgba(251,146,60,0.3)',
                          color: '#fb923c',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Completar formación
                      </button>
                    )}

                    {country.training_completed && country.expansion_status === 'not_started' && (
                      <button
                        onClick={() => handleInitiateExpansion(country.country_code)}
                        style={{
                          background: 'rgba(59,130,246,0.2)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          color: '#3b82f6',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Iniciar expansión
                      </button>
                    )}

                    {country.expansion_status === 'active' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#10b981',
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        <TrendingUp size={14} />
                        Activa
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div className="flex gap-3">
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
              REGLA CRÍTICA
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              No se permite expansión en un país sin que el líder haya completado su formación. La formación garantiza conocimiento de directrices, cumplimiento normativo y comunicación responsable.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}