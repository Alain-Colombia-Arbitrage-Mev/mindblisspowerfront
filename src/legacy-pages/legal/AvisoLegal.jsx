import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AvisoLegal() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-vicion-deep to-vicion-navy py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-4xl sm:text-5xl mb-4">
            Aviso Legal
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

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Identificación y Naturaleza</h2>
            <p>Vicion Power es una plataforma digital diseñada para la participación en un ecosistema de servicios financieros, educativos y de desarrollo comunitario. La plataforma es operada bajo regulaciones internacionales y se adhiere a estándares de transparencia, protección de datos y cumplimiento normativo.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Aceptación de Términos</h2>
            <p>Al acceder y utilizar la plataforma Vicion Power, aceptas integralmente este aviso legal y todos los términos, condiciones y políticas asociadas. Si no estás de acuerdo con alguna parte, no debes utilizar la plataforma.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Uso Permitido y Restricciones</h2>
            <p>La plataforma está destinada exclusivamente a uso legítimo y legal. Los usuarios se comprometen a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>No utilizar la plataforma para actividades ilegales o fraudulentas</li>
              <li>No acceder sin autorización a sistemas o datos de terceros</li>
              <li>No distribuir malware o contenido nocivo</li>
              <li>No interferir con la operación normal de la plataforma</li>
              <li>Cumplir con todas las leyes aplicables en su jurisdicción</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Propiedad Intelectual</h2>
            <p>Todo el contenido de la plataforma, incluyendo texto, gráficos, logos, imágenes, software y bases de datos, es propiedad de Vicion Power o sus proveedores autorizados. Los derechos de autor y otras leyes de propiedad intelectual protegen este contenido. Sin la autorización expresa escrita de Vicion Power, los usuarios no pueden reproducir, distribuir, modificar o transmitir cualquier material de la plataforma.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Limitación de Responsabilidad</h2>
            <p>Vicion Power proporciona la plataforma "tal como está" sin garantías de ningún tipo, ni expresas ni implícitas. En la medida máxima permitida por la ley, Vicion Power no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos derivados de:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>El uso o la imposibilidad de usar la plataforma</li>
              <li>Pérdida de datos o información</li>
              <li>Acceso no autorizado a información del usuario</li>
              <li>Errores o defectos en la plataforma</li>
              <li>Cualquier contenido de terceros accesible a través de la plataforma</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Disponibilidad de Servicios</h2>
            <p>Aunque Vicion Power se esfuerza por mantener la plataforma disponible continuamente, no puede garantizar una disponibilidad sin interrupciones. La plataforma puede estar temporalmente indisponible debido a mantenimiento, actualizaciones o circunstancias fuera del control de Vicion Power. Vicion Power no será responsable por tales interrupciones.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Modificaciones de Términos</h2>
            <p>Vicion Power se reserva el derecho de modificar este aviso legal en cualquier momento. Los cambios se publicarán en la plataforma con una fecha de actualización. El uso continuado de la plataforma después de tales cambios constituye aceptación de los términos modificados.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Terminación de Acceso</h2>
            <p>Vicion Power se reserva el derecho de suspender o terminar el acceso de cualquier usuario a la plataforma sin previo aviso, por cualquier razón, incluyendo violación de estos términos o conducta que Vicion Power considere inapropiada.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Ley Aplicable y Jurisdicción</h2>
            <p>Este aviso legal se rige por las leyes aplicables en el contexto de operación de Vicion Power. Cualquier disputa relacionada con la plataforma será resuelta conforme a la ley competente y los procedimientos establecidos.</p>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Contacto</h2>
            <p>Para preguntas sobre este aviso legal o la plataforma, contacta a nuestro equipo de cumplimiento a través de los canales oficiales de Vicion Power.</p>

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