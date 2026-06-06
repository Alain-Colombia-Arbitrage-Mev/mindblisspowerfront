import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, AlertTriangle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Riesgos() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-red-900 to-red-800 py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-6">
            <AlertTriangle size={40} className="flex-shrink-0" />
            <h1 className="font-montserrat font-black text-4xl sm:text-5xl">
              Divulgación de Riesgos
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-white/80">
            Marco legal y operativo del ecosistema Vicion Power
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
            variants={fadeUp} className="prose prose-lg max-w-none text-gray-700">

            <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded mb-12">
              <p className="font-bold text-red-900 m-0">
                LECTURA OBLIGATORIA: Esta sección describe riesgos materiales asociados con la participación en el ecosistema Vicion Power. Los usuarios deben leer cuidadosamente y entender estos riesgos antes de participar.
              </p>
            </div>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Riesgo de Pérdida de Capital</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Tu participación inicial no está garantizada. Existe un riesgo material de pérdida parcial o total del capital invertido.</p>
            <p><strong>Escenario de Riesgo:</strong> Si el ecosistema no alcanza los objetivos de desarrollo proyectados o experimenta discontinuidad operativa, los beneficios esperados pueden no materializarse y tu participación inicial puede perderse.</p>
            <p><strong>Mitigación:</strong> Participa solo con fondos que puedas permitirte perder completamente. No utilices fondos esenciales para subsistencia, educación de dependientes o necesidades críticas.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Riesgo Regulatorio y Legal</h2>
            <p><strong>Naturaleza del Riesgo:</strong> El marco regulatorio para ecosistemas como Vicion Power está en evolución. Cambios regulatorios pueden afectar significativamente la operación y beneficios.</p>
            <p><strong>Escenario de Riesgo:</strong> Autoridades regulatorias pueden:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Requerir cambios operacionales significativos</li>
              <li>Restricionar o prohibir ciertos servicios</li>
              <li>Imponer requisitos de cumplimiento adicionales</li>
              <li>Requerir devolución de fondos o beneficios</li>
              <li>Investigar la plataforma o la empresa</li>
            </ul>
            <p><strong>Mitigación:</strong> Monitorea cambios regulatorios en tu jurisdicción. Mantente informado de actualizaciones legales de Vicion Power.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Riesgo de Liquidez</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Tu participación no es fácilmente convertible a efectivo. Los beneficios pueden estar bloqueados o limitados en disponibilidad.</p>
            <p><strong>Escenario de Riesgo:</strong> Pueden enfrentar:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Períodos de espera obligatorios antes de acceso a beneficios</li>
              <li>Restricciones sobre cuándo y cómo pueden retirar fondos</li>
              <li>Limitaciones de cantidad de retiros</li>
              <li>Incapacidad de vender tu participación a terceros</li>
            </ul>
            <p><strong>Mitigación:</strong> Participa solo con fondos que puedas bloquear a largo plazo. Mantén liquidez suficiente fuera del ecosistema.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Riesgo Operacional</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Errores operacionales, fallos tecnológicos o interrupciones de servicio pueden afectar tu acceso a beneficios.</p>
            <p><strong>Escenario de Riesgo:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fallos técnicos que interrumpen acceso a la plataforma</li>
              <li>Pérdida de datos o corrupción de registros</li>
              <li>Ciberataques o vulnerabilidades de seguridad</li>
              <li>Errores humanos en procesamiento de transacciones</li>
              <li>Incapacidad de contactar con equipo de soporte</li>
            </ul>
            <p><strong>Mitigación:</strong> Vicion Power implementa medidas de seguridad y redundancia. Sin embargo, ningún sistema es completamente inmune a fallos.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Riesgo de Mercado y Volatilidad</h2>
            <p><strong>Naturaleza del Riesgo:</strong> El valor de tu participación y beneficios puede fluctuar basado en condiciones de mercado económicas globales.</p>
            <p><strong>Escenario de Riesgo:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cambios en tasas de cambio de divisas</li>
              <li>Inflación que reduce el valor real de beneficios</li>
              <li>Cambios en condiciones económicas globales</li>
              <li>Ciclos económicos que afectan viabilidad del ecosistema</li>
            </ul>
            <p><strong>Mitigación:</strong> Diversifica tus inversiones más allá de Vicion Power. No confíes exclusivamente en este ecosistema para tu seguridad financiera.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Riesgo de Crédito y Contraparte</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Existe riesgo de que Vicion Power u otras contrapartes clave incumplan sus obligaciones.</p>
            <p><strong>Escenario de Riesgo:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vicion Power entra en insolvencia</li>
              <li>Proveedores de servicios clave fallan</li>
              <li>Incapacidad de Vicion Power para pagar beneficios comprometidos</li>
              <li>Disputas sobre obligaciones contractuales</li>
            </ul>
            <p><strong>Mitigación:</strong> Realiza diligencia debida sobre la solidez financiera de Vicion Power. Mantente informado del estado operativo.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Riesgo de Fraude y Seguridad</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Aunque Vicion Power implementa medidas de seguridad, existe riesgo residual de fraude.</p>
            <p><strong>Escenario de Riesgo:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ciberdelincuentes acceden a tu cuenta</li>
              <li>Robo de identidad o información personal</li>
              <li>Fraude interno por empleados de Vicion Power</li>
              <li>Phishing o ingeniería social dirigida a ti</li>
            </ul>
            <p><strong>Mitigación:</strong> Utiliza contraseñas fuertes, autenticación de dos factores. Sé vigilante contra intentos de fraude. Reporta actividad sospechosa inmediatamente.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Riesgos de Concentración Geográfica</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Si tu red de participantes está concentrada en una región, eventos locales pueden afectar significativamente el ecosistema.</p>
            <p><strong>Escenario de Riesgo:</strong> Cambios políticos, económicos o legales en una región pueden reducir participación y beneficios disponibles.</p>
            <p><strong>Mitigación:</strong> Construye redes diversificadas geográficamente. No dependas exclusivamente de una región.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Riesgo de Gestión</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Decisiones de gestión pueden afectar el desempeño del ecosistema.</p>
            <p><strong>Escenario de Riesgo:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Decisiones estratégicas fallidas</li>
              <li>Cambio de liderazgo clave</li>
              <li>Diferencias en visión estratégica</li>
              <li>Asignación subóptima de recursos</li>
            </ul>
            <p><strong>Mitigación:</strong> Mantente informado sobre decisiones y cambios de gestión. Participa en mecanismos de gobernanza cuando estén disponibles.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Riesgo de Cambio de Política</h2>
            <p><strong>Naturaleza del Riesgo:</strong> Vicion Power puede cambiar términos, políticas y estructura de beneficios con poca notificación.</p>
            <p><strong>Escenario de Riesgo:</strong> Cambios pueden incluir:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modificación de estructura de beneficios</li>
              <li>Cambios en requisitos de actividad</li>
              <li>Nuevas restricciones sobre retiros</li>
              <li>Cambios en términos de participación</li>
            </ul>
            <p><strong>Mitigación:</strong> Lee todos los comunicados de Vicion Power cuidadosamente. Entiende que estos cambios pueden ocurrir.</p>

            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded my-12">
              <h3 className="font-bold text-yellow-900 mt-0">RECONOCIMIENTO IMPORTANTE</h3>
              <p className="m-0">Al participar en Vicion Power, reconoces que:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3 mb-0">
                <li>Has leído y comprendido todos estos riesgos</li>
                <li>Aceptas estos riesgos como condición de participación</li>
                <li>No culparás a Vicion Power por resultados negativos relacionados con estos riesgos</li>
                <li>Eres responsable de tus propias decisiones de inversión</li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 mt-12 pt-6 border-t">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-4 justify-center">
          <Link to="/compliance"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-vicion-blue/30 text-vicion-blue font-semibold rounded-lg hover:bg-vicion-blue/5 transition-all">
            <ArrowLeft size={18} /> Volver a Compliance
          </Link>
          <Link to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-vicion-blue text-white font-semibold rounded-lg hover:bg-blue-500 transition-all">
            <Home size={18} /> Inicio
          </Link>
        </div>
      </section>
    </div>
  );
}