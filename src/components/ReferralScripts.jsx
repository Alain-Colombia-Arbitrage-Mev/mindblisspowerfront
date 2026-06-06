import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, MessageCircle, Users, Target } from 'lucide-react';

const SCRIPTS = [
  {
    id: 'intro',
    icon: MessageCircle,
    title: 'Script de introducción',
    scenario: 'Cuando quieras mencionar Vicion por primera vez',
    text: '"Encontré algo interesante que estoy explorando. Es una plataforma donde puedo acceder a herramientas, comunidad y estructura para crecer. No es una inversión, es participación. ¿Te gustaría conocer más?"',
    emotional: 'Curiosidad natural',
  },
  {
    id: 'value',
    icon: Target,
    title: 'Script de valor',
    scenario: 'Cuando explicas qué lo hace diferente',
    text: '"Lo que me atrae es que aquí no hay promesas falsas. Ves exactamente cómo funciona, quién está detrás, y decides si encaja con tus objetivos. Además, hay gente de verdad construyendo cosas juntos."',
    emotional: 'Transparencia + comunidad',
  },
  {
    id: 'decision',
    icon: Users,
    title: 'Script de cierre',
    scenario: 'Cuando la persona está lista para decidir',
    text: '"No es un \"sí o no\" hoy. Es conocer cómo funciona. Si te interesa, te paso mi link personal y explores sin presión. Si luego quieres hablar, estoy aquí."',
    emotional: 'Libertad de elección',
  },
];

export default function ReferralScripts() {
  const [selectedId, setSelectedId] = useState('intro');
  const [copiedId, setCopiedId] = useState(null);

  const current = SCRIPTS.find(s => s.id === selectedId);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(current.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-2xl"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
    >
      <p style={{ color: '#a78bfa', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
        SCRIPTS DE CONVERSACIÓN
      </p>

      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 20, margin: '0 0 20px 0' }}>
        Palabras que funcionan. Úsalas como base y adapta a tu estilo.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {SCRIPTS.map(script => (
          <motion.button
            key={script.id}
            onClick={() => setSelectedId(script.id)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all"
            style={{
              background: selectedId === script.id ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.08)',
              border: selectedId === script.id ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(167,139,250,0.2)',
              color: selectedId === script.id ? '#c084fc' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <script.icon size={14} />
            {script.title}
          </motion.button>
        ))}
      </div>

      {/* Script display */}
      <motion.div
        key={selectedId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Context */}
        <div className="p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 4, margin: '0 0 4px 0' }}>CONTEXTO</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{current.scenario}</p>
        </div>

        {/* Script text */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
          <p style={{
            color: 'white',
            fontSize: 15,
            lineHeight: 1.8,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{current.text}"
          </p>
        </div>

        {/* Emotional hook */}
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(236,74,137,0.08)', border: '1px solid rgba(236,74,137,0.2)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', flexShrink: 0 }} />
          <p style={{ color: '#ec4899', fontSize: 12, fontWeight: 600, margin: 0 }}>
            Emoción: {current.emotional}
          </p>
        </div>

        {/* Copy button */}
        <motion.button
          onClick={() => handleCopy(current.text)}
          whileHover={{ scale: 1.02 }}
          className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          style={{
            background: copiedId === current.id ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.15)',
            border: `1px solid ${copiedId === current.id ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.3)'}`,
            color: '#c084fc',
            fontSize: 14,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(167,139,250,0.25)';
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(167,139,250,0.15)';
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)';
          }}
        >
          <Copy size={16} />
          {copiedId === current.id ? 'Copiado al portapapeles' : 'Copiar script'}
        </motion.button>
      </motion.div>

      {/* Remember */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          🎯 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Recuerda:</strong> Estos scripts son marcos. Tu autenticidad es lo que convence.
        </p>
      </div>
    </motion.div>
  );
}