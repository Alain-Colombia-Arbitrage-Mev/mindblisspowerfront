import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// VALIDATED: Real human interaction images ONLY
// Each image shows people collaborating, working together, or in professional interaction
const sectionImages = [
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=320&fit=crop', // Team collaboration
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&h=320&fit=crop', // Business discussion
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=320&fit=crop', // Team working together
];

const accesoFAQs = [
  { id: 1, q: '¿Qué es Vicion Power?', a: 'Vicion Power es una plataforma global de participación estructurada que te abre las puertas a un ecosistema de beneficios progresivos. No es un producto de "compra y olvida"—es un sistema diseñado para que construyas valor en el tiempo, accediendo a beneficios según tu nivel de participación, tu permanencia en la plataforma y tu actividad continua. Es para personas que buscan estructura, no resultados inmediatos.' },
  { id: 2, q: '¿Qué estoy activando exactamente?', a: 'Al activar tu participación, no estás comprando un producto tradicional. Estás abriendo acceso a un nivel dentro de un ecosistema organizado. Con eso viene: acceso a herramientas de crecimiento, opciones para desarrollar estructura, visualización de tu progreso en tiempo real, y elegibilidad para múltiples beneficios que se desbloquean progresivamente. Es un ticket de entrada a una red de oportunidades.' },
  { id: 3, q: '¿Es esto una inversión?', a: 'No en el sentido tradicional. Es una participación. Activas tu membresía para acceder a beneficios dentro de una estructura organizada. La diferencia clave es que no hay promesas de retorno automático—hay acceso a un sistema donde el valor se construye con el tiempo, tu participación activa, y tu permanencia.' },
  { id: 4, q: '¿Cómo se generan los beneficios?', a: 'Los beneficios emergen de múltiples fuentes dentro del ecosistema: el funcionamiento interno de la plataforma, la participación de otros miembros, tu actividad personal, tu permanencia en el sistema, y la estructura que construyas si decides crecer. Cada nivel de participación tiene beneficios específicos que se activan automáticamente cuando cumples las condiciones.' },
  { id: 5, q: '¿Cuándo empiezo a recibir beneficios?', a: 'Desde el momento en que tu activación es aprobada, tienes acceso inmediato a los beneficios de tu nivel. Algunos son instantáneos (acceso a herramientas, panel de control). Otros se acumulan con el tiempo (bonificaciones de permanencia, ingresos periódicos). El sistema comienza a reconocer tu participación desde el primer día, pero recompensas mayores llegan con constancia.' },
  { id: 6, q: '¿Los beneficios son inmediatos o graduales?', a: 'Ambos. Tu activación te abre puertas inmediatas (panel completo, herramientas, acceso a la red si está activada). Pero los beneficios más sustanciales llegan con el tiempo: permanencia, consistencia, crecimiento de tu estructura. Es como un árbol—plantarlo es rápido, crecer es gradual pero seguro.' },
];

const redFAQs = [
  { id: 12, q: '¿Tengo que invitar personas para crecer?', a: 'No. Esa es una de las fortalezas del sistema. Puedes participar solo como miembro, disfrutar de beneficios, y nunca invitar a nadie. Sin embargo, si eliges construir estructura (invitar y entrenar), desbloqueas un camino adicional de crecimiento. Es opcional, no obligatorio. Ganas de cualquier forma, solo que diferente.' },
  { id: 13, q: '¿Qué pasa si decido crecer dentro del sistema?', a: 'Accedes a formación especializada que te prepara para construir estructura efectivamente. Desbloqueas herramientas para gestionar a tu red, visualizar su crecimiento, y recibir beneficios por tu liderazgo. Pero requiere compromiso real: entrenar bien, comunicar claramente, y asegurarte de que los demás entiendan el sistema antes de activarse.' },
  { id: 14, q: '¿Puedo acceder a funciones de red sin activar participación?', a: 'No. La red es una funcionalidad reservada para participantes activos. Debes tener tu membresía activa para ver tu árbol, invitar personas, y gestionar tu estructura. Es una capa adicional que solo se abre cuando participas formalmente en el ecosistema.' },
  { id: 36, q: '¿Qué es mi código de referido?', a: 'Es tu enlace personal único dentro del sistema. Cuando alguien entra a través de tu código, se conecta a tu estructura (árbol binario). Tu código es tu puerta para invitar, y es fundamental si decides crecer. Pero recuerda: el código sin educación no genera nada. Invitar sin formar es un error común.' },
  { id: 37, q: '¿Qué sucede cuando invito a alguien?', a: 'Esa persona se conecta a tu estructura una vez que completa su activación. Verás su nombre en tu red, su progreso, y comienzas a recibir beneficios derivados de su participación (según las reglas del sistema). Pero el éxito depende de que entiendan el sistema—es un liderazgo de educación, no de presión.' },
];

const beneficiosFAQs = [
  { id: 7, q: '¿Qué significa "ingreso de continuidad"?', a: 'Es el flujo periódico de beneficios que recibes por mantenerte activo en el sistema. No es un pago único—es recurrente. Mientras participas, contribuyes, y permaneces, el sistema reconoce tu lealtad con ingresos continuos. Este es el núcleo del modelo: construir continuidad, no ganancias puntuales.' },
  { id: 8, q: '¿Qué significa "beneficio de permanencia"?', a: 'Es la recompensa por no desaparecer. Cuanto más tiempo permaneces participando activamente, más accesos y privilegios acumulas. Es como un programa de lealtad—tu consistencia es lo que importa. Después de X tiempo, desbloqueas tiers superiores de beneficios.' },
  { id: 9, q: '¿Qué significa "ingresos de por vida"?', a: 'El sistema está arquitectado para permitirte acceso continuo a beneficios mientras mantengas tu participación activa y cumplas las condiciones. No es una garantía de dinero infinito—es una promesa de que, si el sistema existe y tú permaneces, seguirás accediendo. Es sostenibilidad, no magia.' },
  { id: 10, q: '¿Qué es "protección del valor"?', a: 'Significa que tu participación no pierde valor con el tiempo. No es una compra de "use y tire". Está diseñada para mantener y potencialmente aumentar el reconocimiento de tu participación. Tu valor dentro del sistema está protegido mientras sigas activo.' },
  { id: 11, q: '¿Cómo aplico los beneficios en la práctica?', a: 'Los beneficios son accesibles dentro del ecosistema: pueden ser bonificaciones mensuales, acceso a herramientas premium, participación en programas especiales, o privilegios dentro de la comunidad. Se pueden visualizar en tu dashboard y se aplican automáticamente según el sistema.' },
];

const seguridadFAQs = [
  { id: 17, q: '¿Qué pasa después de que activo mi participación?', a: 'Entras en un proceso de verificación diseñado para proteger tanto a ti como al ecosistema. Completas pasos de validación (confirmación de datos, verificación de identidad, prueba de comprensión del sistema). Esto no es un obstáculo—es una barrera contra fraude y malas interpretaciones. Después de la aprobación, tu acceso es total.' },
  { id: 18, q: '¿Por qué hay un proceso de aprobación?', a: 'Para mantener seguridad, coherencia y orden. Un sistema sin control es caótico. La verificación garantiza que cada participante entiende realmente qué está haciendo, evita cuentas falsas, protege la reputación del ecosistema, y asegura que no entren con expectativas equivocadas.' },
  { id: 19, q: '¿El pago se procesa inmediatamente?', a: 'Técnicamente sí, pero pasa por validación interna antes de habilitar acceso completo. El sistema detecta patrones sospechosos y requiere confirmación adicional en algunos casos. Es rápido (horas), pero no instantáneo. Es una capa más de seguridad.' },
  { id: 20, q: '¿Qué significa que mi activación esté "en revisión"?', a: 'Tu pago fue recibido, pero el sistema está validándolo (anti-fraude, verificación de datos, check de cumplimiento). No es problema—es automático. La mayoría de revisiones se resuelven en horas. Si tarda más, contáctanos.' },
];

const FAQItem = ({ item, isOpen, onToggle }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.4 }}
  >
    <motion.button
      onClick={onToggle}
      className="w-full text-left p-6 rounded-2xl border transition-all duration-200"
      style={{
        borderColor: isOpen ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.15)',
        background: isOpen ? 'rgba(13,31,60,0.7)' : 'rgba(13,31,60,0.35)',
        boxShadow: isOpen ? '0 8px 32px rgba(59,130,246,0.15)' : 'none',
      }}
      whileHover={{ boxShadow: '0 8px 24px rgba(59,130,246,0.1)' }}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 mt-1"
        >
          <ChevronDown size={20} className="text-vicion-blue" />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-base leading-relaxed">{item.q}</h3>
        </div>
      </div>
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-6 pt-4 pb-6 text-white/70 text-base leading-relaxed border-t border-white/5">
            {item.a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const ImageBlock = ({ imageUrl, categoryName, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.6, delay }}
    className="my-16 py-8"
  >
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.4 }}
      style={{
        width: '100%',
        height: 280,
        borderRadius: 20,
        backgroundImage: `url('${imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        border: '1px solid rgba(59,130,246,0.15)',
        boxShadow: '0 12px 48px rgba(59,130,246,0.08)',
        position: 'relative',
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </motion.div>
  </motion.div>
);

const CategorySection = ({ title, icon, faqs, imageUrl, isFirst }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="space-y-6"
  >
    {/* Category Header */}
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
        <h2 className="font-montserrat font-black text-3xl text-white">{title}</h2>
      </div>
      <div style={{
        width: 60,
        height: 3,
        background: 'linear-gradient(90deg, #3b82f6, transparent)',
        borderRadius: 2,
      }} />
    </div>

    {/* FAQ Items */}
    <div className="space-y-3">
      {faqs.map((item) => (
        <FAQItem
          key={item.id}
          item={item}
          isOpen={false}
          onToggle={() => {}}
        />
      ))}
    </div>

    {/* Image Block */}
    {imageUrl && <ImageBlock imageUrl={imageUrl} categoryName={title} delay={0.2} />}
  </motion.div>
);

export default function FAQ() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);

  const categories = [
    { icon: '🔑', title: 'Acceso y Membresía', faqs: accesoFAQs, image: sectionImages[0] },
    { icon: '🌱', title: 'Red y Crecimiento', faqs: redFAQs, image: sectionImages[1] },
    { icon: '⭐', title: 'Beneficios y Evolución', faqs: beneficiosFAQs, image: sectionImages[2] },
    { icon: '🛡️', title: 'Seguridad y Control', faqs: seguridadFAQs, image: sectionImages[0] },
  ];

  return (
    <div className="overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #0D1117 100%)' }}>
      {/* HERO SECTION */}
      <section className="pt-32 pb-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,1) 0%, transparent 55%), radial-gradient(circle at 80% 30%, rgba(29,110,245,1) 0%, transparent 55%)'
        }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-vicion-blue/15 border border-vicion-electric/30 rounded-full px-4 py-1.5 mb-8">
              <HelpCircle size={14} className="text-vicion-electric" />
              <span className="text-vicion-electric text-xs font-semibold font-montserrat tracking-widest uppercase">Preguntas Frecuentes</span>
            </div>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl mb-6 leading-tight">
              Transparencia total
            </h1>
            <p className="text-white/65 text-lg leading-relaxed max-w-3xl">
              Todo lo que necesitas saber sobre cómo funciona Vicion Power, cómo acceder, y cómo construir dentro del sistema.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTIONS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-24">
          {categories.map((category, idx) => (
            <div key={idx}>
              <CategorySection
                title={category.title}
                icon={category.icon}
                faqs={category.faqs}
                imageUrl={category.image}
                isFirst={idx === 0}
              />
              {/* Open accordion on toggle */}
              <div className="space-y-3">
                {category.faqs.map((item) => (
                  <FAQItem
                    key={item.id}
                    item={item}
                    isOpen={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-white mb-6">
              ¿Listo para comenzar?
            </h2>
            <p className="text-white/60 text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
              Has visto las respuestas. Entiendes el sistema. Ahora es momento de acceder a la plataforma.
            </p>
            <motion.button
              onClick={() => navigate('/onboarding/start')}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 48px rgba(59,130,246,0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-bold"
              style={{
                background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                boxShadow: '0 8px 32px rgba(59,130,246,0.2)',
              }}
            >
              Acceder a la plataforma
              <ArrowRight size={20} />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}