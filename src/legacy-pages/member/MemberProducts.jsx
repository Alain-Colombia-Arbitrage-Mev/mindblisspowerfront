import { useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle, Crown, Lock, MessageSquare, Smartphone, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemberProducts() {
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    {
      id: 'base-access',
      name: 'Acceso Base',
      icon: Smartphone,
      description: 'Plataforma principal y red binaria',
      features: ['Dashboard', 'Red binaria', 'Comunicaciones básicas', 'Historial'],
      status: 'active',
      unlockedAt: 'Entrada',
      price: 'Incluido',
    },
    {
      id: 'crm-pro',
      name: 'CRM Pro',
      icon: Users,
      description: 'Gestión avanzada de tu equipo',
      features: ['Análisis detallado', 'Segmentación', 'Etiquetado', 'Follow-up tracking'],
      status: userData.rank && ['Platino', 'Oro', 'Diamante', 'Diamante Azul', 'Diamante Negro', 'E. Corona'].includes(userData.rank) ? 'active' : 'locked',
      unlockedAt: 'Rango Platino',
      nextStep: 'Alcanza Platino',
      requiredRank: 'Platino',
    },
    {
      id: 'intel-pro',
      name: 'Intelligence Pro',
      icon: BarChart3,
      description: 'Análisis predictivo de red',
      features: ['Métricas avanzadas', 'Proyecciones', 'Simulaciones', 'Reportes AI'],
      status: userData.rank && ['Diamante', 'Diamante Azul', 'Diamante Negro', 'E. Corona'].includes(userData.rank) ? 'active' : 'locked',
      unlockedAt: 'Rango Diamante',
      nextStep: 'Alcanza Diamante',
      requiredRank: 'Diamante',
    },
    {
      id: 'comms-suite',
      name: 'Communications Suite',
      icon: MessageSquare,
      description: 'Herramientas de comunicación premium',
      features: ['Broadcasts segmentados', 'Campañas programadas', 'Templates', 'Analytics'],
      status: userData.rank && ['Diamante Azul', 'Diamante Negro', 'E. Corona'].includes(userData.rank) ? 'active' : 'locked',
      unlockedAt: 'Rango Diamante Azul',
      nextStep: 'Alcanza Diamante Azul',
      requiredRank: 'Diamante Azul',
    },
    {
      id: 'elite-hub',
      name: 'Elite Leadership Hub',
      icon: Crown,
      description: 'Control total de la plataforma',
      features: ['Gestión global', 'Intervenciones estratégicas', 'Reportes ejecutivos', 'Asesoramiento AI'],
      status: userData.rank === 'E. Corona' || userData.rank === 'Diamante Negro' ? 'active' : 'locked',
      unlockedAt: 'Rango Diamante Negro+',
      nextStep: 'Alcanza Diamante Negro',
      requiredRank: 'Diamante Negro',
    },
  ];

  return (
    <div className="p-8 max-w-7xl space-y-8" style={{ background: 'linear-gradient(135deg, #060e1c 0%, #0a1628 100%)' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>Productos & Acceso</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
          Desbloquea herramientas según tu rango y crecimiento
        </p>
      </motion.div>

      {/* CURRENT STATUS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4), rgba(8,18,40,0.2))',
          border: '1px solid rgba(59,130,246,0.15)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>RANGO ACTUAL</p>
            <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 900, margin: 0 }}>
              {userData.rank || 'Participante'}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>SERVICIOS ACTIVOS</p>
            <p style={{ color: '#10b981', fontSize: 18, fontWeight: 900, margin: 0 }}>
              {products.filter(p => p.status === 'active').length}/{products.length}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>PRÓXIMO DESBLOQUEO</p>
            <p style={{ color: '#fb923c', fontSize: 13, fontWeight: 700, margin: 0 }}>
              {products.find(p => p.status === 'locked')?.nextStep || 'Todos activos'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* PRODUCTS GRID */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-4"
      >
        {products.map((product, i) => {
          const ProductIcon = product.icon;
          return (
          <motion.div
            key={product.id}
            onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
            whileHover={{ translateY: -2 }}
            className="p-6 rounded-lg cursor-pointer transition-all"
            style={{
              background: product.status === 'active' ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(8,18,40,0.2))' : 'linear-gradient(135deg, rgba(13,31,60,0.4), rgba(8,18,40,0.2))',
              border: product.status === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div style={{ width: 42, height: 42, borderRadius: 12, background: product.status === 'active' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)', border: product.status === 'active' ? '1px solid var(--vp-accent-border)' : '1px solid var(--vp-border)', color: product.status === 'active' ? 'var(--vp-accent)' : 'var(--vp-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ProductIcon size={22} strokeWidth={1.7} />
                </div>
                <div>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: '0 0 4px 0' }}>
                    {product.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                    {product.description}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {product.status === 'active' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: 10, fontWeight: 700 }}>
                    <CheckCircle size={12} />
                    Activo
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '20px', fontSize: 10, fontWeight: 700 }}>
                    <Lock size={12} />
                    Bloqueado
                  </div>
                )}
              </div>
            </div>

            {/* EXPANDABLE DETAILS */}
            {selectedProduct?.id === product.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="space-y-4">
                  {/* FEATURES */}
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Características</p>
                    <ul className="space-y-2">
                      {product.features.map((feature, j) => (
                        <li key={j} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 4, height: 4, background: '#3b82f6', borderRadius: '50%' }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* STATUS & UNLOCK INFO */}
                  <div className="grid grid-cols-2 gap-3">
                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 4px 0' }}>DESBLOQUEADO EN</p>
                      <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>{product.unlockedAt}</p>
                    </div>
                    {product.status === 'locked' && (
                      <div style={{ padding: '10px 12px', background: 'rgba(251,146,60,0.1)', borderRadius: 6, border: '1px solid rgba(251,146,60,0.3)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 4px 0' }}>REQUERIDO</p>
                        <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, margin: 0 }}>{product.requiredRank}</p>
                      </div>
                    )}
                  </div>

                  {/* CALL TO ACTION */}
                  {product.status === 'locked' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: '12px',
                        background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(251,146,60,0.1))',
                        border: '1px solid rgba(251,146,60,0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
                      <div>
                        <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, margin: 0 }}>
                          {product.nextStep} para desbloquear este servicio
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                          Continúa expandiendo tu red
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
          );
        })}
      </motion.div>

      {/* ROADMAP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(13,31,60,0.4), rgba(8,18,40,0.2))',
          border: '1px solid rgba(59,130,246,0.15)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={18} style={{ color: '#3b82f6' }} />
          <h3 style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: 0 }}>Tu Roadmap de Progresión</h3>
        </div>
        <div className="space-y-3">
          {[
            { rank: 'Principiante', access: 'Acceso Base', color: '#9ca3af' },
            { rank: 'Platino+', access: 'CRM Pro', color: '#fbbf24' },
            { rank: 'Diamante+', access: 'Intelligence Pro', color: '#a855f7' },
            { rank: 'Diamante Azul+', access: 'Communications Suite', color: '#60a5fa' },
            { rank: 'Diamante Negro+', access: 'Elite Leadership Hub', color: '#1f2937' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: step.color,
                opacity: userData.rank && ['Platino', 'Oro', 'Diamante', 'Diamante Azul', 'Diamante Negro', 'E. Corona'].includes(userData.rank) ? 1 : 0.3,
              }} />
              <span style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                flex: 1,
              }}>
                {step.rank}
              </span>
              <span style={{ color: step.color, fontSize: 10, fontWeight: 700 }}>→ {step.access}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
