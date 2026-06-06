import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

const AI_INSIGHTS = [
  { icon: TrendingUp, title: 'Oportunidad', msg: 'BR: +23% crecimiento detectado', color: '#10b981' },
  { icon: AlertTriangle, title: 'Riesgo', msg: 'CO: Descenso activación -15%', color: '#ef4444' },
  { icon: Zap, title: 'Acción', msg: 'Escalada: 3 líderes para capacitación', color: '#fb923c' },
];

export default function WarRoomAIOverlay({ sim, liveMetrics }) {
  const [showInsights, setShowInsights] = useState(true);
  const [activeInsight, setActiveInsight] = useState(0);

  useEffect(() => {
    if (!showInsights) return;
    const timer = setInterval(() => {
      setActiveInsight(prev => (prev + 1) % AI_INSIGHTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [showInsights]);

  return (
    <AnimatePresence>
      {showInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-6 w-72 rounded-xl overflow-hidden z-40"
          style={{ background: 'rgba(8,18,40,0.95)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 12px 48px rgba(139,92,246,0.2)' }}>
          
          {/* HEADER */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
            <Brain size={14} style={{ color: '#8b5cf6' }} />
            <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              AI INSIGHTS
            </span>
          </div>

          {/* CONTENT */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {AI_INSIGHTS.map((insight, i) => {
                if (i !== activeInsight) return null;
                const Icon = insight.icon;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2">
                    
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: insight.color }} />
                      <span style={{ color: insight.color, fontSize: 12, fontWeight: 700 }}>
                        {insight.title}
                      </span>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {insight.msg}
                    </p>

                    <div className="flex gap-1.5 pt-2">
                      {AI_INSIGHTS.map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-1 rounded-full"
                          style={{
                            background: idx === activeInsight ? insight.color : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-3 mt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button className="flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                Actuar
              </button>
              <button onClick={() => setShowInsights(false)} className="flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}