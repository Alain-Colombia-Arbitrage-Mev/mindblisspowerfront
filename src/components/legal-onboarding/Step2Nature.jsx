import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Step2Nature({ onNext, onBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="max-w-2xl w-full">
        
        <h1 className="font-montserrat font-black text-5xl text-vicion-deep mb-6">
          Cómo funciona Mindbliss Power
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-8">
          Mindbliss Power es un ecosistema que integra tecnología, proyectos y estructuras de desarrollo.
        </p>

        <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-md">
          Tu acceso se basa en una plataforma de participación estructurada orientada al desarrollo de proyectos, acceso a herramientas y construcción de valor en el tiempo.
        </p>

        <div className="space-y-3 mb-12">
          {[
            'Acceso a herramientas del ecosistema',
            'Participación dentro de una estructura organizada',
            'Desarrollo progresivo en el tiempo'
          ].map((item, i) => (
            <motion.div key={i} initial="hidden" animate="visible"
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
              variants={fadeUp} className="flex items-center gap-3 text-gray-700">
              <CheckCircle size={20} className="text-vicion-blue flex-shrink-0" />
              <span className="text-sm font-medium">{item}</span>
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
            Entiendo y continuar <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}