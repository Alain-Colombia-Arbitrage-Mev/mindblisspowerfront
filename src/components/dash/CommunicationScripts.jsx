import { useState } from 'react';
import { Copy, Check, MessageCircle, Phone, HelpCircle, Handshake } from 'lucide-react';
import { motion } from 'framer-motion';

const SCRIPTS = [
  {
    id: 'opening',
    title: 'Cómo iniciar conversación',
    icon: MessageCircle,
    color: '#3b82f6',
    description: 'Primeros 30 segundos — establece el contexto sin presionar',
    scripts: [
      {
        name: 'Por referencia común',
        text: 'Hola [Nombre], te escribo porque [amigo común] me habló muy bien de ti. Hace poco entré en algo interesante sobre estructura y crecimiento. Nada urgente, pero pensé que te podría interesar cuando tengas tiempo. ¿Te llama la atención?',
      },
      {
        name: 'Por conexión profesional',
        text: 'Hola [Nombre], vi que trabajas en [área]. Encontré una plataforma de participación estructurada que se alinea con lo que haces. Sin presión, pero me gustaría mostrarte cuando tengas 10 minutos. ¿Te interesa?',
      },
      {
        name: 'Acercamiento casual',
        text: 'Hey [Nombre], últimamente estoy en algo relacionado con estructura y desarrollo profesional. Pensé en ti. ¿Tienes 5 minutos para un café virtualmente?',
      },
    ],
  },
  {
    id: 'explain',
    title: 'Cómo explicar Vicion',
    icon: Phone,
    color: '#10b981',
    description: 'La explicación completa — clara, honesta, estructurada',
    scripts: [
      {
        name: 'Versión corta (5 min)',
        text: 'Mindbliss Power es una plataforma de membresía estructurada. Accedes a beneficios, herramientas y progresión dentro de una comunidad ordenada. No es inversión ni garantía de dinero. Es un sistema donde tu crecimiento depende de tu actividad y capacidad de liderazgo. Los beneficios y acceso se van expandiendo a medida que progresas.',
      },
      {
        name: 'Versión completa (15 min)',
        text: 'Mindbliss Power funciona así:\n\n1. QÚÉS ES: Una estructura de membresía con niveles (Member → Leader → Director). Cada nivel te da más herramientas, visibilidad y responsabilidad.\n\n2. CÓMO FUNCIONA: Participa, cumple requisitos de actividad y formación, construye tu red. Tu progresión es proporcional a tu compromiso y capacidad de guiar a otros.\n\n3. CÓMO CRECES: Desarrollando liderazgo. No se trata de invitar gente, sino de guiar correctamente. El sistema reconoce tu actividad, no promete resultados.\n\n4. PARA QUIÉN ES: Personas que buscan orden, desarrollo real y crecimiento estructurado. No es para quien busca ganar dinero rápido.',
      },
      {
        name: 'Diferenciador clave',
        text: 'La diferencia con otros sistemas: Aquí no se trata de cuánta gente invites. Se trata de a cuánta gente puedas guiar efectivamente. El sistema valida liderazgo, no volumen.',
      },
    ],
  },
  {
    id: 'doubts',
    title: 'Cómo responder dudas',
    icon: HelpCircle,
    color: '#fb923c',
    description: 'Preguntas frecuentes y respuestas honestas',
    scripts: [
      {
        name: '¿Cuánto gano?',
        text: 'No te puedo garantizar un número. Depende de qué tan activo seas, cómo guíes a tu equipo y la evolución del ecosistema. Hay personas que ganan bien, pero eso requiere trabajo real. No es pasivo ni garantizado.',
      },
      {
        name: '¿Es una pirámide?',
        text: 'No. Una pirámide promete dinero por invitar gente sin valor real. Aquí hay una estructura, beneficios reales, acceso a herramientas y formación. Además, el sistema se autorregula — si no aportas valor, tu crecimiento se detiene.',
      },
      {
        name: '¿Cuál es el costo?',
        text: 'Depende del nivel que elijas. Cada nivel tiene un costo diferente y desbloquea beneficios diferentes. No hay costos ocultos. Ves exactamente qué pagas y qué obtienes.',
      },
      {
        name: '¿Debo invitar gente?',
        text: 'Puedes invitar si quieres crecer más rápido. Pero es opcional. Algunos miembros solo participan sin armar red. La diferencia es que tu progresión será más lenta.',
      },
      {
        name: '¿Qué pasa si no actúo?',
        text: 'Tu acceso se mantiene, pero tu progresión se pausa. Los beneficios dependen de mantener actividad. Si desactivas tu cuenta, puedes recuperarla después.',
      },
    ],
  },
  {
    id: 'closing',
    title: 'Cómo cerrar',
    icon: Handshake,
    color: '#c084fc',
    description: 'El cierre — sin presión, solo claridad',
    scripts: [
      {
        name: 'Cierre consultivo',
        text: '¿Ves cómo encaja con lo que buscas? Si quieres explorar más, te dejo el acceso a la plataforma para que lo veas por ti mismo. Sin compromiso. ¿Te gustaría intentarlo?',
      },
      {
        name: 'Cierre de tiempo',
        text: 'Las plazas de participación son limitadas. Puedo asegurarte un espacio si decides esta semana. Si necesitas más tiempo para decidir, está bien, pero ten en cuenta que las cuotas se llenan. ¿Necesitas más info o estás listo?',
      },
      {
        name: 'Cierre suave',
        text: 'No hay presión. Si en algún momento te interesa volver a esto, aquí estoy. Por ahora, simplemente déjame saber si quieres más información o si tienes otras dudas.',
      },
      {
        name: 'Cierre por objeción',
        text: 'Entiendo tu dudas completamente. Déjame resolverlas [responde específicamente]. ¿Con eso aclarado, ves viable intentarlo?',
      },
    ],
  },
];

export default function CommunicationScripts() {
  const [active, setActive] = useState('opening');
  const [copied, setCopied] = useState(null);

  const current = SCRIPTS.find(s => s.id === active);
  const CurrentIcon = current.icon;

  const copyToClipboard = (text, scriptId) => {
    navigator.clipboard.writeText(text);
    setCopied(scriptId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            GUÍAS DE CONVERSACIÓN
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Scripts listos para copiar
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Conversaciones probadas y alineadas con la filosofía de Mindbliss Power. Copia, adapta a tu estilo y usa directamente.
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SCRIPTS.map(script => (
          <button
            key={script.id}
            onClick={() => setActive(script.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all"
            style={{
              background: active === script.id ? `${script.color}20` : 'rgba(255,255,255,0.03)',
              border: active === script.id ? `1px solid ${script.color}40` : '1px solid rgba(255,255,255,0.06)',
              color: active === script.id ? script.color : 'rgba(255,255,255,0.5)',
              fontSize: 13,
              fontWeight: active === script.id ? 600 : 400,
            }}>
            <script.icon size={16} />
            {script.title.split(' ')[script.title.split(' ').length - 1]}
          </button>
        ))}
      </div>

      {/* Content Section */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="p-8 rounded-2xl" style={{ background: `${current.color}08`, border: `1px solid ${current.color}25` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${current.color}20`, border: `1px solid ${current.color}40` }}>
              <CurrentIcon size={24} style={{ color: current.color }} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 20, margin: '0 0 4px 0' }}>
                {current.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                {current.description}
              </p>
            </div>
          </div>
        </div>

        {/* Scripts Grid */}
        <div className="space-y-4">
          {current.scripts.map((script, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h4 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {script.name}
                </h4>
                <button
                  onClick={() => copyToClipboard(script.text, `${active}-${i}`)}
                  className="flex-shrink-0 p-2 rounded-lg transition-all"
                  style={{
                    background: copied === `${active}-${i}` ? 'rgba(52,211,153,0.2)' : 'rgba(59,130,246,0.1)',
                    border: copied === `${active}-${i}` ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(59,130,246,0.2)',
                    color: copied === `${active}-${i}` ? '#34d399' : '#3b82f6',
                  }}>
                  {copied === `${active}-${i}` ? (
                    <Check size={18} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                lineHeight: 1.8,
                margin: 0,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: 12,
                borderRadius: 8,
              }}>
                {script.text}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tips Block */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(168,85,247,0.25)' }}>
        <p style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          CONSEJOS PARA USAR ESTOS SCRIPTS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Adapta a tu voz', desc: 'No repitas palabra por palabra. Estos scripts son referencias. Haz que suene natural en ti.' },
            { title: 'Sé honesto', desc: 'Si no sabes la respuesta a una pregunta, di "no sé, pero me informo". Nunca improvises.' },
            { title: 'Escucha más que hablas', desc: 'Estos scripts son puntos de partida. El diálogo real es escuchar sus dudas específicas.' },
            { title: 'Respeta el ritmo', desc: 'No presiones. Si la persona dice que no, respeta eso. El "no" de hoy puede ser "sí" después.' },
          ].map((tip, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tip.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{tip.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key Principle */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))', border: '2px solid rgba(16,185,129,0.25)' }}>
        <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
          LA REGLA DE ORO
        </p>
        <p style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 8px 0', lineHeight: 1.6 }}>
          "Comunica con honestidad. Vende con integridad."
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          Estos scripts funcionan porque son verdad. No prometen lo que no puedes dar. Eso es lo que hace que sean poderosos.
        </p>
      </motion.div>
    </div>
  );
}