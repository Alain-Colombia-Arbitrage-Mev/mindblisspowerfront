import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';

const cards = [
  {
    title: 'Esto no es para resultados inmediatos',
    text: 'Vicion Power no está diseñado para quienes buscan resultados rápidos. Es un sistema basado en continuidad, participación y evolución dentro del tiempo.',
    icon: '⏳',
  },
  {
    title: 'Aquí no estás comprando una promesa',
    text: 'Estás activando acceso a un sistema estructurado donde los beneficios dependen de tu nivel, tu permanencia y tu actividad.',
    icon: '🛡️',
  },
  {
    title: 'Puedes participar sin construir red',
    text: 'El sistema permite acceso a beneficios como miembro. El crecimiento en red es una opción adicional, no una obligación.',
    icon: '✓',
  },
  {
    title: 'El sistema funciona por etapas',
    text: 'No tendrás acceso completo desde el inicio. Cada función se desbloquea según tu avance y comprensión del sistema.',
    icon: '📊',
  },
  {
    title: 'La formación es parte del proceso',
    text: 'Si decides crecer, deberás completar formación para entender cómo funciona correctamente el sistema.',
    icon: '📚',
  },
  {
    title: 'La claridad evita errores',
    text: 'Preferimos que entiendas bien cómo funciona antes de entrar, a que entres con expectativas equivocadas.',
    icon: '💡',
  },
];

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function EntryFilter({ showCTA = true }) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200/40 rounded-full px-4 py-1.5 mb-6">
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-red-600 text-xs font-semibold tracking-widest uppercase">Información importante</span>
          </div>
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-4">
            Antes de comenzar, es importante que entiendas esto
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Queremos que tomes una decisión informada, clara y sin expectativas incorrectas.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {cards.map((card, i) => (
            <motion.div key={card.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 hover:border-vicion-blue/30 transition-all duration-300 group">
              <div className="text-4xl mb-5">{card.icon}</div>
              <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-3 leading-snug group-hover:text-vicion-blue transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Final Block */}
        {showCTA && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="p-10 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, #0a1628, #0d1f3c)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
              Si lo que buscas es construir algo con sentido dentro de un sistema estructurado, estás en el lugar correcto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/faq"
                className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold font-montserrat px-8 py-3.5 rounded-xl transition-all duration-200">
                Quiero entender cómo funciona <ArrowRight size={16} />
              </Link>
              <Link to="/simulation"
                className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-semibold font-montserrat px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
                Simular participación <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}