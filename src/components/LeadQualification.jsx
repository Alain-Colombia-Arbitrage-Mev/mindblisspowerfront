import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lightbulb } from 'lucide-react';
import SocialProofCarousel from './SocialProofCarousel';
import StorytellingSection from './StorytellingSection';
import FunnelBridge from './FunnelBridge';

const STEP_1_OPTIONS = [
  {
    id: 'stability',
    label: 'Estabilidad',
    desc: 'Busco seguridad y claridad en mis decisiones',
    icon: '🛡️',
    color: '#3b82f6',
  },
  {
    id: 'growth',
    label: 'Crecimiento',
    desc: 'Quiero expandir mis oportunidades',
    icon: '📈',
    color: '#10b981',
  },
  {
    id: 'explore',
    label: 'Explorar opciones',
    desc: 'Apenas estoy investigando diferentes caminos',
    icon: '🔍',
    color: '#f59e0b',
  },
  {
    id: 'income',
    label: 'Generar ingresos',
    desc: 'Necesito ver alternativas de monetización',
    icon: '💰',
    color: '#ec4899',
  },
];

const STEP_2_OPTIONS = [
  {
    id: 'participate',
    label: 'Participar',
    desc: 'Estoy listo para dar el paso',
    icon: '✅',
    color: '#10b981',
  },
  {
    id: 'understand',
    label: 'Entender primero',
    desc: 'Quiero conocer más antes de decidir',
    icon: '🧠',
    color: '#a855f7',
  },
];

export default function LeadQualification({ onNavigate }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    seeking: null,
    intent: null,
  });

  const handleStep1 = (option) => {
    setAnswers(prev => ({
      ...prev,
      seeking: option.id,
    }));
    setStep(2);
  };

  const handleStep2 = (option) => {
    const newAnswers = {
      ...answers,
      intent: option.id,
    };
    setAnswers(newAnswers);
    setStep(3);
  };

  const handleBridgeComplete = () => {
    // After bridge, route based on intent
    if (answers.intent === 'understand') {
      navigate('/');
    } else {
      navigate('/onboarding', { state: { qualificationData: answers } });
    }
  };

  const stageMessages = {
    understand: {
      title: 'Vamos a explorar juntos',
      narrative: 'Sin presión. Sin venta. Solo claridad sobre cómo funciona Mindbliss Power y si es para ti.',
      cta: 'Ver la plataforma',
    },
    participate: {
      title: 'Un paso importante',
      narrative: 'Pasaste el filtro. Ahora te mostraremos el camino completo: estructura, beneficios, cómo empezar.',
      cta: 'Continuar al onboarding',
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #020408 100%)' }}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          // Step 1: What are you looking for?
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl">
            
            {/* Header */}
            <div className="mb-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="mb-6">
                <Lightbulb size={48} style={{ color: '#3b82f6', marginLeft: 'auto', marginRight: 'auto' }} />
              </motion.div>
              <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, marginBottom: 12, margin: '0 0 12px 0' }}>
                Primero, entendamos dónde estás
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                ¿Qué buscas ahora mismo?
              </p>
            </div>

            {/* Options Grid */}
            <div className="space-y-4 mb-12">
              {STEP_1_OPTIONS.map((option, i) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleStep1(option)}
                  className="w-full p-6 rounded-2xl text-left transition-all hover:scale-102"
                  style={{
                    background: `${option.color}12`,
                    border: `1px solid ${option.color}30`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${option.color}20`;
                    e.currentTarget.style.borderColor = `${option.color}50`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${option.color}12`;
                    e.currentTarget.style.borderColor = `${option.color}30`;
                  }}>
                  
                  <div className="flex items-start gap-4">
                    <div style={{ fontSize: 24 }}>{option.icon}</div>
                    <div className="flex-1">
                      <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
                        {option.label}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
                        {option.desc}
                      </p>
                    </div>
                    <ArrowRight size={20} style={{ color: option.color, flexShrink: 0, marginTop: 2 }} />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Progress indicator */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '33%' }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
              />
            </div>
          </motion.div>
        ) : step === 2 ? (
          // Step 2: Participate or understand?
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl">
            
            {/* Header */}
            <div className="mb-12">
              {/* Back button */}
              <button
                onClick={() => setStep(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 24,
                  fontWeight: 600,
                }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
                ← Volver
              </button>

              {/* Selected answer from step 1 */}
              <div className="mb-8 p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>
                  TU RESPUESTA
                </p>
                <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, margin: 0 }}>
                  {STEP_1_OPTIONS.find(o => o.id === answers.seeking)?.label}
                </p>
              </div>

              <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, marginBottom: 8, margin: '0 0 8px 0' }}>
                Siguiente paso
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                ¿Te interesa participar o solo entender?
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-12">
              {STEP_2_OPTIONS.map((option, i) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleStep2(option)}
                  className="w-full p-6 rounded-2xl text-left transition-all hover:scale-102"
                  style={{
                    background: `${option.color}12`,
                    border: `1px solid ${option.color}30`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${option.color}20`;
                    e.currentTarget.style.borderColor = `${option.color}50`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${option.color}12`;
                    e.currentTarget.style.borderColor = `${option.color}30`;
                  }}>
                  
                  <div className="flex items-start gap-4">
                    <div style={{ fontSize: 24 }}>{option.icon}</div>
                    <div className="flex-1">
                      <p style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
                        {option.label}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
                        {option.desc}
                      </p>
                    </div>
                    <ArrowRight size={20} style={{ color: option.color, flexShrink: 0, marginTop: 2 }} />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Progress indicator */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '33%' }}
                animate={{ width: '66%' }}
                transition={{ duration: 0.5 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
              />
            </div>
          </motion.div>
        ) : step === 3 ? (
          // Step 3: Bridge with storytelling + social proof
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl"
          >
            {/* Storytelling context */}
            <div className="mb-16">
              <StorytellingSection />
            </div>

            {/* Social proof before final CTA */}
            <div className="mb-16">
              <div className="mb-12 text-center">
                <p style={{
                  color: '#3b82f6',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  margin: '0 0 12px 0',
                  fontFamily: 'Montserrat, sans-serif',
                }}>LO QUE OTROS ENCONTRARON</p>
                <h2 style={{
                  color: 'white',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  fontSize: 26,
                  margin: '0 0 8px 0',
                }}>Historias reales</h2>
              </div>
              <SocialProofCarousel />
            </div>

            {/* Bridge component */}
            <FunnelBridge
              currentStage="qualify"
              nextStage={answers.intent === 'understand' ? 'content' : 'onboarding'}
              title={stageMessages[answers.intent].title}
              narrative={stageMessages[answers.intent].narrative}
              ctaText={stageMessages[answers.intent].cta}
              onProceed={handleBridgeComplete}
              completedItems={[
                'Entendiste qué buscas',
                'Decidiste tu próximo paso',
                'Conociste historias de otros',
              ]}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}