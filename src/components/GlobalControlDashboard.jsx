import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingUp, Users, Activity, CheckCircle2, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalControlDashboard() {
  const [status, setStatus] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryDetails, setCountryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionType, setInterventionType] = useState('training_reinforcement');

  useEffect(() => {
    const loadGlobalStatus = async () => {
      try {
        const res = await base44.functions.invoke('globalControlService', {
          action: 'get_global_status'
        });
        if (res.data.success) setStatus(res.data);
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGlobalStatus();
    const interval = setInterval(loadGlobalStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCountrySelect = async (countryCode) => {
    try {
      const res = await base44.functions.invoke('globalControlService', {
        action: 'get_country_monitoring',
        country_code: countryCode
      });
      if (res.data.success) {
        setCountryDetails(res.data);
        setSelectedCountry(countryCode);
      }
    } catch (error) {
      console.error('Details error:', error);
    }
  };

  const handleCreateIntervention = async (countryCode, countryName) => {
    try {
      const res = await base44.functions.invoke('globalControlService', {
        action: 'create_intervention',
        country_code: countryCode,
        country_name: countryName,
        intervention_type: interventionType,
        description: `${interventionType.replace(/_/g, ' ')} initiated`,
        target: 'country_leader'
      });
      if (res.data.success) {
        setShowIntervention(false);
        // Reload
        const res2 = await base44.functions.invoke('globalControlService', {
          action: 'get_country_monitoring',
          country_code: countryCode
        });
        if (res2.data.success) setCountryDetails(res2.data);
      }
    } catch (error) {
      console.error('Intervention error:', error);
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
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat' }}>
          CONTROL GLOBAL
        </p>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Monitor Internacional
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Crecimiento • Actividad • Cumplimiento de discurso • Evaluación de riesgo • Intervenciones
        </p>
      </motion.div>

      {/* Global Summary */}
      {status?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Países', value: status.summary.total_countries_monitored, color: '#3b82f6' },
            { label: 'Miembros', value: status.summary.total_members, color: '#10b981' },
            { label: 'Activos', value: status.summary.active_members, color: '#a78bfa' },
            { label: 'Riesgo Alto', value: status.summary.critical_risks, color: '#ef4444' },
            { label: 'Activación Promedio', value: `${status.summary.avg_activation_rate}%`, color: '#fb923c' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl text-center"
              style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
            >
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 6px 0' }}>
                {item.label}
              </p>
              <p style={{ color: item.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
                {item.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Risk Alert */}
      {status?.summary?.critical_risks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl flex items-start gap-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}
        >
          <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>
              ⚠️ {status.summary.critical_risks} país(es) con riesgo crítico
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
              Se requiere acción inmediata: refuerzo de formación, auditoría de comunicación
            </p>
          </div>
        </motion.div>
      )}

      {/* Countries Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          VISTA POR PAÍS
        </p>

        {['critical', 'high', 'medium', 'low'].map(level => (
          status?.monitoring_by_risk[level]?.length > 0 && (
            <div key={level} className="space-y-2">
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, margin: '8px 0 0 0' }}>
                {level.toUpperCase()} RISK ({status.monitoring_by_risk[level].length})
              </p>

              {status.monitoring_by_risk[level].map((country, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleCountrySelect(country.country_code)}
                  className="w-full p-4 rounded-lg text-left transition-all"
                  style={{
                    background:
                      level === 'critical'
                        ? 'rgba(239,68,68,0.1)'
                        : level === 'high'
                        ? 'rgba(251,146,60,0.1)'
                        : level === 'medium'
                        ? 'rgba(59,130,246,0.08)'
                        : 'rgba(16,185,129,0.08)',
                    border:
                      selectedCountry === country.country_code
                        ? `2px solid ${
                            level === 'critical'
                              ? '#ef4444'
                              : level === 'high'
                              ? '#fb923c'
                              : level === 'medium'
                              ? '#3b82f6'
                              : '#10b981'
                          }`
                        : `1px solid ${
                            level === 'critical'
                              ? 'rgba(239,68,68,0.2)'
                              : level === 'high'
                              ? 'rgba(251,146,60,0.2)'
                              : level === 'medium'
                              ? 'rgba(59,130,246,0.15)'
                              : 'rgba(16,185,129,0.15)'
                          }`
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                        {country.country_name}
                      </p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                          👥 {country.active_members} activos
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                          📈 {country.monthly_growth}% crecimiento
                        </span>
                        <span
                          style={{
                            color:
                              country.messaging_compliance > 85
                                ? '#10b981'
                                : country.messaging_compliance > 70
                                ? '#fb923c'
                                : '#ef4444',
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          ✓ {country.messaging_compliance}% cumplimiento
                        </span>
                      </div>
                      {country.risk_factors?.length > 0 && (
                        <p style={{ color: '#ef4444', fontSize: 10, margin: '6px 0 0 0' }}>
                          🚩 {country.risk_factors.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )
        ))}
      </motion.div>

      {/* Country Details */}
      <AnimatePresence>
        {countryDetails && selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 rounded-2xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
                {countryDetails.monitoring?.country_name || selectedCountry}
              </h3>
              <button
                onClick={() => {
                  setSelectedCountry(null);
                  setCountryDetails(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                ✕
              </button>
            </div>

            {countryDetails.monitoring && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                    MIEMBROS
                  </p>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>
                    {countryDetails.monitoring.total_members}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                    ACTIVACIÓN
                  </p>
                  <p style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>
                    {countryDetails.monitoring.activation_rate}%
                  </p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                    CUMPLIMIENTO
                  </p>
                  <p style={{ color: '#3b82f6', fontSize: 16, fontWeight: 700 }}>
                    {countryDetails.monitoring.messaging_compliance}%
                  </p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
                    INFRACCIONES
                  </p>
                  <p
                    style={{
                      color: countryDetails.monitoring.discourse_violations > 0 ? '#ef4444' : '#10b981',
                      fontSize: 16,
                      fontWeight: 700
                    }}
                  >
                    {countryDetails.monitoring.discourse_violations}
                  </p>
                </div>
              </div>
            )}

            {/* Active Risks */}
            {countryDetails.active_risks?.length > 0 && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
                  🚨 Riesgos Activos
                </p>
                {countryDetails.active_risks.map((risk, i) => (
                  <p key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0' }}>
                    • {risk.risk_type}: {risk.primary_issue}
                  </p>
                ))}
              </div>
            )}

            {/* Recent Interventions */}
            {countryDetails.recent_interventions?.length > 0 && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: '0 0 8px 0' }}>
                  ✓ Intervenciones Recientes
                </p>
                {countryDetails.recent_interventions.map((int, i) => (
                  <p key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '4px 0' }}>
                    • {int.intervention_type}: {int.status}
                  </p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowIntervention(!showIntervention)}
                style={{
                  flex: 1,
                  background: 'rgba(251,146,60,0.2)',
                  border: '1px solid rgba(251,146,60,0.3)',
                  color: '#fb923c',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Crear Intervención
              </button>
            </div>

            {showIntervention && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <select
                  value={interventionType}
                  onChange={e => setInterventionType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(13,31,60,0.6)',
                    color: 'white',
                    marginBottom: 12,
                    fontSize: 12
                  }}
                >
                  <option value="training_reinforcement">Refuerzo de Formación</option>
                  <option value="communication_adjustment">Ajuste de Comunicación</option>
                  <option value="leadership_coaching">Coaching de Liderazgo</option>
                  <option value="messaging_audit">Auditoría de Mensajería</option>
                </select>
                <button
                  onClick={() => handleCreateIntervention(selectedCountry, countryDetails.monitoring?.country_name)}
                  style={{
                    width: '100%',
                    background: 'rgba(16,185,129,0.2)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10b981',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirmar Intervención
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}