import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function CodigoConducta() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-vicion-deep to-vicion-navy py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-4xl sm:text-5xl mb-4">
            Código de Conducta
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

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">1. Principios Fundamentales</h2>
            <p>El Código de Conducta de Mindbliss Power se fundamenta en estos principios:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Integridad:</strong> Actúa con honestidad y transparencia en todas las interacciones</li>
              <li><strong>Responsabilidad:</strong> Asume responsabilidad por tus acciones y decisiones</li>
              <li><strong>Respeto:</strong> Trata a otros con dignidad y consideración</li>
              <li><strong>Cumplimiento:</strong> Adhiere a todas las leyes, regulaciones y políticas</li>
              <li><strong>Diligencia:</strong> Realiza tu trabajo de manera profesional y dedicada</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">2. Comunicación Responsable</h2>
            <p>Los participantes deben comunicar sobre Mindbliss Power de manera responsable:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Veracidad:</strong> Proporciona información precisa y verificable sobre el ecosistema</li>
              <li><strong>No Exageración:</strong> No prometas resultados garantizados ni insinúes ganancias seguras</li>
              <li><strong>Contexto Completo:</strong> Presenta la información con contexto adecuado incluyendo riesgos</li>
              <li><strong>Fuentes Oficiales:</strong> Utiliza materiales oficiales de Mindbliss Power cuando hables del ecosistema</li>
              <li><strong>Prohibición de Falsedad:</strong> Nunca hagas afirmaciones falsas o engañosas</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">3. Respeto por Información Oficial</h2>
            <p>Todos los participantes deben:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reconocer a Mindbliss Power como la única fuente autorizada de información oficial</li>
              <li>No producir ni distribuir información sobre el ecosistema que no esté aprobada</li>
              <li>Respetar actualizaciones y comunicaciones oficiales</li>
              <li>Corregir información incorrecta si la esparcen o la ven esparcida</li>
              <li>Contactar a equipo de comunicaciones si tienes dudas sobre qué es apropiado compartir</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">4. Coexistencia Material</h2>
            <p>Cuando comuniques sobre Mindbliss Power:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Asegúrate de que todos los materiales sean precisos y coherentes con comunicaciones oficiales</li>
              <li>Si creas presentaciones, usa marcas registradas correctamente</li>
              <li>Mantén consistencia en mensajes clave</li>
              <li>No modifiques materiales oficiales sin autorización</li>
              <li>Verifica información antes de compartirla con otros</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">5. Conducta Dentro del Ecosistema</h2>
            <p>Los participantes deben mantener conducta profesional y ética:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trata a otros participantes con respeto y consideración</li>
              <li>No hagas afirmaciones discriminatorias o acosadoras</li>
              <li>Resuelve conflictos de manera profesional</li>
              <li>Reporta conducta inapropiada a los canales designados</li>
              <li>Participa activamente en cumplimiento y mejora del ecosistema</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">6. Conflicto de Intereses</h2>
            <p>Los participantes deben:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Divulgar conflictos de intereses relevantes</li>
              <li>Recusarse de decisiones donde exista conflicto</li>
              <li>No utilizar información de Mindbliss Power para beneficio personal indebido</li>
              <li>Mantener objetividad en evaluaciones de participantes o programas</li>
              <li>No permitir que intereses personales comprometan juicio profesional</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">7. Confidencialidad y Datos</h2>
            <p>Los participantes deben proteger:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Información personal de otros participantes</li>
              <li>Datos financieros y de transacciones</li>
              <li>Información de negocios confidencial de Mindbliss Power</li>
              <li>Estrategias de desarrollo no publicadas</li>
              <li>Credenciales de acceso propias y de otros</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">8. Prohibiciones Explícitas</h2>
            <p>Se prohíben categóricamente las siguientes conductas:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fraude:</strong> No falsifiques información o realices transacciones engañosas</li>
              <li><strong>Manipulación:</strong> No intentes manipular a otros para participación</li>
              <li><strong>Discriminación:</strong> No hagas discriminación basada en raza, género, religión, etc.</li>
              <li><strong>Acoso:</strong> No hostigues, intimides o acooses a otros participantes</li>
              <li><strong>Ilegalidad:</strong> No utilices el ecosistema para actividades ilegales</li>
              <li><strong>Cibercrimen:</strong> No intentes acceso no autorizado o robo de datos</li>
              <li><strong>Lavado de Dinero:</strong> No participes en blanqueo de capitales</li>
              <li><strong>Financiamiento del Terrorismo:</strong> No proporciones fondos para actividades terroristas</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">9. Reportes y Denuncias</h2>
            <p>Mindbliss Power alienta el reporte de conducta inapropiada:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reporta violaciones a través de canales designados</li>
              <li>Los reportes se investigarán de manera confidencial</li>
              <li>Protección contra represalias por reportes de buena fe</li>
              <li>Mantén evidencia de conducta inapropiada si es seguro hacerlo</li>
              <li>No intentes resolver grave conducta unilateralmente</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">10. Sanciones por Incumplimiento</h2>
            <p>El incumplimiento del Código de Conducta puede resultar en:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Advertencia formal</li>
              <li>Restricción de privilegios dentro del ecosistema</li>
              <li>Suspensión temporal de cuenta</li>
              <li>Terminación permanente de participación</li>
              <li>Pérdida de beneficios acumulados</li>
              <li>Referral a autoridades legales para conducta criminal</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">11. Educación y Conciencia</h2>
            <p>Mindbliss Power proporciona:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Capacitación regular sobre este Código de Conducta</li>
              <li>Actualizaciones sobre cambios en políticas</li>
              <li>Recursos para entender expectativas de conducta</li>
              <li>Canales para preguntas sobre conducta apropiada</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">12. Aplicación del Código</h2>
            <p>Este Código se aplica a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Todos los participantes activos</li>
              <li>Empleados y contratistas de Mindbliss Power</li>
              <li>Comunicaciones públicas sobre el ecosistema</li>
              <li>Interacciones dentro de canales de Mindbliss Power</li>
              <li>Actividades privadas que afecten la reputación del ecosistema</li>
            </ul>

            <h2 className="font-montserrat font-bold text-3xl text-vicion-deep mt-12 mb-6">13. Enmiendas</h2>
            <p>Mindbliss Power se reserva el derecho de enmendar este Código de Conducta en cualquier momento. Los cambios serán comunicados oficialmente. La continuación de participación constituye aceptación de cambios.</p>

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