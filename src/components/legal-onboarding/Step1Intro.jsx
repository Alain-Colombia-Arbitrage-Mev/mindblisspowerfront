import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Step1Intro({ onNext }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="max-w-2xl w-full">
        
        <div className="rounded-3xl overflow-hidden h-64 mb-12 bg-gradient-to-br from-vicion-blue/20 to-blue-500/10">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
            alt="Confianza y estructura"
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.2 }}
          variants={fadeUp}>
          <h1 className="font-montserrat font-black text-5xl text-vicion-deep mb-6">
            Antes de comenzar
          </h1>

          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Estás a punto de acceder a un sistema estructurado de participación dentro del ecosistema Vicion Power.
          </p>

          <p className="text-lg text-gray-700 leading-relaxed mb-12">
            Para continuar, es importante que comprendas cómo funciona y bajo qué condiciones operamos.
          </p>

          <button
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
            Continuar <ArrowRight size={20} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}