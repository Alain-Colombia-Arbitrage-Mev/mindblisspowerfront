import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('aiAssistant', {
        question: userMessage
      });

      const result = response.data;

      if (result.status === 'approved') {
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: result.response,
          action: result.suggested_action,
          validation: result.validation,
          status: 'approved'
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'assistant',
          text: 'No puedo responder esta pregunta. Razones:',
          reasons: result.rejection_reason,
          status: 'rejected'
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: 'Error al procesar tu pregunta. Intenta de nuevo.',
        status: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
      {/* Header */}
      <div className="mb-6 pb-4" style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 6px 0' }}>
          Asistente IA Vicion
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          Pregunta sobre qué hacer, cómo avanzar o cómo explicar
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'assistant' ? (
                <div className="max-w-[85%] p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {msg.status === 'approved' ? (
                      <>
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>Respuesta validada</span>
                      </>
                    ) : msg.status === 'rejected' ? (
                      <>
                        <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                        <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>No validada</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} style={{ color: '#ef4444' }} />
                        <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}>Error</span>
                      </>
                    )}
                  </div>

                  {/* Response Text */}
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6, margin: 0, marginBottom: msg.reasons || msg.validation ? 12 : 0 }}>
                    {msg.text}
                  </p>

                  {/* Rejection Reasons */}
                  {msg.reasons && (
                    <div className="mt-3 space-y-2">
                      {msg.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          <span style={{ color: '#ef4444', fontSize: 12 }}>•</span>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Validation Badges */}
                  {msg.validation && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <div className="px-2 py-1 rounded text-xs" style={{ background: msg.validation.correcto ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: msg.validation.correcto ? '#10b981' : '#ef4444' }}>
                        {msg.validation.correcto ? '✓' : '✗'} Correcto
                      </div>
                      <div className="px-2 py-1 rounded text-xs" style={{ background: msg.validation.alineado ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: msg.validation.alineado ? '#10b981' : '#ef4444' }}>
                        {msg.validation.alineado ? '✓' : '✗'} Alineado
                      </div>
                      <div className="px-2 py-1 rounded text-xs" style={{ background: msg.validation.legal ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: msg.validation.legal ? '#10b981' : '#ef4444' }}>
                        {msg.validation.legal ? '✓' : '✗'} Legal
                      </div>
                    </div>
                  )}

                  {/* Suggested Action */}
                  {msg.action && (
                    <div className="mt-3 p-2 rounded" style={{ background: 'rgba(59,130,246,0.15)', borderLeft: '3px solid rgba(59,130,246,0.4)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, margin: '0 0 4px 0' }}>Próximo paso:</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>{msg.action}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[85%] p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p style={{ color: 'white', fontSize: 13, margin: 0 }}>{msg.text}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-lg flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.08)' }}>
              <Loader2 size={16} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Analizando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="¿Qué necesitas saber?"
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
            color: 'white',
            fontSize: 13
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}