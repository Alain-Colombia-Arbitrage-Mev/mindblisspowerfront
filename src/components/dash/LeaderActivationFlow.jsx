import { useState, useEffect } from 'react';
import { Lock, CheckCircle, ArrowRight, BookOpen, MessageCircle, Play, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderActivationFlow({ onNavigate, onComplete }) {
  const [completedItems, setCompletedItems] = useState({
    guide: false,
    scripts: false,
    training: false,
  });
  const [showUnlock, setShowUnlock] = useState(false);

  const items = [
    {
      id: 'guide',
      icon: BookOpen,
      title: 'Guía de duplicación',
      desc: 'Entiende cómo guiar correctamente sin forzar',
      action: 'Completar guía',
      actionId: 'growth',
      color: '#3b82f6',
    },
    {
      id: 'scripts',
      icon: MessageCircle,
      title: 'Scripts de comunicación',
      desc: '4 categorías de conversaciones lista para usar',
      action: 'Ver scripts',
      actionId: 'scripts',
      color: '#10b981',
    },
    {
      id: 'training',
      icon: Play,
      title: 'Cápsulas de formación',
      desc: '9 videos cortos sobre hablar, presentar y guiar',
      action: 'Ver cápsulas',
      actionId: 'capsules',
      color: '#a855f7',
    },
  ];

  const allComplete = Object.values(completedItems).every(v => v);

  const handleMarkComplete = (itemId) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: true,
    }));
  };

  const handleNavigate = (moduleId) => {
    onNavigate(moduleId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Lock size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            ACTIVACIÓN DE LÍDER
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Completa tu formación
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Tu acceso a referidos está bloqueado temporalmente. Completa estos 3 pasos para desbloquear tu enlace personal y acceso a estructura.
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="px-6 py-4 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, margin: 0 }}>
            Progreso
          </p>
          <p style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700, margin: 0 }}>
            {Object.values(completedItems).filter(Boolean).length} de 3
          </p>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(Object.values(completedItems).filter(Boolean).length / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isComplete = completedItems[item.id];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl"
              style={{
                background: isComplete ? `${item.color}15` : 'rgba(13,31,60,0.6)',
                border: isComplete ? `1px solid ${item.color}40` : '1px solid rgba(59,130,246,0.15)',
              }}>

              <div className="flex items-start gap-4">
                {/* Icon/Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: item.color }}>
                      <CheckCircle size={20} style={{ color: 'white' }} />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: `${item.color}25`, border: `2px solid ${item.color}50` }}>
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 4, margin: '0 0 4px 0' }}>
                    {item.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 12px 0' }}>
                    {item.desc}
                  </p>

                  {isComplete ? (
                    <div className="flex items-center gap-2 text-sm"
                      style={{ color: item.color, fontWeight: 600 }}>
                      <CheckCircle size={14} />
                      Completado
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleNavigate(item.actionId)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
                        style={{
                          background: `${item.color}25`,
                          border: `1px solid ${item.color}40`,
                          color: item.color,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.target.style.background = `${item.color}35`}
                        onMouseLeave={e => e.target.style.background = `${item.color}25`}>
                        {item.action} <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="px-4 py-2 rounded-lg font-semibold transition-all text-sm"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                        Marcar hecho
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unlock Block */}
      <AnimatePresence>
        {allComplete && !showUnlock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.12))', border: '2px solid rgba(16,185,129,0.3)' }}>
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}>
                <CheckCircle size={48} style={{ color: '#10b981', marginLeft: 'auto', marginRight: 'auto' }} />
              </motion.div>
            </div>
            <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
              ¡Listo para crecer!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Completaste toda la formación. Ahora tienes acceso a tu enlace personal y puedes ver tu estructura completa.
            </p>
            <button
              onClick={() => setShowUnlock(true)}
              className="px-8 py-3 rounded-xl font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                fontSize: 14,
                fontFamily: 'Montserrat,sans-serif',
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
              Desbloquear acceso →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Screen */}
      <AnimatePresence>
        {showUnlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 p-8 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}>
            
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="mb-4">
                <Lock size={48} style={{ color: '#34d399', marginLeft: 'auto', marginRight: 'auto', transform: 'rotate(-45deg)' }} />
              </motion.div>
              <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, margin: '0 0 8px 0' }}>
                Acceso desbloqueado
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                Ahora tienes acceso completo a todas las funcionalidades de líder
              </p>
            </div>

            {/* Unlocked Features */}
            <div className="space-y-4">
              {[
                { icon: Link2, title: 'Tu enlace personal', desc: 'Comparte tu código único con tus prospectos' },
                { icon: BookOpen, title: 'Acceso a estructura', desc: 'Visualiza tu red completa y árbol binario' },
                { icon: MessageCircle, title: 'Herramientas de líder', desc: 'Scripts, formación y asistente IA disponibles' },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Icon size={20} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>
                        {feature.title}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Personal Link Code */}
            <div className="p-6 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                TU CÓDIGO PERSONAL
              </p>
              <div className="flex items-center gap-3 p-4 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <code style={{ color: '#10b981', fontWeight: 700, fontSize: 16, margin: 0, fontFamily: 'monospace' }}>
                  VP-20240412-A7K9
                </code>
                <button style={{
                  background: 'rgba(16,185,129,0.2)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}>
                  Copiar
                </button>
              </div>
            </div>

            {/* Final CTA */}
            <button
              onClick={() => {
                if (onComplete) onComplete();
                setShowUnlock(false);
              }}
              className="w-full px-6 py-3 rounded-xl font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                fontSize: 14,
                fontFamily: 'Montserrat,sans-serif',
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
              Continuar al dashboard →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Block */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-6 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(249,115,22,0.08))', border: '1px solid rgba(251,146,60,0.2)' }}>
        <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
          ¿POR QUÉ ESTE BLOQUEO?
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Creemos en <strong>calidad antes que crecimiento</strong>. Un líder bien formado no presiona, no promete falsamente y no confunde a los prospectos. Esta barrera asegura que todos nuestros líderes comuniquen correctamente desde el principio.
        </p>
      </motion.div>
    </div>
  );
}