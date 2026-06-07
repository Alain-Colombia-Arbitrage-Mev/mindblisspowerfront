import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Eye, Shield, Users, TrendingUp, Layers, Globe, Award, ArrowRight, CheckCircle } from 'lucide-react';

const SectionCTA = () => (
  <section className="py-24 bg-gradient-to-r from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">Conoces quiénes somos. Únete a nosotros.</motion.h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/participar" className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">Acceder a Vicion Care Plan <ArrowRight size={18} /></Link>
        <Link to="/care-plan" className="inline-flex items-center justify-center gap-2 border-2 border-vicion-blue/40 text-vicion-blue hover:bg-vicion-blue/10 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">Explorar beneficios <ArrowRight size={18} /></Link>
      </motion.div>
    </div>
  </section>
);

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const OFFICE_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80';
const MEETING_IMG = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80';
const TEAM_IMG = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80';

const values = [
  { icon: Eye,        label: 'Claridad',        desc: 'Comunicación directa, sin ambigüedades.' },
  { icon: Shield,     label: 'Permanencia',      desc: 'Construido para durar en el tiempo.' },
  { icon: Layers,     label: 'Estructura',       desc: 'Orden como base de todo lo que hacemos.' },
  { icon: Users,      label: 'Comunidad',        desc: 'Las personas en el centro de la propuesta.' },
  { icon: TrendingUp, label: 'Crecimiento',      desc: 'Desarrollo continuo para miembros y plataforma.' },
  { icon: CheckCircle,label: 'Responsabilidad',  desc: 'Actuamos con transparencia y compromiso.' },
  { icon: Globe,      label: 'Visión',           desc: 'Una mirada internacional y de largo plazo.' },
];

export default function AboutUs() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-0 bg-vicion-deep text-white relative overflow-hidden min-h-[72vh] flex items-end">
        <div className="absolute inset-0">
          <img src={OFFICE_IMG} alt="Mindbliss Power" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-vicion-deep via-vicion-deep/85 to-vicion-deep/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-vicion-deep via-transparent to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-20 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">La Empresa</p>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              Somos{' '}
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Mindbliss Power
              </span>
            </h1>
            <p className="text-white/65 text-xl leading-relaxed max-w-2xl">
              Una plataforma con visión internacional, enfoque estructurado y compromiso con la construcción de comunidad, acceso y crecimiento.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-0 mt-16 border-t border-white/10">
            {[['2019', 'Fundada'], ['35+', 'Países'], ['50K+', 'Miembros'], ['5', 'Sectores']].map(([num, label], i) => (
              <div key={label} className={`py-6 text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <div className="font-montserrat font-black text-3xl text-white mb-1">{num}</div>
                <div className="text-white/40 text-xs uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ SECCIÓN 1 — QUIÉNES SOMOS ════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-4">Quiénes Somos</p>
              <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6 leading-tight">
                Una visión que une estructura, comunidad y proyección
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Mindbliss Power surge con el propósito de crear una plataforma más clara, más sólida y más escalable para personas que buscan avanzar dentro de una experiencia organizada. Nuestra propuesta integra tecnología, participación, beneficios y desarrollo humano en una sola dirección.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden h-48"><img src={MEETING_IMG} alt="Reunión" className="w-full h-full object-cover" /></div>
                <div className="rounded-2xl overflow-hidden h-48"><img src={TEAM_IMG} alt="Equipo" className="w-full h-full object-cover" /></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 2 — CÓMO FUNCIONA ═════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">El Ecosistema</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Cómo funciona Mindbliss Power</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Acceso Estructurado', desc: 'Ingresa a través de Vicion Care Plan con planes diseñados para diferentes necesidades y capacidades.' },
              { num: '2', title: 'Crecimiento en Comunidad', desc: 'Participa en una red binaria que recompensa desarrollo personal, liderazgo y construcción de equipo.' },
              { num: '3', title: 'Beneficios y Ciclos', desc: 'Accede a incentivos, bonificaciones y ciclos de rentabilidad mientras contribuyes al ecosistema.' }
            ].map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-gray-100 hover:border-vicion-blue/30 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
                  <span className="text-white font-montserrat font-black text-xl">{step.num}</span>
                </div>
                <h3 className="font-montserrat font-bold text-xl text-vicion-deep mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 3 — LÓGICA DE INVERSIÓN ═══════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-4">Modelo Económico</p>
              <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6 leading-tight">Inversión con visión de largo plazo</h2>
              <div className="space-y-4">
                {[
                  'Planes de participación con rentabilidad estructurada',
                  'Sistema de ciclos que genera beneficios continuos',
                  'Incentivos por desarrollo de equipo (comisiones binarias)',
                  'Acceso a herramientas y capacitación para potenciar resultados',
                  'Transparencia total en todas las operaciones'
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                    <CheckCircle className="text-vicion-blue flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-600">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
              className="relative">
              <div className="rounded-2xl overflow-hidden h-96 bg-gradient-to-br from-vicion-blue/10 to-blue-500/10 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="text-vicion-blue mx-auto mb-4" size={48} />
                  <p className="text-vicion-deep font-montserrat font-bold text-lg">Crecimiento Sostenible</p>
                  <p className="text-gray-500 text-sm mt-2">Diseñado para expansión continua</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 4 — MODELO COLECTIVO ══════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">La Comunidad</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Desarrollo colectivo</h2>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Red Estructurada', desc: 'Comunidad binaria que conecta personas en un modelo de crecimiento mutuo.' },
              { icon: Layers, title: 'Jerarquía Clara', desc: 'Niveles definidos de liderazgo y reconocimiento para motivar desarrollo.' },
              { icon: Globe, title: 'Expansión Global', desc: 'Presencia en 35+ países con soporte local y visión internacional.' }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-vicion-blue/20 transition-all duration-300">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <Icon className="text-vicion-blue" size={28} />
                  </div>
                  <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 5 — VICION CARE PLAN ══════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-4">Tu Membresía</p>
              <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6 leading-tight">Vicion Care Plan</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Es el punto de entrada al ecosistema. Un plan integral que te proporciona estructura, beneficios inmediatos y acceso a todas las herramientas para crecer dentro de Mindbliss Power.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Acceso a herramientas y plataforma',
                  'Capacitación y soporte continuo',
                  'Sistemas de incentivos y bonificaciones',
                  'Red de profesionales y líderes',
                  'Proyección de crecimiento estructurado'
                ].map((benefit, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                    <Award className="text-vicion-blue flex-shrink-0" size={18} />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              <Link to="/care-plan" className="inline-flex items-center gap-2 text-vicion-blue hover:text-blue-600 font-semibold transition-colors">
                Explorar Vicion Care Plan <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
              className="rounded-2xl overflow-hidden h-96 bg-gradient-to-br from-vicion-blue to-blue-600 flex items-center justify-center text-white text-center p-8">
              <div>
                <Award size={64} className="mx-auto mb-4" />
                <h3 className="font-montserrat font-bold text-2xl mb-2">Tu Membresía</h3>
                <p className="text-white/80 text-sm">Acceso completo al ecosistema Mindbliss Power</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 3 & 4 — MISIÓN Y VISIÓN ══════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Misión */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
              className="bg-vicion-deep text-white p-10 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-20 translate-x-20"
                style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                  <Target className="text-vicion-electric" size={24} />
                </div>
                <span className="font-montserrat font-bold text-vicion-electric text-xs tracking-[0.2em] uppercase">Nuestra Misión</span>
              </div>
              <h2 className="font-montserrat font-black text-3xl mb-5 leading-tight">Misión</h2>
              <p className="text-white/60 leading-relaxed text-base">
                Crear un ecosistema que permita a las personas acceder a estructura, beneficios, herramientas y oportunidades de crecimiento dentro de una plataforma diseñada para la continuidad y la expansión.
              </p>
            </motion.div>

            {/* Visión */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
              className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 translate-y-20 -translate-x-10"
                style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <Eye className="text-vicion-blue" size={24} />
                </div>
                <span className="font-montserrat font-bold text-vicion-blue text-xs tracking-[0.2em] uppercase">Nuestra Visión</span>
              </div>
              <h2 className="font-montserrat font-black text-3xl text-vicion-deep mb-5 leading-tight">Visión</h2>
              <p className="text-gray-500 leading-relaxed text-base">
                Consolidar una comunidad internacional fuerte, moderna y organizada, capaz de conectar personas, liderazgo y ecosistema dentro de una propuesta global de alto valor.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 4 — VALORES ═══════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Nuestra Base</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Nuestros valores</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {values.map((v, i) => (
              <motion.div key={v.label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="text-center p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-vicion-electric/20 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-vicion-blue/10 transition-colors"
                  style={{ background: 'rgba(59,130,246,0.07)' }}>
                  <v.icon className="text-vicion-blue" size={20} />
                </div>
                <h3 className="font-montserrat font-bold text-vicion-deep text-sm mb-1">{v.label}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 5 — CIERRE ════════════════════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(59,130,246,1) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
          backgroundSize: '72px 72px'
        }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Filosofía</p>
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Construimos con{' '}
            <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              dirección
            </span>
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
           En Mindbliss Power creemos que el crecimiento real no se improvisa. Se diseña, se ordena y se sostiene con visión.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-3 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-base shadow-xl shadow-blue-600/30">
              Unirme al Sistema <ArrowRight size={20} />
            </Link>
            <Link to="/care-plan"
              className="inline-flex items-center justify-center gap-3 border-2 border-white/30 text-white hover:bg-white/10 font-semibold font-montserrat px-10 py-4 rounded-xl transition-all duration-200">
              Explorar Care Plan <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}