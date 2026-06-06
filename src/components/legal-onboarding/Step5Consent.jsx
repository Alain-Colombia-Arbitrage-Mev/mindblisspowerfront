import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Step5Consent({ onNext, onBack, onSubmit }) {
  const [checks, setChecks] = useState({
    terms: false,
    privacy: false,
    risks: false,
    noGuarantees: false,
  });

  const allChecked = Object.values(checks).every(v => v);

  const handleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    if (allChecked) {
      const consentData = {
        timestamp: new Date().toISOString(),
        ip: window.location.hostname,
        checks,
        termsVersion: '1.0'
      };
      onSubmit?.(consentData);
      onNext();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="max-w-2xl w-full">
        
        <h1 className="font-montserrat font-black text-5xl text-vicion-deep mb-6">
          Confirmación de participación
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          Al continuar, confirmas que:
        </p>

        <div className="space-y-3 mb-12 p-6 rounded-xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-vicion-blue flex-shrink-0 mt-1" />
            <span className="text-gray-700">has leído y comprendido la información presentada</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-vicion-blue flex-shrink-0 mt-1" />
            <span className="text-gray-700">aceptas los términos y condiciones</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-vicion-blue flex-shrink-0 mt-1" />
            <span className="text-gray-700">entiendes la naturaleza del sistema</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 font-semibold mb-6">Confirmaciones obligatorias:</p>

        <div className="space-y-4 mb-12">
          {[
            { key: 'terms', label: 'Acepto los Términos y Condiciones' },
            { key: 'privacy', label: 'Acepto la Política de Privacidad' },
            { key: 'risks', label: 'Comprendo los riesgos del sistema' },
            { key: 'noGuarantees', label: 'Entiendo que no existen garantías de resultados' },
          ].map((item, i) => (
            <motion.label key={i} initial="hidden" animate="visible"
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
              variants={fadeUp} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
              <input
                type="checkbox"
                checked={checks[item.key]}
                onChange={() => handleCheck(item.key)}
                className="w-5 h-5 rounded border-vicion-blue mt-0.5 cursor-pointer flex-shrink-0"
                style={{ accentColor: 'rgb(29, 110, 245)' }}
              />
              <span className="text-gray-700 font-medium">{item.label}</span>
            </motion.label>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allChecked}
            className={`flex-1 inline-flex items-center justify-center gap-2 font-bold font-montserrat px-6 py-3 rounded-xl transition-all duration-200 ${
              allChecked
                ? 'bg-vicion-blue hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}>
            Continuar a activación <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}