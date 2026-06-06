import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

const GUIDE_STEPS = [
  { num: 1, title: 'Qué activaste', desc: 'Completaste tu participación en la estructura y accediste a todos los beneficios asociados.' },
  { num: 2, title: 'Qué significa tu nivel', desc: 'Tu nivel define el acceso a funcionalidades, beneficios y la velocidad de tu progresión dentro del sistema.' },
  { num: 3, title: 'Qué puedes hacer ahora', desc: 'Ya puedes revisar tu red, acceder a la formación, simular crecimiento y activar tu estructura completa.' },
  { num: 4, title: 'Cómo avanzar', desc: 'Sigue los pasos sugeridos en tu panel, completa la formación y mantén actividad constante para evolucionar.' },
];

export default function FirstLoginGuide({ onClose }) {
  const [step, setStep] = useState(null);

  return (
    <AnimatePresence>
      {step === null ? (
        // Initial Modal
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-md w-full rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 26, marginBottom: 16 }}
              >
                Comencemos paso a paso
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}
              >
                No necesitas entender todo ahora.<br />Solo sigue el proceso.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setStep(0)}
                className="w-full px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', fontSize: 15, fontFamily: 'Montserrat, sans-serif' }}
              >
                Iniciar guía <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        // Guide Steps
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-md w-full rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Progress */}
            <div className="mb-6">
              <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${((step + 1) / GUIDE_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #1d6ef5, #3b82f6)' }}
                />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>Paso {step + 1} de {GUIDE_STEPS.length}</p>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: 28 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'white',
                      fontSize: 20,
                      marginBottom: 16,
                    }}
                  >
                    {GUIDE_STEPS[step].num}
                  </div>
                  <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 12 }}>
                    {GUIDE_STEPS[step].title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7 }}>
                    {GUIDE_STEPS[step].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 }}
              >
                {step > 0 ? 'Atrás' : 'Cerrar'}
              </button>
              <button
                onClick={() => step < GUIDE_STEPS.length - 1 ? setStep(step + 1) : onClose()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', color: 'white', fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}
              >
                {step < GUIDE_STEPS.length - 1 ? <>Siguiente <ChevronRight size={16} /></> : 'Entendido'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}