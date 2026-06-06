import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function ActivationMoment({ isVisible = true, onComplete = null, isFirstStep = true }) {
  const [showContent, setShowContent] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Delay initial animation
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleContinue = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #0F1419 0%, #050c1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              maxWidth: 600,
              textAlign: 'center'
            }}
          >
            {/* Decorative top element */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 100 }}
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))',
                border: '2px solid rgba(59,130,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle size={40} style={{ color: '#10b981' }} />
              </motion.div>
            </motion.div>

            {/* Main Message - Step 0 */}
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  style={{ space: 'y-24' }}
                >
                  <motion.h1
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      margin: '0 0 16px 0',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.2
                    }}
                  >
                    Hoy tomaste una decisión diferente
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      fontSize: 18,
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.7)',
                      margin: '0 0 40px 0',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.6
                    }}
                  >
                    No volveras atrás. Tu estructura comienza ahora.
                  </motion.p>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 60 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                      height: 2,
                      background: '#3b82f6',
                      margin: '0 auto 40px'
                    }}
                  />
                </motion.div>
              )}

              {/* Welcome Message - Step 1 */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h2
                    style={{
                      fontSize: 40,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      margin: '0 0 16px 0',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.2
                    }}
                  >
                    Bienvenido a una nueva forma de avanzar
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.6)',
                      margin: '0 0 40px 0',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.6
                    }}
                  >
                    Ahora formas parte de una comunidad de quienes entienden que el valor se construye en el tiempo.
                  </motion.p>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 60 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                      height: 2,
                      background: '#10b981',
                      margin: '0 auto 40px'
                    }}
                  />
                </motion.div>
              )}

              {/* Next Steps - Step 2 */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h2
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      margin: '0 0 12px 0',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.2
                    }}
                  >
                    Tu primer paso
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#fb923c',
                      margin: '0 0 28px 0',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: 2,
                      textTransform: 'uppercase'
                    }}
                  >
                    Obligatorio para continuar
                  </motion.p>

                  <div className="space-y-4" style={{ marginBottom: 40 }}>
                    {[
                      'Completa tu formación inicial',
                      'Entiende la estructura del sistema',
                      'Valida tu identidad dentro del movimiento'
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 0'
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(59,130,246,0.2)',
                            border: '1px solid rgba(59,130,246,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2
                          }}
                        >
                          <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>
                            {i + 1}
                          </span>
                        </div>
                        <p
                          style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 14,
                            fontWeight: 400,
                            margin: 0,
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: 1.5
                          }}
                        >
                          {item}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onClick={handleContinue}
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                margin: '0 auto',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
              }}
            >
              {step < 2 ? 'Continuar' : 'Comenzar mi camino'}
              <ArrowRight size={16} />
            </motion.button>

            {/* Progress indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginTop: 32
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: step === i ? 24 : 8,
                    background: step >= i ? '#3b82f6' : 'rgba(255,255,255,0.2)'
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: 8,
                    borderRadius: 4
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Ambient background elements */}
          <motion.div
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '20%',
              left: '10%',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent)',
              filter: 'blur(50px)',
              pointerEvents: 'none'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}