import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import MicroSocialSignal from './MicroSocialSignal';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const indicators = [
  { label: 'Usuarios activos en crecimiento', value: '+2,400' },
  { label: 'Presencia internacional', value: '18 países' },
  { label: 'Ecosistema en expansión', value: 'En curso' },
];

export default function TrustIndicators() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h3 className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">
            Una estructura en crecimiento constante
          </h3>
          <div className="flex justify-center">
            <MicroSocialSignal />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {indicators.map((indicator, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              variants={fadeUp}
              className="p-8 rounded-2xl bg-gradient-to-br from-vicion-blue/5 to-blue-500/5 border border-vicion-blue/20 text-center hover:border-vicion-blue/40 transition-all duration-300"
            >
              <div className="flex justify-center mb-4">
                <CheckCircle size={32} className="text-vicion-blue" />
              </div>
              <p className="text-gray-600 text-base font-medium mb-3">
                {indicator.label}
              </p>
              <p className="font-montserrat font-bold text-2xl text-vicion-deep">
                {indicator.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}