import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, CheckCircle2, Lock, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CulturalMessagingAdapter() {
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState(null);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await base44.functions.invoke('culturalMessagingService', {
          action: 'get_pending_approvals'
        });
        if (res.data.success) setPending(res.data);
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPending();
  }, []);

  const handleApprove = async (messageId) => {
    try {
      const res = await base44.functions.invoke('culturalMessagingService', {
        action: 'approve_message',
        message_id: messageId
      });
      if (res.data.success) {
        // Reload
        const res2 = await base44.functions.invoke('culturalMessagingService', {
          action: 'get_pending_approvals'
        });
        if (res2.data.success) setPending(res2.data);
      }
    } catch (error) {
      console.error('Approval error:', error);
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
            MENSAJERÍA CULTURAL
          </p>
        </div>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Adaptación de Mensajes por País
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Sistema sin cambios. Solo adaptan: tono emocional, ejemplos locales, lenguaje contextual
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl"
        style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <AlertCircle size={20} style={{ color: '#fb923c' }} />
          <div>
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
              MENSAJES PENDIENTES DE APROBACIÓN
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {pending?.total_pending || 0} mensajes esperando revisión
            </p>
          </div>
        </div>
      </motion.div>

      {/* By Country */}
      <div className="space-y-4">
        {pending?.by_country && Object.entries(pending.by_country).map(([country, messages]) => (
          <motion.div
            key={country}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <button
              onClick={() => setExpandedCountry(expandedCountry === country ? null : country)}
              className="w-full text-left"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 0
              }}
            >
              <div className="flex items-center gap-3">
                <Globe size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {country}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0 0' }}>
                    {messages.length} mensaje{messages.length !== 1 ? 's' : ''} pendiente{messages.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span style={{ color: '#fb923c', fontSize: 12, fontWeight: 700 }}>
                {expandedCountry === country ? '▼' : '▶'}
              </span>
            </button>

            {expandedCountry === country && (
              <div className="mt-6 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                          {msg.message_key}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                          "{msg.localized_message}"
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            style={{
                              display: 'inline-block',
                              background: 'rgba(168,85,247,0.2)',
                              color: '#a855f7',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600
                            }}
                          >
                            {msg.emotional_tone}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                            • {new Date(msg.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApprove(msg.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(16,185,129,0.2)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          color: '#10b981',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = 'rgba(16,185,129,0.3)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = 'rgba(16,185,129,0.2)';
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Aprobar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {pending?.total_pending === 0 && (
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>
              Todos los mensajes aprobados
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              Tu adaptación cultural está completa
            </p>
          </div>
        )}
      </div>

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          CÓMO FUNCIONA
        </p>

        <div className="space-y-6">
          {[
            {
              num: 1,
              title: 'Tono Emocional',
              desc: 'Cada país recibe el mismo mensaje con un tono adaptado: más formal en Alemania, más inspiracional en Latinoamérica, más directo en Asia'
            },
            {
              num: 2,
              title: 'Ejemplos Locales',
              desc: 'Se adaptan los ejemplos al contexto cultural. Referencias a industrias, valores y situaciones locales que resonan'
            },
            {
              num: 3,
              title: 'Lenguaje Contextual',
              desc: 'Vocabulario y frases específicas del país. Se evitan términos que puedan generar confusión o rechazo cultural'
            },
            {
              num: 4,
              title: 'Sistema Intacto',
              desc: 'La lógica del sistema permanece 100% igual. Solo cambia cómo se comunica, no qué se comunica'
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex gap-4"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.2)' }}
              >
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{item.num}</span>
              </div>
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                  {item.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Benefit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-6 rounded-2xl flex items-start gap-4"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <Zap size={20} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: '0 0 6px 0' }}>
            RESULTADO
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
            Los usuarios sienten que el producto fue diseñado para su país específico. Aumenta confianza, engagement y receptividad. Sin cambiar un solo elemento del sistema operativo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}