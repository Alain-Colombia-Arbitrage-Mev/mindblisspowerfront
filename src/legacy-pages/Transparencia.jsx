import { motion } from 'framer-motion';
import { Shield, Layers, FileText, CheckCircle, AlertCircle, Lock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Transparencia() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-20 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-vicion-deep via-vicion-deep to-gray-900" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl text-white mb-8 leading-tight">
            Transparencia y Cumplimiento
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
            Marco institucional, estructura regulatoria y políticas que sustentan el ecosistema Vicion Power.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
            className="flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Shield size={16} />
              <span>Estructura clara</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Cumplimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={16} />
              <span>Seguridad</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ SECCIÓN 1: ESTRUCTURA DEL ECOSISTEMA ══════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Layers size={28} className="text-vicion-blue" />
              <h2 className="font-montserrat font-black text-4xl text-vicion-deep">Estructura del ecosistema</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Vicion Power opera como un ecosistema integrado de servicios y plataformas tecnológicas diseñado para facilitar participación, crecimiento y acceso a beneficios dentro de una estructura organizacional clara.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Infraestructura tecnológica', desc: 'Sistema digital descentralizado que conecta servicios, usuarios y operaciones.' },
              { title: 'Operación activa', desc: 'Base operativa con capacidad de ejecución, gestión y soporte continuo.' },
              { title: 'Marco regulatorio', desc: 'Estructura de cumplimiento y política que guía todas las operaciones.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="p-6 rounded-2xl bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 border border-vicion-blue/20">
                <h3 className="font-bold text-lg text-vicion-deep mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 2: NATURALEZA DEL MODELO ══════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FileText size={28} className="text-vicion-blue" />
              <h2 className="font-montserrat font-black text-4xl text-vicion-deep">Naturaleza del modelo</h2>
            </div>
          </motion.div>

          <div className="space-y-8">
            {[
              { title: 'Participación y acceso', content: 'Los participantes acceden a beneficios basados en su nivel de participación, actividad dentro del ecosistema y desarrollo del mismo. No constituye una garantía de ingresos.' },
              { title: 'Estructura de crecimiento', content: 'El modelo incentiva crecimiento organizacional mediante acceso progresivo a servicios, herramientas y oportunidades dentro de la plataforma.' },
              { title: 'Estimaciones y proyecciones', content: 'Todos los beneficios mostrados, simulaciones y proyecciones son estimaciones sujetas a la evolución del ecosistema. No son garantías de resultados.' },
              { title: 'Responsabilidad del usuario', content: 'Los participantes aceptan la naturaleza variable del modelo y su dependencia del desarrollo real del ecosistema y participación activa.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }} variants={fadeUp}
                className="p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg text-vicion-deep mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 3: PROCESO REGULATORIO ════════════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={28} className="text-vicion-blue" />
              <h2 className="font-montserrat font-black text-4xl text-vicion-deep">Proceso regulatorio</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Vicion Power opera bajo un marco de cumplimiento activo y está en proceso de fortalecer su posición regulatoria con autoridades competentes.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { label: 'Cumplimiento activo', status: 'En ejecución', desc: 'Proceso continuo de alineación con regulaciones locales e internacionales.' },
              { label: 'Proceso regulatorio', status: 'En desarrollo', desc: 'Comunicación y colaboración activa con autoridades competentes en jurisdicciones clave.' },
              { label: 'Certificaciones', status: 'En progreso', desc: 'Obtención de certificaciones y validaciones que respalden las operaciones.' },
              { label: 'Auditorías', status: 'Periódicas', desc: 'Revisiones independientes de políticas y operaciones.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }} variants={fadeUp}
                className="p-5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-4">
                <CheckCircle size={20} className="text-vicion-blue flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <p className="font-semibold text-vicion-deep">{item.label}</p>
                    <span className="text-xs text-vicion-blue font-semibold">{item.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 4: POLÍTICAS AML/KYC ═════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Lock size={28} className="text-vicion-blue" />
              <h2 className="font-montserrat font-black text-4xl text-vicion-deep">Políticas AML/KYC</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Implementamos procedimientos de conocimiento del cliente y prevención del lavado de dinero para mantener la integridad del ecosistema.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Verificación de identidad', content: 'Proceso obligatorio de validación de información personal y documentación de identificación.' },
              { title: 'Origen de fondos', content: 'Verificación de la legalidad y origen de los fondos utilizados para participación.' },
              { title: 'Monitoreo continuo', content: 'Revisión permanente de actividades dentro del ecosistema para detectar patrones anormales.' },
              { title: 'Reportes reguladores', content: 'Reporte de actividades sospechosas a autoridades competentes según la ley.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }} variants={fadeUp}
                className="p-6 rounded-xl bg-white border border-gray-200">
                <h3 className="font-semibold text-vicion-deep mb-3">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 5: GESTIÓN DE RIESGOS ═════════════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle size={28} className="text-vicion-blue" />
              <h2 className="font-montserrat font-black text-4xl text-vicion-deep">Gestión de riesgos</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Identificamos y manejamos riesgos operacionales, regulatorios y de mercado que puedan afectar a los participantes.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { risk: 'Riesgo de mercado', mitigation: 'Política conservadora de estimación de beneficios y proyecciones basadas en desarrollo real.' },
              { risk: 'Riesgo operacional', mitigation: 'Infraestructura redundante, auditorías periódicas y procedimientos claros.' },
              { risk: 'Riesgo regulatorio', mitigation: 'Comunicación activa con autoridades y actualización continua de políticas.' },
              { risk: 'Riesgo de fraude', mitigation: 'Sistema de detección, investigación y resolución de actividades fraudulentas.' },
              { risk: 'Riesgo de liquidez', mitigation: 'Planificación financiera y gestión de flujos dentro del ecosistema.' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }} variants={fadeUp}
                className="p-5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="font-semibold text-vicion-deep mb-2">{item.risk}</p>
                <p className="text-sm text-gray-600">{item.mitigation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CIERRE ════════════════════════════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl mb-6">
            Compromiso con la transparencia
          </motion.h2>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="text-white/70 mb-10 leading-relaxed text-lg">
            Vicion Power se compromete a mantener claridad, cumplimiento regulatorio y responsabilidad en todas sus operaciones. Esta información está disponible para que los participantes tomen decisiones informadas.
          </motion.p>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60">
              Para más información sobre políticas específicas, consulta las secciones legales o contacta al equipo de cumplimiento.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}