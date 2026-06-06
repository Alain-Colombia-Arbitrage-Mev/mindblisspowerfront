import { ChevronLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingTopBar({ currentStep, totalSteps, onBack, onExit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-vicion-blue font-semibold transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Volver
          </button>

          {/* Center: Breadcrumb */}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">
              Paso {currentStep} de {totalSteps}
            </p>
          </div>

          {/* Right: Exit button */}
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group">
            Salir
            <X size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}