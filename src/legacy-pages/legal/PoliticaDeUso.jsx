import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function PoliticaDeUso() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(ellipse at 75% 40%, rgba(59,130,246,0.55) 0%, transparent 60%)'
        }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            Política de Uso
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 leading-relaxed max-w-3xl mx-auto">
            Directrices de conducta y uso responsable de la plataforma Mindbliss Power.
          </motion.p>
        </div>
      </section>

      {/* ══ CONTENIDO LEGAL ═════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-vicion-deep mb-4">1. Aceptación de Términos</h2>
              <p className="text-gray-700 leading-relaxed">
                Al acceder y utilizar la plataforma Mindbliss Power, aceptas esta Política de Uso en su totalidad. Si no estás de acuerdo con alguno de los términos, no debes utilizar la plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-vicion-deep mb-4">2. Conducta de Usuarios</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Los usuarios se comprometen a:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Utilizar la plataforma de manera legal y ética',
                  'Proporcionar información verídica durante el registro',
                  'Respetar la propiedad intelectual de Mindbliss Power',
                  'No interferir con el funcionamiento de la plataforma',
                  'Mantener la confidencialidad de credenciales de acceso',
                  'Cumplir con todas las políticas y normativas internas'
                ].map((item, i) => (
                  <li key={i} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-vicion-deep mb-4">3. Prohibiciones Expresas</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Se prohíbe:
              </p>
              <ul className="space-y-2 ml-6">
                {[
                  'Actividades ilícitas o fraudulentas',
                  'Compartir credenciales de acceso',
                  'Realizar operaciones no autorizadas',
                  'Acosar, intimidar o difamar a otros usuarios',
                  'Publicar contenido ilegal o inapropiado',
                  'Intentar eludir medidas de seguridad'
                ].map((item, i) => (
                  <li key={i} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-vicion-deep mb-4">4. Responsabilidad del Usuario</h2>
              <p className="text-gray-700 leading-relaxed">
                Cada usuario es responsable de sus acciones dentro de la plataforma. Mindbliss Power se reserva el derecho de suspender o terminar cuentas que incumplan esta política.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-vicion-deep mb-4">5. Modificaciones</h2>
              <p className="text-gray-700 leading-relaxed">
                Mindbliss Power se reserva el derecho de modificar esta Política de Uso en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación.
              </p>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ NAVEGACIÓN ══════════════════════════════════════════ */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/compliance"
            className="text-vicion-blue hover:text-blue-600 font-semibold text-sm flex items-center gap-2">
            ← Volver a Cumplimiento
          </Link>
          <Link to="/"
            className="text-vicion-blue hover:text-blue-600 font-semibold text-sm flex items-center gap-2">
            Inicio <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}