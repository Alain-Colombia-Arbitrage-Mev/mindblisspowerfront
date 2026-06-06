import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Privacidad() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-vicion-deep to-vicion-navy py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-4xl sm:text-5xl mb-4">
            Política de Privacidad
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

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Introducción</h2>
            <p>Vicion Power está comprometida con la protección de tu privacidad. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos tu información personal cuando utilizas la Plataforma.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Información que Recopilamos</h2>
            <p><strong>Información de Registro:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Información de identificación (pasaporte, cédula, etc.)</li>
              <li>Información de dirección</li>
              <li>Información bancaria o de pago</li>
            </ul>

            <p><strong>Información de Navegación:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Páginas visitadas y tiempo de permanencia</li>
              <li>Historial de clics y navegación</li>
              <li>Información de geolocalización</li>
            </ul>

            <p><strong>Información de Participación:</strong></p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nivel de participación seleccionado</li>
              <li>Historial de transacciones</li>
              <li>Comunicaciones con el equipo de soporte</li>
              <li>Datos de desempeño dentro del ecosistema</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Uso de Información</h2>
            <p>Utilizamos tu información para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Crear y mantener tu cuenta</li>
              <li>Procesar transacciones y pagos</li>
              <li>Proporcionar soporte técnico y de servicio al cliente</li>
              <li>Verificar identidad y cumplir con regulaciones KYC/AML</li>
              <li>Enviar comunicaciones sobre tu cuenta y servicios</li>
              <li>Mejorar la Plataforma y personalizarla para ti</li>
              <li>Detectar y prevenir fraude</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Protección de Datos</h2>
            <p>Vicion Power implementa medidas de seguridad técnicas y administrativas para proteger tu información, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Acceso restringido a información personal</li>
              <li>Auditorías de seguridad regulares</li>
              <li>Protocolos de autenticación robustos</li>
              <li>Monitoreo de acceso no autorizado</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Compartir Información</h2>
            <p>Vicion Power puede compartir tu información con:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proveedores de servicios que nos ayudan a operar la Plataforma</li>
              <li>Autoridades regulatorias cuando sea requerido por ley</li>
              <li>Proveedores de pago y procesadores de transacciones</li>
              <li>Partes relacionadas dentro del ecosistema Vicion</li>
              <li>Otros usuarios, únicamente cuando sea necesario para el funcionamiento del ecosistema</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Cookies y Tecnologías de Rastreo</h2>
            <p>La Plataforma utiliza cookies y tecnologías similares para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mantener tu sesión de usuario</li>
              <li>Recordar preferencias</li>
              <li>Analizar el uso de la Plataforma</li>
              <li>Personalizar tu experiencia</li>
            </ul>
            <p>Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la Plataforma.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Retención de Datos</h2>
            <p>Retenemos tu información personal mientras tu cuenta esté activa y según sea requerido por ley. Después de la terminación de tu participación, retenemos información relevante para cumplir con obligaciones legales, regulatorias y de auditoría.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a tu información personal</li>
              <li>Corregir información inexacta</li>
              <li>Solicitar eliminación de tu información (sujeto a obligaciones legales)</li>
              <li>Restringir el procesamiento de tu información</li>
              <li>Portabilidad de datos</li>
              <li>Revocar consentimiento en cualquier momento</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Privacidad de Menores</h2>
            <p>La Plataforma no está dirigida a menores de 18 años. Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente. Los padres o tutores que crean que su menor ha proporcionado información deben contactarnos inmediatamente.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Cambios en esta Política</h2>
            <p>Vicion Power se reserva el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios serán publicados con una fecha de última actualización. Tu uso continuado de la Plataforma después de cambios constituye aceptación de la política actualizada.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">11. Contacto</h2>
            <p>Para preguntas sobre privacidad o para ejercer tus derechos, contacta a nuestro equipo de protección de datos a través de los canales oficiales de Vicion Power.</p>

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