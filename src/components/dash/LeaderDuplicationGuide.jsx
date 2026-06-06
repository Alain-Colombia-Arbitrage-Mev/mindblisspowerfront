import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageCircle, AlertTriangle, Users, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const STEPS = [
  {
    id: 'understand',
    num: 1,
    icon: BookOpen,
    title: 'Entender el sistema',
    content: 'Vicion Power es una estructura de participación ordenada. No es inversión ni garantía de retorno. Es un ecosistema donde la progresión depende de tu actividad, compromiso y capacidad de liderar. Entiende esto profundamente antes de explicarlo a otros.',
    key_points: [
      'Participación estructurada, no inversión',
      'Resultados dependen de evolución del ecosistema',
      'Requisitos claros para cada nivel',
      'Responsabilidad compartida en la red',
    ],
  },
  {
    id: 'explain',
    num: 2,
    icon: MessageCircle,
    title: 'Cómo explicarlo',
    content: 'Explica en tres pasos: (1) Qué es — una estructura de membresía con beneficios y progresión. (2) Cómo funciona — participación activa, acceso a herramientas, comunidad. (3) Para quién es — personas que buscan orden, desarrollo y crecimiento real. Sé claro, honesto y específico.',
    key_points: [
      'Presenta los hechos, no promesas',
      'Explica requisitos de cada nivel',
      'Muestra ejemplos reales de progreso',
      'Sé transparente sobre responsabilidades',
    ],
  },
  {
    id: 'prohibited',
    num: 3,
    icon: AlertTriangle,
    title: 'Qué NO decir',
    content: 'No prometas dinero fácil, no uses palabras como "inversión", "retorno garantizado", "dinero pasivo", "duplicación de capital". No compares con esquemas ilegales. No presiones a nadie. La integridad es lo que mantiene a Vicion Power en pie. Si rompes esto, rompes el sistema.',
    prohibitedTerms: [
      'Garantizado',
      'Dinero fácil',
      'Retorno rápido',
      'Inversión',
      'Pasivo',
      'Duplicación',
      'Esquema piramidal',
    ],
  },
  {
    id: 'invite',
    num: 4,
    icon: Users,
    title: 'Cómo invitar correctamente',
    content: 'Invita solo a personas que creas que encajan. Sé específico: "Esto es una estructura de participación con beneficios y progresión. Requiere actividad constante". Responde sus dudas con honestidad. Si no entienden o no les interesa, no presiones. La calidad del equipo importa más que la cantidad.',
    key_points: [
      'Selecciona personas alineadas',
      'Sé claro sobre el compromiso requerido',
      'Responde todas sus preguntas',
      'Acompaña su primer mes de actividad',
    ],
  },
];

export default function LeaderDuplicationGuide({ onComplete }) {
  const [step, setStep] = useState(0);
  const [understood, setUnderstood] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast && understood) {
      onComplete();
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
      setUnderstood(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 py-6"
          style={{
            background: 'linear-gradient(180deg, #0d1f3c 0%, rgba(13,31,60,0.8) 100%)',
            borderBottom: '1px solid rgba(59,130,246,0.15)',
          }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap size={20} style={{ color: '#3b82f6' }} />
              <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>
                MODO CRECIMIENTO ACTIVADO
              </p>
            </div>
            <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, margin: '0 0 8px 0' }}>
              Tu primer paso como líder
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
              Completa esta guía antes de compartir tu enlace de referido
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-6" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 1.5, overflow: 'hidden', marginBottom: 8 }}>
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #1d6ef5, #3b82f6)' }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, paddingBottom: 16 }}>
            Paso {step + 1} de {STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Icon & Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                    boxShadow: '0 8px 16px rgba(59,130,246,0.2)',
                  }}>
                  <current.icon size={28} style={{ color: 'white' }} />
                </div>
                <div>
                  <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: 0, marginBottom: 4 }}>
                    PASO {current.num}
                  </p>
                  <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, margin: 0 }}>
                    {current.title}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                  {current.content}
                </p>
              </div>

              {/* Key Points or Prohibited Terms */}
              {current.prohibitedTerms ? (
                <div className="mb-8">
                  <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
                    ❌ PALABRAS PROHIBIDAS
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {current.prohibitedTerms.map((term, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: 'rgba(255,255,255,0.6)',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {term}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
                    PUNTOS CLAVE
                  </p>
                  <div className="space-y-2">
                    {current.key_points.map((point, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-2 h-2 rounded-full mt-2" style={{ background: '#3b82f6', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{point}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkbox */}
              <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={e => setUnderstood(e.target.checked)}
                  className="mt-1 accent-blue-500 cursor-pointer"
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5 }}>
                  Entiendo esta sección y me comprometo a aplicarla correctamente
                </span>
              </label>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 px-8 py-6"
          style={{
            background: 'linear-gradient(180deg, rgba(13,31,60,0) 0%, #0a1628 80%)',
            borderTop: '1px solid rgba(59,130,246,0.1)',
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          {/* Skip info */}
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
            No puedes saltar esta guía
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                }}
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!understood}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                background: understood ? 'linear-gradient(135deg, #1d6ef5, #3b82f6)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: understood ? 'pointer' : 'not-allowed',
                opacity: understood ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Montserrat,sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (understood) e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {isLast ? (
                <>
                  <CheckCircle2 size={16} /> Completar guía
                </>
              ) : (
                <>
                  Siguiente <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}