import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Cpu, Building2, Users, Globe, ArrowRight, CheckCircle, Layers } from 'lucide-react';

const SectionCTA = () => (
  <section className="py-24 bg-gradient-to-r from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">Conoces el ecosistema. Es hora de participar.</motion.h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/participar" className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">Acceder a Vicion Care Plan <ArrowRight size={18} /></Link>
        <Link to="/planes" className="inline-flex items-center justify-center gap-2 border-2 border-vicion-blue/40 text-vicion-blue hover:bg-vicion-blue/10 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">Explorar beneficios <ArrowRight size={18} /></Link>
      </motion.div>
    </div>
  </section>
);

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const WELLNESS_IMG = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80';
const PRODUCTS_IMG = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80';
const TECH_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';
const REAL_ESTATE_IMG = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80';
const COMMUNITY_IMG = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80';

const sectors = [
  {
    icon: Heart,
    title: 'Bienestar',
    desc: 'Desarrollo de propuestas orientadas a salud, equilibrio y estilo de vida.',
    img: WELLNESS_IMG,
    accent: '#f472b6',
    highlights: ['Salud integral', 'Estilo de vida', 'Equilibrio personal'],
  },
  {
    icon: ShoppingBag,
    title: 'Productos',
    desc: 'Acceso a marcas, soluciones y líneas propias o asociadas dentro del ecosistema.',
    img: PRODUCTS_IMG,
    accent: '#f59e0b',
    highlights: ['Marcas propias', 'Líneas asociadas', 'Valor de producto real'],
  },
  {
    icon: Cpu,
    title: 'Tecnología',
    desc: 'Herramientas, plataformas y desarrollos digitales que impulsan la experiencia del miembro.',
    img: TECH_IMG,
    accent: '#818cf8',
    highlights: ['Plataformas digitales', 'Herramientas del miembro', 'Innovación continua'],
  },
  {
    icon: Building2,
    title: 'Inmobiliario',
    desc: 'Conexión con oportunidades y desarrollos vinculados al ecosistema.',
    img: REAL_ESTATE_IMG,
    accent: '#3b82f6',
    highlights: ['Oportunidades de acceso', 'Desarrollos vinculados', 'Proyección a largo plazo'],
  },
  {
    icon: Users,
    title: 'Comunidad',
    desc: 'Una estructura humana, activa y preparada para crecer a nivel internacional.',
    img: COMMUNITY_IMG,
    accent: '#34d399',
    highlights: ['Red activa global', 'Crecimiento estructurado', 'Alcance internacional'],
  },
];

export default function Ecosystem() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-20 bg-vicion-deep text-white relative overflow-hidden min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-vicion-deep" />
          <div className="absolute right-0 top-0 w-2/3 h-full opacity-20"
            style={{ backgroundImage: 'radial-gradient(ellipse at 80% 30%, rgba(59,130,246,0.5) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Estructura Global</p>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              Un ecosistema con{' '}
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                visión real
              </span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed max-w-3xl mx-auto mb-12">
              Mindbliss Power conecta diferentes áreas de desarrollo para construir una propuesta sólida, escalable y con valor tangible.
            </p>
            {/* Sector pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {sectors.map(s => (
                <div key={s.title} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-white/70 font-medium">
                  <s.icon size={13} style={{ color: s.accent }} />
                  {s.title}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ SECCIÓN 1 — INTRODUCCIÓN ══════════════════════════════════ */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-4 bg-vicion-deep/5 border border-vicion-blue/15 rounded-2xl px-10 py-6 max-w-3xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Layers className="text-vicion-blue" size={24} />
              </div>
              <div>
                <div className="font-montserrat font-black text-vicion-deep text-xl mb-1">La fuerza está en la integración</div>
                <div className="text-gray-500 text-sm leading-relaxed">
                  Mindbliss Power no se limita a una sola categoría. Su visión integra distintas áreas que fortalecen la experiencia del miembro y amplían el valor del ecosistema, generando una propuesta con mayor profundidad, proyección y respaldo.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 2 — ÁREAS DEL ECOSISTEMA ════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8">
            {sectors.map((sector, i) => (
              <motion.div key={sector.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 grid grid-cols-1 lg:grid-cols-2`}>

                {/* Image */}
                <div className={`relative h-64 lg:h-auto min-h-[260px] ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <img src={sector.img} alt={sector.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0"
                    style={{ background: `linear-gradient(${i % 2 === 0 ? '90deg' : '270deg'}, rgba(5,12,26,0.1), rgba(5,12,26,0.65))` }} />
                  <div className="absolute top-6 left-6 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${sector.accent}22`, border: `1px solid ${sector.accent}50`, backdropFilter: 'blur(8px)' }}>
                    <sector.icon size={22} style={{ color: sector.accent }} />
                  </div>
                </div>

                {/* Content */}
                <div className={`p-10 lg:p-14 flex flex-col justify-center bg-white ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${sector.accent}15` }}>
                      <sector.icon size={20} style={{ color: sector.accent }} />
                    </div>
                    <h2 className="font-montserrat font-black text-2xl text-vicion-deep">{sector.title}</h2>
                  </div>
                  <p className="text-gray-500 text-base leading-relaxed mb-6">{sector.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {sector.highlights.map(h => (
                      <span key={h} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ background: `${sector.accent}12`, color: sector.accent }}>
                        <CheckCircle size={11} /> {h}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 3 — MENSAJE INSTITUCIONAL + CTA ══════════════════ */}
      <section className="py-24 bg-vicion-deep text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(59,130,246,1) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
          backgroundSize: '72px 72px'
        }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Visión de Largo Plazo</p>
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Una plataforma con{' '}
            <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              visión de expansión
            </span>
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Cada área del ecosistema fortalece la propuesta general de Mindbliss Power. El resultado es una plataforma con mayor capacidad de evolución, mayor percepción de respaldo y una experiencia más rica para quienes participan en ella.
          </p>
          <Link to="/participar"
            className="inline-flex items-center gap-3 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-base shadow-xl shadow-blue-600/30">
            Unirme a Vicion Care Plan <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}