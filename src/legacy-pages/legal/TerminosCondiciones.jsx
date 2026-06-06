import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function TerminosCondiciones() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-vicion-deep to-vicion-navy py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-4xl sm:text-5xl mb-4">
            Términos y Condiciones
          </motion.h1>
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

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Definiciones</h2>
            <p><strong>"Plataforma":</strong> La aplicación web y servicios digitales operados por Vicion Power.</p>
            <p><strong>"Usuario":</strong> Cualquier persona que accede y utiliza la Plataforma.</p>
            <p><strong>"Participación":</strong> La activación formal dentro del ecosistema mediante la aceptación de estos términos y la realización de una activación inicial.</p>
            <p><strong>"Servicios":</strong> Todos los servicios, herramientas, beneficios y acceso proporcionados a través de la Plataforma.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Elegibilidad</h2>
            <p>Para utilizar la Plataforma y acceder a los Servicios, debes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tener al menos 18 años de edad o ser mayor de edad en tu jurisdicción</li>
              <li>Tener capacidad legal para celebrar un contrato vinculante</li>
              <li>No estar restringido por ninguna ley o regulación en tu jurisdicción</li>
              <li>Proporcionar información precisa y completa en tu registro</li>
              <li>Mantener actualizada tu información en todo momento</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Registro de Cuenta</h2>
            <p>Al registrarte en la Plataforma, eres responsable de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>Notificar inmediatamente a Vicion Power de cualquier acceso no autorizado</li>
              <li>Ser responsable de toda actividad en tu cuenta</li>
              <li>Proporcionar información exacta y actualizada</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Participación Inicial</h2>
            <p>La Participación requiere:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aceptación formal de todos los términos y divulgaciones legales</li>
              <li>Realización de una activación inicial mediante pago o instrumento equivalente</li>
              <li>Cumplimiento de procedimientos de verificación de identidad (KYC/AML)</li>
              <li>Confirmación de comprensión de riesgos y naturaleza del sistema</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Naturaleza No Garantizada de Beneficios</h2>
            <p>Los usuarios reconocen y aceptan que:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los beneficios proyectados no están garantizados y dependen del desarrollo del ecosistema</li>
              <li>Los ingresos, acceso a servicios y cualquier retorno dependen de la continuidad y performance del sistema</li>
              <li>Vicion Power no ofrece garantía de capital, retorno o protección de inversión</li>
              <li>Los escenarios simulados son proyecciones basadas en supuestos que pueden no realizarse</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Obligaciones del Usuario</h2>
            <p>Al participar, los usuarios se comprometen a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilizar la Plataforma solo con propósitos legítimos</li>
              <li>No interferir con la operación de la Plataforma</li>
              <li>Respetar la privacidad y derechos de otros usuarios</li>
              <li>Cumplir con todas las regulaciones aplicables</li>
              <li>No intentar acceso no autorizado a sistemas</li>
              <li>Reportar conducta inapropiada de otros usuarios</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Cambios en Servicios y Términos</h2>
            <p>Vicion Power se reserva el derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modificar, suspender o discontinuar Servicios en cualquier momento</li>
              <li>Cambiar los términos de participación con notificación previa</li>
              <li>Actualizar características y funcionalidades</li>
              <li>Ajustar la estructura de beneficios conforme evolucionas</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Responsabilidad Limitada</h2>
            <p>Vicion Power no será responsable por:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pérdida de ingresos, datos o información personal</li>
              <li>Daños consecuentes, indirectos o punitivos</li>
              <li>Rendimiento del ecosistema o variación en beneficios</li>
              <li>Cualquier causa fuera del control razonable de Vicion Power</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Terminación de Participación</h2>
            <p>Vicion Power se reserva el derecho de terminar la Participación de un usuario:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Por violación de estos términos</li>
              <li>Por conducta fraudulenta o ilegal</li>
              <li>Por incumplimiento de obligaciones</li>
              <li>Por razones de cumplimiento regulatorio</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Ley Aplicable</h2>
            <p>Estos Términos y Condiciones se rigen por la ley aplicable en el contexto de operación de Vicion Power. Cualquier disputa será resuelta conforme a la ley competente.</p>

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