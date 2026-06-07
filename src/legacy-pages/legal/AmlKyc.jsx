import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AmlKyc() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-vicion-deep to-vicion-navy py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-4xl sm:text-5xl mb-4">
            AML/KYC – Cumplimiento Regulatorio
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-white/80">
            Marco legal y operativo del ecosistema Mindbliss Power
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
            variants={fadeUp} className="prose prose-lg max-w-none text-gray-700">

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Marco Regulatorio</h2>
            <p>Mindbliss Power opera de conformidad con estándares internacionales de cumplimiento, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Recomendaciones del Grupo de Acción Financiera Internacional (GAFI)</li>
              <li>Regulaciones anti-lavado de dinero (AML)</li>
              <li>Políticas de conozca a su cliente (KYC)</li>
              <li>Procedimientos de debida diligencia mejorada (EDD)</li>
              <li>Verificación de listas de sanciones</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Procedimiento KYC (Conozca a su Cliente)</h2>
            <p>Todos los usuarios deben completar el proceso KYC antes de participar activamente en el ecosistema. Este proceso incluye:</p>

            <h3 className="font-montserrat font-semibold text-2xl text-vicion-deep mt-8 mb-4">Nivel 1: Verificación Básica</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre completo y verificación de identidad</li>
              <li>Fecha de nacimiento</li>
              <li>Domicilio actual</li>
              <li>Número de teléfono</li>
              <li>Dirección de correo electrónico</li>
            </ul>

            <h3 className="font-montserrat font-semibold text-2xl text-vicion-deep mt-8 mb-4">Nivel 2: Verificación Mejorada</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Copia de documento de identidad (pasaporte, cédula)</li>
              <li>Comprobante de domicilio</li>
              <li>Información de origen de fondos</li>
              <li>Información profesional y ocupacional</li>
              <li>Información sobre actividades económicas</li>
            </ul>

            <h3 className="font-montserrat font-semibold text-2xl text-vicion-deep mt-8 mb-4">Nivel 3: Debida Diligencia Mejorada (EDD)</h3>
            <p>Para participantes de niveles más altos o transacciones significativas:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Verificación de beneficiarios efectivos</li>
              <li>Investigación de antecedentes profunda</li>
              <li>Verificación de listas de sanciones internacionales</li>
              <li>Análisis de fuente de riqueza</li>
              <li>Revisión de registros públicos</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Procedimiento AML (Anti-Lavado de Dinero)</h2>
            <p>Mindbliss Power implementa controles AML robustos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Monitoreo de Transacciones:</strong> Análisis continuo de patrones de actividad para detectar comportamiento inusual</li>
              <li><strong>Reportes de Transacciones Sospechosas (SAR):</strong> Reporte a autoridades competentes de actividades potencialmente ilícitas</li>
              <li><strong>Verificación de Listas OFAC:</strong> Control contra listas de sanciones de organismos internacionales</li>
              <li><strong>Umbrales de Alerta:</strong> Sistemas automáticos para transacciones superiores a montos especificados</li>
              <li><strong>Análisis de Riesgo:</strong> Evaluación continua del perfil de riesgo de cada usuario</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Fuente de Fondos</h2>
            <p>Los usuarios deben proporcionar documentación verificable de la fuente de fondos utilizados para participación, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Extractos bancarios</li>
              <li>Certificados de ingresos laborales</li>
              <li>Documentos de herencia o donación</li>
              <li>Registros de ventas de activos</li>
              <li>Otros documentos relevantes según corresponda</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Listas de Control Sancionadas</h2>
            <p>Mindbliss Power verifica regularmente contra:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lista OFAC (Oficina de Control de Activos Extranjeros - EEUU)</li>
              <li>Listas de la Unión Europea</li>
              <li>Listados de Naciones Unidas</li>
              <li>Listas de países sancionados</li>
              <li>Bases de datos de personas políticamente expuestas (PEP)</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Políticas de Rechazo</h2>
            <p>Mindbliss Power rechazará la participación o suspenderá cuentas de usuarios que:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>No completen verificación KYC</li>
              <li>Proporcionen información falsa o fraudulenta</li>
              <li>Figuren en listas sancionadas</li>
              <li>Sean identificados como personas políticamente expuestas no declaradas</li>
              <li>Muestren patrones de actividad sospechosa</li>
              <li>Incumplan obligaciones de divulgación</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Reportes Obligatorios</h2>
            <p>Mindbliss Power reportará a autoridades competentes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transacciones sospechosas (SAR)</li>
              <li>Transacciones de efectivo sobre umbrales regulatorios</li>
              <li>Actividad potencialmente relacionada con financiamiento del terrorismo</li>
              <li>Cumplimiento de órdenes judiciales y solicitudes regulatorias</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Actualizaciones de Información</h2>
            <p>Los usuarios deben actualizar su información KYC cuando se produzcan cambios materiales, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cambio de domicilio</li>
              <li>Cambio de estado civil o dependientes</li>
              <li>Nuevas ocupaciones o cambios de empleo</li>
              <li>Cambios en situación financiera significativa</li>
              <li>Cambios en nacionalidad o residencia fiscal</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Confidencialidad y Protección de Denunciantes</h2>
            <p>Mindbliss Power mantiene la confidencialidad de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reportes de transacciones sospechosas</li>
              <li>Investigaciones de cumplimiento</li>
              <li>Información de denunciantes internos</li>
              <li>Información sensible relacionada con seguridad</li>
            </ul>
            <p>Los empleados de Mindbliss Power están protegidos por leyes de protección de denunciantes cuando reportan violaciones de AML/KYC.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Capacitación y Cumplimiento Interno</h2>
            <p>Mindbliss Power implementa:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Capacitación regular de AML/KYC para todos los empleados</li>
              <li>Programas de cumplimiento continuo</li>
              <li>Auditorías internas de cumplimiento</li>
              <li>Designación de oficial de cumplimiento dedicado</li>
              <li>Políticas escritas de AML/KYC</li>
            </ul>

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