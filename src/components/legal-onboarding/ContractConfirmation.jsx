import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function ContractConfirmation({ onNext, onBack, participationLevel, selectedScenario }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7 }}
        variants={fadeUp} className="max-w-2xl w-full">
        
        <h1 className="font-montserrat font-black text-5xl text-vicion-deep mb-8">
          Confirmación final
        </h1>

        <div className="space-y-6 mb-12">
          {/* Plan details */}
          <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="p-6 rounded-2xl bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 border border-vicion-blue/20">
            <p className="text-xs text-vicion-blue font-bold uppercase tracking-wider mb-4">Resumen de activación</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Plan seleccionado</p>
                <p className="text-lg text-vicion-deep font-bold">{participationLevel || 'Standard'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Escenario</p>
                <p className="text-lg text-vicion-deep font-bold">{selectedScenario || 'Conservador'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Permanencia</p>
                <p className="text-lg text-vicion-deep font-bold">Indefinida</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1">Estado legal</p>
                <p className="text-lg text-green-600 font-bold flex items-center gap-2">
                  <CheckCircle size={20} /> Aceptado
                </p>
              </div>
            </div>
          </motion.div>

          {/* Legal confirmation */}
          <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.15 }}
            variants={fadeUp} className="p-6 rounded-2xl bg-green-50 border border-green-100">
            <div className="flex gap-4">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 mb-2">Contrato aceptado</p>
                <p className="text-sm text-green-800">Has aceptado el Acuerdo de Participación y todas sus condiciones. Puedes proceder a confirmar tu participación.</p>
              </div>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div initial="hidden" animate="visible" transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              Estás a punto de <span className="font-semibold">activar tu participación</span> dentro del ecosistema Mindbliss Power. 
              Después de este paso, recibirás un contrato firmado en tu email y acceso al simulador avanzado.
            </p>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Atrás
          </button>
          <button
            onClick={onNext}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
            Proceder al pago <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}