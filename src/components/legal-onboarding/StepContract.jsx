import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const CONTRACT_TEXT = `ACUERDO DE PARTICIPACIÓN - VICION POWER

1. NATURALEZA DEL SISTEMA
Vicion Power es un ecosistema integrado de tecnología, proyectos y estructuras de desarrollo. La participación se basa en acceso a beneficios dentro del sistema, no en la adquisición de productos financieros tradicionales.

2. PARTICIPACIÓN Y BENEFICIOS
Los participantes acceden a beneficios basados en su nivel de participación, actividad dentro del ecosistema y desarrollo del mismo. El acceso a beneficios es progresivo y está sujeto a las condiciones establecidas en el plan seleccionado.

3. ESTIMACIONES Y PROYECCIONES
Todos los escenarios mostrados, simulaciones y proyecciones son estimaciones sujetas a la evolución del ecosistema. No constituyen una garantía de resultados. Los beneficios pueden variar según el desempeño del sistema.

4. PERMANENCIA Y CONTINUIDAD
La participación requiere permanencia dentro del ecosistema. La discontinuidad puede afectar el acceso a beneficios. El usuario acepta las condiciones de permanencia del plan seleccionado.

5. RIESGOS Y RESPONSABILIDAD
El usuario comprende que:
- No hay rendimientos garantizados
- Los resultados pueden variar significativamente
- La participación implica dependencia del desarrollo del ecosistema
- No existe garantía de retorno o recuperación de inversión

6. CUMPLIMIENTO Y VALIDACIÓN
Vicion Power implementa procesos de validación, control y cumplimiento conforme a estándares internacionales, incluyendo políticas AML y KYC. El usuario acepta someterse a estos procesos de verificación.

7. DATOS Y PRIVACIDAD
El usuario autoriza el tratamiento de sus datos personales conforme a la Política de Privacidad. Vicion Power implementa medidas de seguridad para proteger la información del usuario.

8. MODIFICACIONES
Vicion Power se reserva el derecho de modificar las condiciones del sistema, planes y beneficios. El usuario será notificado de cambios significativos y deberá aceptar nuevas condiciones para continuar.

9. RESOLUCIÓN DE CONFLICTOS
Cualquier disputa será resuelta conforme a los procedimientos establecidos por Vicion Power y la jurisdicción aplicable.

10. ACEPTACIÓN
Al aceptar este acuerdo, el usuario confirma que ha leído, comprende y acepta todos los términos y condiciones establecidos.

Versión: 1.0
Fecha de entrada en vigencia: 12 de abril de 2026`;

export default function StepContract({ onNext, onBack, participationLevel }) {
  const [checks, setChecks] = useState({
    read: false,
    nature: false,
    risks: false,
    permanence: false,
  });

  const allChecked = Object.values(checks).every(v => v);

  const handleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="w-full max-w-6xl">
        
        <h1 className="font-montserrat font-black text-4xl text-vicion-deep mb-8">
          Acuerdo de participación
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* LEFT: Resumen */}
          <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 border border-vicion-blue/20">
              <p className="text-xs text-vicion-blue font-bold uppercase tracking-wider mb-3">Resumen de participación</p>
              
              <div className="space-y-4">
                {[
                  { label: 'Nivel seleccionado', value: participationLevel || 'Standard' },
                  { label: 'Tipo de participación', value: 'Acceso al ecosistema' },
                  { label: 'Permanencia estimada', value: 'Indefinida (con aceptación anual)' },
                  { label: 'Acceso a beneficios', value: 'Progresivo y estructurado' },
                ].map((item, i) => (
                  <div key={i} className="border-t border-vicion-blue/10 pt-3 first:border-0 first:pt-0">
                    <p className="text-xs text-gray-500 font-semibold mb-1">{item.label}</p>
                    <p className="text-sm text-vicion-deep font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-900">
                <span className="font-bold">Importante:</span> Este documento es legalmente vinculante. Léelo completamente antes de aceptar.
              </p>
            </div>
          </motion.div>

          {/* RIGHT: Contract with scroll */}
          <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.15 }}
            variants={fadeUp} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-96">
            <div className="h-96 overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed space-y-4">
              {CONTRACT_TEXT.split('\n\n').map((section, i) => (
                <div key={i}>
                  {section.split('\n').map((line, j) => (
                    <p key={j} className={line.match(/^\d+\./) || line.match(/^ACUERDO/) ? 'font-bold text-gray-900 mb-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Checkboxes */}
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.2 }}
          variants={fadeUp} className="mb-12">
          <p className="text-sm text-gray-600 font-semibold mb-4">Confirmaciones obligatorias:</p>
          
          <div className="space-y-3">
            {[
              { key: 'read', label: 'He leído y acepto el Acuerdo de Participación' },
              { key: 'nature', label: 'Comprendo la naturaleza del sistema' },
              { key: 'risks', label: 'Entiendo que no existen garantías de resultados' },
              { key: 'permanence', label: 'Acepto las condiciones de permanencia' },
            ].map((item, i) => (
              <motion.label key={i} initial="hidden" animate="visible"
                transition={{ duration: 0.6, delay: 0.25 + i * 0.08 }}
                variants={fadeUp} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
                <input
                  type="checkbox"
                  checked={checks[item.key]}
                  onChange={() => handleCheck(item.key)}
                  className="w-5 h-5 rounded border-vicion-blue mt-0.5 cursor-pointer flex-shrink-0"
                  style={{ accentColor: 'rgb(29, 110, 245)' }}
                />
                <span className="text-gray-700 font-medium text-sm">{item.label}</span>
              </motion.label>
            ))}
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.3 }}
          variants={fadeUp} className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Atrás
          </button>
          <button
            onClick={onNext}
            disabled={!allChecked}
            className={`flex-1 inline-flex items-center justify-center gap-2 font-bold font-montserrat px-6 py-3 rounded-xl transition-all duration-200 ${
              allChecked
                ? 'bg-vicion-blue hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}>
            Aceptar y continuar <ArrowRight size={18} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}