import { motion } from 'framer-motion';
import { CheckCircle, Layers, Zap, Shield } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const reasons = [
  { icon: CheckCircle, label: 'Claridad en el proceso', desc: 'Cada paso está definido y es comprensible.' },
  { icon: Layers, label: 'Acceso progresivo', desc: 'Los beneficios crecen con tu participación.' },
  { icon: Shield, label: 'Estructura real', desc: 'Basado en operaciones y proyectos concretos.' },
  { icon: Zap, label: 'Sin promesas irreales', desc: 'Solo lo que puede sostenerse en el tiempo.' },
];

export default function TrustReasoning() {
  return (
    <section className="py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          variants={fadeUp}
          className="text-center mb-20"
        >
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">
            Por qué cada vez más personas avanzan aquí
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              variants={fadeUp}
              className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-vicion-blue/30 hover:shadow-lg transition-all duration-300"
            >
              <reason.icon size={36} className="text-vicion-blue mb-5" />
              <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-3">
                {reason.label}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {reason.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}