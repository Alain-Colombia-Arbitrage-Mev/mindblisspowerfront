import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function ConversionTrigger() {
  return (
    <section className="py-32 bg-gradient-to-b from-white to-gray-50 flex items-center justify-center min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Heading */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-vicion-deep mb-16 leading-tight">
          ¿Listo para comenzar?
        </motion.h2>

        {/* Main CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8">
          <Link 
            to="/onboarding"
            className="group inline-flex items-center justify-center gap-3 bg-vicion-blue hover:bg-blue-600 text-white font-black font-montserrat px-12 sm:px-16 py-6 sm:py-8 rounded-2xl transition-all duration-300 shadow-2xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-blue-600/60 hover:-translate-y-1 active:translate-y-0">
            <span className="text-xl sm:text-2xl">Comenzar mi participación</span>
            <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Support Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-600">
          <CheckCircle size={18} className="text-vicion-blue flex-shrink-0" />
          <p className="text-sm sm:text-base font-medium">
            Proceso guiado y seguro
          </p>
        </motion.div>

        {/* Additional Context */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Registración verificada • Onboarding paso a paso • Contrato digital seguro
        </motion.p>
      </div>
    </section>
  );
}