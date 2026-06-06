import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function CommunicationGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            CONTROL DE COMUNICACIÓN
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Guía oficial de comunicación
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Esta guía define el lenguaje permitido y prohibido dentro de Vicion Power. Su cumplimiento es obligatorio para mantener la integridad del ecosistema.
        </p>
      </motion.div>

      {/* Prohibited Section */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          <h3 style={{ color: '#ef4444', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>
            Prohibido decir
          </h3>
        </div>

        <div className="space-y-3">
          {[
            { term: 'Retornos garantizados', desc: 'No puedes prometer resultados fijos o seguros' },
            { term: 'Duplicación de dinero', desc: 'No puedes hacer parecer que el capital se multiplicará automáticamente' },
            { term: 'Ingresos pasivos asegurados', desc: 'No puedes garantizar ingresos sin actividad' },
            { term: 'Inversión', desc: 'El sistema no es una inversión financiera tradicional' },
            { term: 'Dinero fácil', desc: 'No minimices el esfuerzo o compromiso requerido' },
            { term: 'Esquema de dinero rápido', desc: 'Enfatiza que el crecimiento toma tiempo y dedicación' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>✕</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{item.term}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Permitted Section */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle size={24} style={{ color: '#10b981' }} />
          <h3 style={{ color: '#10b981', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>
            Permitido decir
          </h3>
        </div>

        <div className="space-y-3">
          {[
            { term: 'Participación estructurada', desc: 'Enfatiza que es un sistema con estructura y orden' },
            { term: 'Acceso a beneficios', desc: 'Los beneficios se alcanzan según el nivel de participación' },
            { term: 'Crecimiento dentro del sistema', desc: 'El progreso es real pero depende de la actividad' },
            { term: 'Membresía con beneficios', desc: 'Describe claramente qué incluye cada nivel' },
            { term: 'Construcción de red', desc: 'Enfatiza el trabajo de formación y guía' },
            { term: 'Desarrollo a largo plazo', desc: 'El sistema requiere consistencia y tiempo' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>✓</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{item.term}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Warning Section */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
        variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(239,68,68,0.06))', border: '1px solid rgba(251,146,60,0.2)' }}>
        <div className="flex gap-4">
          <AlertTriangle size={20} style={{ color: '#f97316', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: '#f97316', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Consecuencias por incumplimiento</p>
            <div className="space-y-2">
              {[
                'Advertencia formal al usuario',
                'Restricción temporal de funciones de comunicación',
                'Limitación del acceso a panel y herramientas',
                'Suspensión de privilegios de red y referidos',
                'En casos graves: revocación de acceso a plataforma',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Acceptance Block */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
        variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Comprendo y acepto la guía de comunicación
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Al participar en Vicion Power, confirmo que he leído esta guía, comprendo las reglas de comunicación y asumo la responsabilidad de cumplirlas. El sistema será monitoreado para garantizar la coherencia y protección legal del ecosistema.
        </p>
      </motion.div>

      {/* Footer note */}
      <div className="text-center">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontStyle: 'italic' }}>
          Esta guía se aplica a todos los miembros sin excepción. Última actualización: 12 de abril, 2026
        </p>
      </div>
    </div>
  );
}