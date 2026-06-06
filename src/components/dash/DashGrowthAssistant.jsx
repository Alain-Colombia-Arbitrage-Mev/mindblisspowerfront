import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const SYSTEM_PROMPT = `You are an AI assistant for Vicion Power leaders. Your role is to help leaders communicate effectively and authentically.

CORE PRINCIPLES:
1. Never promise guarantees or specific financial returns
2. Emphasize legitimate leadership and personal development
3. Use honest, transparent language
4. Discourage pressure tactics or misleading claims
5. Focus on structural participation and system benefits
6. Respect individual choice and decision pace

When helping with responses, explanations, or guidance:
- Frame Vicion Power as a structured participation system
- Highlight that growth depends on activity and leadership
- Acknowledge that results vary and require real work
- Use language that's authentic and conversational
- Avoid MLM terminology or pyramid scheme language
- Always position the system's integrity first

TOPICS YOU HELP WITH:
- How to explain Vicion Power correctly
- What to say when someone has doubts
- How to respond to common objections
- How to guide someone to a decision (without pressure)
- Communication strategies for leaders
- Addressing compliance concerns

Always respond in Spanish unless asked otherwise.`;

export default function DashGrowthAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: '¡Hola! Soy tu asistente de crecimiento. Aquí puedo ayudarte a responder dudas, explicar el sistema y guiar conversaciones de forma correcta.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: input,
        model: 'gemini_3_flash',
      });

      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        text: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        text: 'Hubo un error al procesar tu pregunta. Intenta de nuevo.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Alguien me pregunta si Vicion garantiza dinero. ¿Qué digo?',
    '¿Cómo explico el sistema de forma simple?',
    'Me objetan que parece una pirámide. ¿Cómo respondo?',
    '¿Qué decir si alguien quiere involucrarse lentamente?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle size={24} style={{ color: '#c084fc' }} />
          <p style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            IA ASISTENTE
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Asistente de crecimiento
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Pregunta cómo responder a alguien, explicar el sistema o manejar dudas. Te guío con lenguaje correcto y sin promesas falsas.
        </p>
      </motion.div>

      {/* Chat Container */}
      <div className="p-6 rounded-2xl flex flex-col h-[600px]"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(168,85,247,0.15)' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #a855f7, #8b5cf6)' }}>
                    <MessageCircle size={16} style={{ color: 'white' }} />
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-700 text-slate-100 rounded-bl-none'
                  } ${msg.isError ? 'bg-red-900' : ''}`}
                >
                  {msg.isError && (
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    </div>
                  )}
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}>
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>TÚ</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #a855f7, #8b5cf6)' }}>
                <Loader size={16} style={{ color: 'white' }} className="animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-none"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7', animation: 'bounce 1.4s infinite' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7', animation: 'bounce 1.4s infinite 0.2s' }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#a855f7', animation: 'bounce 1.4s infinite 0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (show if no user messages) */}
        {messages.filter(m => m.role === 'user').length === 0 && !loading && (
          <div className="mb-6 space-y-2">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px 0' }}>
              PREGUNTAS SUGERIDAS
            </p>
            {suggestedQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => {
                    document.querySelector('button[type="submit"]')?.click();
                  }, 0);
                }}
                className="w-full text-left px-3 py-2 rounded-lg transition-all text-sm"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                }}>
                {q}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta cómo responder, explicar o comunicar..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(168,85,247,0.2)',
              color: 'white',
              fontSize: 13,
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 flex-shrink-0"
            style={{
              background: loading || !input.trim() ? 'rgba(168,85,247,0.15)' : 'linear-gradient(135deg, #a855f7, #8b5cf6)',
              color: 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.6 : 1,
            }}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Tips Block */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
          CÓMO USAR MEJOR
        </p>
        <div className="space-y-3">
          {[
            'Sé específico: Di exactamente qué pregunta te hizo alguien o cuál es la situación.',
            'Proporciona contexto: "La persona me preguntó si puedo garantizar dinero" es mejor que "¿Cómo respondo?"',
            'Guarda respuestas: Copia las que te funcionen y úsalas después.',
            'Adapta: Estos son puntos de partida. Hazlos tuyo.',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#10b981' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{tip}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}