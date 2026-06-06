import { useState } from 'react';
import { Users, TrendingUp, User, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeaderDuplicationGuide from './dash/LeaderDuplicationGuide';

const TreeNode = ({ person, level, position }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: level * 0.1 }}
    className="flex flex-col items-center"
  >
    {/* Node */}
    <div
      className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
      style={{
        background: person.active ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.15))' : 'rgba(59,130,246,0.1)',
        border: person.active ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(59,130,246,0.2)',
        boxShadow: person.active ? '0 0 16px rgba(16,185,129,0.2)' : 'none',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mb-1"
        style={{
          background: person.active ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
        }}
      >
        {person.initial}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, textAlign: 'center', margin: 0 }}>
        {person.name}
      </p>
      {person.active && (
        <p style={{ color: '#10b981', fontSize: 8, fontWeight: 700, marginTop: 2 }}>● Activo</p>
      )}
    </div>
  </motion.div>
);

export default function NetworkVisualization() {
  const [showGrowthGuide, setShowGrowthGuide] = useState(false);

  // Mock network data
  const networkData = {
    root: { name: 'Tú', initial: 'TU', active: true, progress: 100 },
    level1: [
      { name: 'Carlos M.', initial: 'CM', active: true },
      { name: 'Ana R.', initial: 'AR', active: true },
    ],
    level2: [
      { name: 'Luis G.', initial: 'LG', active: true },
      { name: 'María L.', initial: 'ML', active: false },
      { name: 'Diego P.', initial: 'DP', active: true },
      { name: 'Sofia N.', initial: 'SN', active: false },
    ],
  };

  const stats = {
    total: 7,
    active: 5,
    pending: 2,
  };

  const mentor = {
    name: 'Juan Mendoza',
    role: 'Tu líder asignado',
    contact: 'juan@vicion.com',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Users size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            TU RED ESTRUCTURADA
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Tu estructura binaria
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Visualiza tu red de forma clara. Cada persona que invites se posiciona a la izquierda o derecha, creando una estructura ordenada.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree Visualization */}
        <div className="lg:col-span-2 p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
            ÁRBOL DE RED
          </p>

          {/* Level 0 - Root */}
          <div className="flex justify-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.2))',
                border: '2px solid rgba(16,185,129,0.5)',
                boxShadow: '0 0 24px rgba(16,185,129,0.3)',
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white mb-2"
                style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                {networkData.root.initial}
              </div>
              <p style={{ color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', margin: 0 }}>
                {networkData.root.name}
              </p>
              <p style={{ color: '#10b981', fontSize: 9, fontWeight: 700, marginTop: 2 }}>● Activo</p>
            </motion.div>
          </div>

          {/* Connector to Level 1 */}
          <div className="flex justify-center mb-8">
            <div style={{ width: 2, height: 20, background: 'rgba(59,130,246,0.3)' }} />
          </div>

          {/* Level 1 - Direct referrals */}
          <div className="flex justify-center gap-16 mb-12">
            {networkData.level1.map((person, i) => (
              <div key={i} className="flex flex-col items-center">
                <div style={{ width: 2, height: 12, background: 'rgba(59,130,246,0.25)', marginBottom: 8 }} />
                <TreeNode person={person} level={1} position={i} />
              </div>
            ))}
          </div>

          {/* Connector to Level 2 */}
          <div className="flex justify-center px-8 mb-8">
            <div style={{ width: '100%', height: 2, background: 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.1) 50%, rgba(59,130,246,0.2) 100%)' }} />
          </div>

          {/* Level 2 - Network depth */}
          <div className="grid grid-cols-4 gap-4">
            {networkData.level2.map((person, i) => (
              <motion.div key={i} className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}>
                <div style={{ width: 1.5, height: 8, background: 'rgba(59,130,246,0.2)', marginBottom: 6 }} />
                <TreeNode person={person} level={2} position={i} />
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-12 pt-8 flex gap-6 justify-center"
            style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Activo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Pendiente</span>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
              MI RED
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Total en red</p>
                <p style={{ color: '#3b82f6', fontSize: 20, fontWeight: 800, margin: 0 }}>{stats.total}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>Activos ahora</p>
                <p style={{ color: '#10b981', fontSize: 20, fontWeight: 800, margin: 0 }}>{stats.active}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>En proceso</p>
                <p style={{ color: '#fb923c', fontSize: 20, fontWeight: 800, margin: 0 }}>{stats.pending}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(249,115,22,0.08))', border: '1px solid rgba(251,146,60,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: '#fb923c' }} />
              <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>PROGRESO</p>
            </div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Red activa: 71%</p>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '71%' }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #fb923c, #f97316)' }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>5 de 7 personas activadas</p>
          </div>

          {/* Mentor Block */}
          <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} style={{ color: '#c084fc' }} />
              <p style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: 0 }}>TU MENTOR</p>
            </div>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{mentor.name}</p>
            <p style={{ color: '#c084fc', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>{mentor.role}</p>
            <a href={`mailto:${mentor.contact}`}
              style={{ color: '#c084fc', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
              {mentor.contact}
            </a>
          </div>
        </div>
      </div>

      {/* Next Step Block */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))', border: '2px solid rgba(16,185,129,0.25)' }}>
        <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', marginBottom: 12 }}>
          SIGUIENTE PASO EN RED
        </p>
        <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>
          Cómo crece tu estructura
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { num: 1, text: 'Invita a personas' },
            { num: 2, text: 'Se posicionan (izq/der)' },
            { num: 3, text: 'Crece tu red activa' },
          ].map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white mb-3"
                style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                {step.num}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' }}>{step.text}</p>
              {i < 2 && <ChevronRight size={20} style={{ color: 'rgba(16,185,129,0.4)', marginTop: 8 }} />}
            </motion.div>
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Tu red crece de forma ordenada. Cada referido que actives suma a tu estructura y acelera tu progresión dentro del sistema.
        </p>

        <button
          onClick={() => setShowGrowthGuide(true)}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            border: 'none',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            fontFamily: 'Montserrat,sans-serif',
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          Iniciar guía de liderazgo <ArrowRight size={16} />
        </button>
      </motion.div>

      {/* Growth Guide Modal */}
      <AnimatePresence>
        {showGrowthGuide && (
          <LeaderDuplicationGuide onComplete={() => setShowGrowthGuide(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}