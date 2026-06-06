import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const sections = [
  {
    id: 1,
    title: 'Corporate',
    description: 'Estructura corporativa, gobernanza y documentación de la entidad',
    icon: FileText,
    color: 'from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-200/50',
    docs: ['Certificado de constitución', 'Estatutos sociales', 'Junta directiva', 'Accionariado'],
  },
  {
    id: 2,
    title: 'Legal',
    description: 'Marco legal, contratos y acuerdos operativos',
    icon: FileText,
    color: 'from-slate-500/10 to-slate-600/5',
    borderColor: 'border-slate-200/50',
    docs: ['Términos y condiciones', 'Política de privacidad', 'Aviso legal', 'Código de conducta'],
  },
  {
    id: 3,
    title: 'Compliance',
    description: 'AML/KYC, cumplimiento normativo y procedimientos internos',
    icon: Lock,
    color: 'from-green-500/10 to-green-600/5',
    borderColor: 'border-green-200/50',
    docs: ['AML/KYC policy', 'Diligencia debida', 'Reportes de cumplimiento', 'Auditorías internas'],
  },
  {
    id: 4,
    title: 'Business Model',
    description: 'Descripción del modelo operativo y estructura de incentivos',
    icon: FileText,
    color: 'from-purple-500/10 to-purple-600/5',
    borderColor: 'border-purple-200/50',
    docs: ['Descripción del ecosistema', 'Care Plan', 'Estructura de beneficios', 'Flujos operativos'],
  },
  {
    id: 5,
    title: 'Financial Overview',
    description: 'Visión financiera, proyecciones y estado operativo',
    icon: FileText,
    color: 'from-amber-500/10 to-amber-600/5',
    borderColor: 'border-amber-200/50',
    docs: ['Resumen financiero', 'Proyecciones', 'Capacidad operativa', 'Estado actual'],
  },
];

export default function DataRoom() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6 }}
          variants={fadeUp}
          className="mb-16">
          <h1 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-4">
            Data Room
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Documentación institucional y acceso a información operativa del ecosistema Vicion Power.
          </p>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Para instituciones financieras, auditores y usuarios calificados.
          </p>
        </motion.div>

        {/* Sections Grid */}
        <div className="space-y-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            const isExpanded = expandedId === section.id;

            return (
              <motion.div
                key={section.id}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                variants={fadeUp}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  className={`
                    cursor-pointer rounded-xl p-6 transition-all duration-300
                    border ${section.borderColor}
                    bg-gradient-to-br ${section.color}
                    hover:shadow-md hover:border-opacity-100
                  `}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                        ${section.color} border ${section.borderColor}
                      `}>
                        <Icon size={24} className="text-vicion-deep" />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-1">
                          {String(section.id).padStart(2, '0')} {section.title}
                        </h3>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}>
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-gray-200/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {section.docs.map((doc, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/40 hover:bg-white/60 transition-colors cursor-pointer group">
                            <FileText size={16} className="text-vicion-blue flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            <span className="text-sm font-medium text-gray-700">{doc}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          variants={fadeUp}
          className="mt-16 p-6 rounded-xl border border-gray-200 bg-gray-50/50">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-vicion-deep">Acceso restringido:</span> Esta sección está diseñada para instituciones financieras, auditores y usuarios institucionales calificados. La documentación refleja el estado operativo actual del ecosistema Vicion Power bajo estándares de cumplimiento internacional.
          </p>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          variants={fadeUp}
          className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-vicion-blue font-semibold hover:gap-3 transition-all">
            ← Volver a inicio
          </Link>
        </motion.div>
      </div>
    </div>
  );
}