import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const testimonials = [
  {
    name: 'María G.',
    country: 'Colombia',
    quote: 'Buscaba algo estable, no rápido. Esto me dio claridad.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  },
  {
    name: 'Carlos L.',
    country: 'México',
    quote: 'Por primera vez entiendo dónde estoy participando.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  },
  {
    name: 'Andrea R.',
    country: 'Perú',
    quote: 'No entré por dinero, entré por estructura.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6">
            Personas que ya decidieron avanzar
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            No se trata de promesas.<br />Se trata de decisiones reales dentro de un sistema estructurado.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((person, i) => (
            <motion.div
              key={person.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              variants={fadeUp}
              className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 hover:border-vicion-blue/20 hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="h-64 w-full overflow-hidden">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 text-base leading-relaxed mb-6 italic">
                  "{person.quote}"
                </p>

                <div className="border-t border-gray-200 pt-4">
                  <p className="font-montserrat font-bold text-vicion-deep">{person.name}</p>
                  <p className="text-sm text-gray-500">{person.country}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}