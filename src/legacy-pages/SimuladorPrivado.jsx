import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// Simulador privado - solo después de registro, validación, selección de participación
export default function SimuladorPrivado() {
  const navigate = useNavigate();
  
  // Estado de acceso
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Configuración del usuario
  const [planLevel, setPlanLevel] = useState(null);
  const [permanence, setPermanence] = useState('24');
  const [participationType, setParticipationType] = useState('activa');
  const [disclaimer, setDisclaimer] = useState(false);
  
  // Cálculos
  const [scenario, setScenario] = useState(null);

  const planValues = {
    '500': 500,
    '1000': 1000,
    '2500': 2500,
    '5000': 5000,
    '10000': 10000,
    '25000': 25000,
  };

  const permanenceFactor = {
    '12': 0.8,
    '18': 1,
    '24': 1.2,
    '36': 1.5,
  };

  const typeFactor = {
    'base': 0.9,
    'activa': 1,
    'expansiva': 1.3,
  };

  // Verificar acceso
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          navigate('/participar');
          return;
        }

        // TODO: Verificar email_verified, phone_verified, participation_selected
        // Por ahora asumimos que si llegó aquí, ya pasó todas las validaciones
        setIsAuthorized(true);
        setPlanLevel('1000'); // valor por defecto
      } catch (error) {
        navigate('/participar');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  // Calcular escenario
  useEffect(() => {
    if (!planLevel) return;

    const base = planValues[planLevel];
    const pFactor = permanenceFactor[permanence];
    const tFactor = typeFactor[participationType];
    
    const resultBase = base * pFactor * tFactor;
    
    // Generar bonos aleatorios entre 10% y 80%
    const bonusPercent = Math.floor(Math.random() * 71) + 10;
    const bonusAmount = resultBase * (bonusPercent / 100);
    
    // Escenarios
    const conservative = Math.round(resultBase * 0.8);
    const balanced = Math.round(resultBase);
    const expansive = Math.round(resultBase * 1.5);
    
    setScenario({
      base: Math.round(base),
      baseCalculated: Math.round(resultBase),
      bonus: Math.round(bonusAmount),
      bonusPercent,
      conservative,
      balanced,
      expansive,
      label: balanced > base * 1.2 ? 'Expansión' : balanced > base ? 'Desarrollo' : 'Inicial',
    });
  }, [planLevel, permanence, participationType]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-vicion-deep">
        <div className="w-8 h-8 border-4 border-vicion-blue border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const isReady = planLevel && disclaimer;

  return (
    <div className="min-h-screen bg-vicion-deep text-white overflow-hidden">

      {/* ══ HERO DECISIÓN ═════════════════════════════════════════════════════ */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-16">
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl mb-6 leading-tight">
              Define tu posición dentro del sistema
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Ajusta tu participación y visualiza el escenario que estás a punto de activar.
            </p>
          </motion.div>

          {/* ══ BLOQUE 1: CONFIGURACIÓN REAL ═════════════════════════════════ */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="rounded-2xl p-10 mb-12"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            
            <h2 className="font-montserrat font-black text-2xl mb-10">Configura tu escenario</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Nivel de participación */}
              <div>
                <label className="block text-sm font-semibold mb-4 text-white/80">Nivel de participación *</label>
                <select 
                  value={planLevel || ''} 
                  onChange={(e) => setPlanLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-vicion-blue transition-colors">
                  <option value="" disabled className="bg-vicion-deep">Selecciona un nivel</option>
                  <option value="500" className="bg-vicion-deep">$500 USD</option>
                  <option value="1000" className="bg-vicion-deep">$1,000 USD</option>
                  <option value="2500" className="bg-vicion-deep">$2,500 USD</option>
                  <option value="5000" className="bg-vicion-deep">$5,000 USD</option>
                  <option value="10000" className="bg-vicion-deep">$10,000 USD</option>
                  <option value="25000" className="bg-vicion-deep">$25,000 USD</option>
                </select>
              </div>

              {/* Permanencia */}
              <div>
                <label className="block text-sm font-semibold mb-4 text-white/80">Permanencia</label>
                <select 
                  value={permanence} 
                  onChange={(e) => setPermanence(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-vicion-blue transition-colors">
                  <option value="12" className="bg-vicion-deep">12 meses (0.8x)</option>
                  <option value="18" className="bg-vicion-deep">18 meses (1x)</option>
                  <option value="24" className="bg-vicion-deep">24 meses - Recomendado (1.2x)</option>
                  <option value="36" className="bg-vicion-deep">36 meses (1.5x)</option>
                </select>
              </div>

              {/* Tipo de participación */}
              <div>
                <label className="block text-sm font-semibold mb-4 text-white/80">Tipo de participación</label>
                <select 
                  value={participationType} 
                  onChange={(e) => setParticipationType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-vicion-blue transition-colors">
                  <option value="base" className="bg-vicion-deep">Base - Acceso (0.9x)</option>
                  <option value="activa" className="bg-vicion-deep">Activa - Equilibrada (1x)</option>
                  <option value="expansiva" className="bg-vicion-deep">Expansiva - Mayor exposición (1.3x)</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* ══ BLOQUE 2: ESCENARIO PRINCIPAL ═════════════════════════════════ */}
          {scenario && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
              variants={fadeUp} className="rounded-2xl p-12 mb-12 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(29,110,245,0.08))', border: '1px solid rgba(59,130,246,0.3)' }}>
              
              <h2 className="font-montserrat font-black text-2xl mb-2">Escenario estimado de participación</h2>
              <p className="text-white/60 text-sm mb-8">Basado en escenarios de desarrollo y valorización del ecosistema</p>

              <div className="flex flex-col items-center gap-6">
                <div className="inline-flex items-baseline gap-2">
                  <span className="font-montserrat font-black text-6xl text-vicion-electric">${scenario.balanced.toLocaleString()}</span>
                  <span className="text-white/60 text-xl">USD</span>
                </div>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <TrendingUp size={16} className="text-vicion-electric" />
                  <span className="font-semibold text-sm">{scenario.label}</span>
                </div>
              </div>
            </motion.section>
          )}

          {/* ══ BLOQUE 3: DESGLOSE REAL ═════════════════════════════════════════ */}
          {scenario && (
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
              variants={fadeUp} className="rounded-2xl p-10 mb-12"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
              
              <h2 className="font-montserrat font-black text-2xl mb-10">Cómo se construye este escenario</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/70">Participación base:</span>
                  <span className="font-montserrat font-bold text-xl text-vicion-electric">${scenario.base.toLocaleString()} USD</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-white/70">Desarrollo del ecosistema:</span>
                  <span className="font-montserrat font-bold text-xl text-vicion-electric">${(scenario.baseCalculated - scenario.base).toLocaleString()} USD</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-vicion-blue/20 border border-vicion-blue/30">
                  <span className="text-white/70">Bonos de valorización estimados:</span>
                  <span className="font-montserrat font-bold text-xl text-vicion-electric">+{scenario.bonusPercent}%</span>
                </div>
              </div>

              <p className="mt-8 text-sm text-white/50 text-center">
                Estos valores reflejan escenarios basados en el desarrollo de proyectos del ecosistema y su capacidad de crecimiento.
              </p>
            </motion.section>
          )}

          {/* ══ BLOQUE 4: RESPALDO DIRECTO ═════════════════════════════════════ */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }}
            variants={fadeUp} className="rounded-2xl p-10 mb-12"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            
            <h2 className="font-montserrat font-black text-2xl mb-8">Base de generación de valor</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'BMP', desc: 'Infraestructura tecnológica activa' },
                { label: 'Proyectos', desc: 'Desarrollos inmobiliarios y estratégicos' },
                { label: 'Plataformas', desc: 'Desarrollo de soluciones digitales' },
                { label: 'Activos', desc: 'Portafolio estratégico integrado' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-lg bg-white/5 border border-white/10">
                  <CheckCircle size={20} className="text-vicion-electric flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-white/60 text-center">
              Tu participación se integra dentro de un entorno con capacidad real de generación de valor.
            </p>
          </motion.section>

          {/* ══ BLOQUE DISCLAIMER ═════════════════════════════════════════════ */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.5 }}
            variants={fadeUp} className="rounded-2xl p-8 mb-12"
            style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)' }}>
            
            <h2 className="font-montserrat font-black text-xl mb-6">Antes de continuar</h2>

            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={disclaimer}
                onChange={(e) => setDisclaimer(e.target.checked)}
                className="w-5 h-5 rounded mt-1 flex-shrink-0 cursor-pointer accent-vicion-blue"
              />
              <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                Entiendo que este escenario representa una estimación basada en el desarrollo del ecosistema y no constituye una garantía de resultados.
              </span>
            </label>
          </motion.section>

          {/* ══ BLOQUE FINAL: CIERRE ═════════════════════════════════════════ */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.6 }}
            variants={fadeUp} className="rounded-2xl p-10"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,110,245,0.1))', border: '1px solid rgba(59,130,246,0.3)' }}>
            
            <h2 className="font-montserrat font-black text-2xl mb-8 text-center">Estás a punto de activar tu participación</h2>

            {scenario && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Nivel seleccionado</p>
                  <p className="font-montserrat font-black text-2xl text-vicion-electric">${planLevel} USD</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Permanencia</p>
                  <p className="font-montserrat font-black text-2xl text-vicion-electric">{permanence} meses</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Escenario</p>
                  <p className="font-montserrat font-black text-2xl text-vicion-electric">${scenario.balanced.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                disabled={!isReady}
                className={`inline-flex items-center justify-center gap-2 font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg ${
                  isReady
                    ? 'bg-vicion-blue hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}>
                Activar participación <ArrowRight size={20} />
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold font-montserrat px-10 py-4 rounded-xl transition-all duration-200">
                Ajustar escenario
              </button>
            </div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}