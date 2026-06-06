import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Step4Compliance({ onNext, onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="max-w-2xl w-full">
        
        <h1 className="font-montserrat font-black text-5xl text-vicion-deep mb-6">
          Transparencia y cumplimiento
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-12">
          Vicion Power implementa procesos de validación, control y cumplimiento conforme a estándares internacionales, incluyendo políticas AML y KYC.
        </p>

        <div className="space-y-4 mb-12">
          {[
            'Verificación de identidad',
            'Monitoreo de actividad',
            'Cumplimiento internacional'
          ].map((item, i) => (
            <motion.div key={i} initial="hidden" animate="visible"
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
              variants={fadeUp} className="flex items-center gap-4 p-4 rounded-xl bg-green-50/50 border border-green-100">
              <Lock size={24} className="text-green-600 flex-shrink-0" />
              <span className="text-gray-700 font-semibold">{item}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Atrás
          </button>
          <button
            onClick={onNext}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
            Aceptar y continuar <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}