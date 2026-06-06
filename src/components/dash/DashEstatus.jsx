import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStatus } from '@/hooks/useStatus';
import StatusBadge from './StatusBadge';
import { CheckCircle, ArrowRight, TrendingUp, Calendar, BookOpen, Shield as ShieldIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function DashEstatus({ user }) {
  const { user: authUser } = useAuth();
  const mockUserData = {
    accountAgeInDays: 45,
    emailVerified: true,
    isActivated: true,
    trainingModulesCompleted: 3,
    currentLayer: 1,
    monthsSinceActivation: 2,
    profileComplete: true,
    hasUsedBenefits: true,
    activeDirects: 3,
    complianceScore: 4,
    accountCreatedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    emailVerifiedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    trainingStartedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    trainingCompletedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [],
  };

  const { status, score, statusInfo, nextTarget, progress, timeline, benefits } = useStatus(mockUserData);

  if (!status || !statusInfo) {
    return <div className="text-white/50 text-center py-12">Cargando estatus...</div>;
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-4">Tu Identidad</p>
        <h1 className="font-montserrat font-black text-4xl sm:text-5xl text-white mb-4">Tu Estatus dentro de Vicion Power</h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Visualiza tu evolución, reputación y progreso dentro del ecosistema.
        </p>
      </motion.div>

      {/* MAIN BADGE + SCORE SECTION */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
      >
        {/* Badge */}
        <div className="flex items-center justify-center p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <StatusBadge status={statusInfo} size="xlarge" interactive={true} />
        </div>

        {/* Score Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-8 rounded-2xl flex flex-col justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <div className="mb-6">
            <div className="text-white/60 text-sm font-montserrat font-bold tracking-[0.2em] uppercase mb-3">Puntuación de Reputación</div>
            <div className="flex items-baseline gap-2">
              <div className="font-montserrat font-black text-5xl text-white">{score}</div>
              <div className="text-white/40 text-lg">/100</div>
            </div>
          </div>

          <div className="w-full bg-white/5 rounded-full h-2 mb-6 overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${statusInfo.color}, ${statusInfo.color}dd)` }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Siguiente estatus:</span>
              <span className="text-white font-semibold text-sm">{nextTarget.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Te faltan:</span>
              <span className="text-vicion-electric font-bold text-sm">{nextTarget.remaining} puntos</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* PRESTIGE CARD */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.3 }}
        className="p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(29,110,245,0.15), rgba(96,165,250,0.08))', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <h2 className="font-montserrat font-bold text-2xl text-white mb-8">Perfil Actual</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Estatus', value: statusInfo.name, icon: ShieldIcon },
            { label: 'Días activo', value: `${mockUserData.accountAgeInDays}`, icon: Calendar },
            { label: 'Módulos completados', value: mockUserData.trainingModulesCompleted, icon: BookOpen },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              className="p-5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${statusInfo.color}20` }}>
                  <item.icon size={18} style={{ color: statusInfo.color }} />
                </div>
                <div>
                  <div className="text-white/50 text-xs font-montserrat tracking-wider uppercase mb-1">{item.label}</div>
                  <div className="text-white font-bold text-lg">{item.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verification badges */}
        <div className="space-y-3">
          {[
            { label: 'Participación verificada', active: true },
            { label: 'Correo verificado', active: mockUserData.emailVerified },
            { label: 'Perfil completo', active: mockUserData.profileComplete },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.active ? 'bg-green-500/30 border border-green-500/50' : 'bg-white/10 border border-white/20'}`}>
                {item.active && <CheckCircle size={14} className="text-green-400" />}
              </div>
              <span className={item.active ? 'text-white/80 text-sm' : 'text-white/40 text-sm line-through'}>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* BENEFITS SECTION */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.4 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <h2 className="font-montserrat font-bold text-2xl text-white mb-6">Ventajas de tu estatus</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
              className="p-4 rounded-xl flex items-start gap-3"
              style={{ background: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}40` }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: statusInfo.color }}>
                <CheckCircle size={12} className="text-white" />
              </div>
              <span className="text-white/80 text-sm">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* PROGRESS TO NEXT STATUS */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.5 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <h2 className="font-montserrat font-bold text-2xl text-white mb-6">Tu avance hacia el siguiente estatus</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm">Progreso hacia <strong>{nextTarget.name}</strong></span>
              <span className="text-vicion-electric font-bold text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #3b82f6, #60a5fa)` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p className="text-white/70 text-sm leading-relaxed">
              Te faltan <strong>{nextTarget.remaining} puntos</strong> para alcanzar el estatus de <strong>{nextTarget.name}</strong>. Completa más módulos de formación, mantén tu participación constante y mejora tu perfil.
            </p>
          </div>
        </div>
      </motion.div>

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.6 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <h2 className="font-montserrat font-bold text-2xl text-white mb-8">Historial de evolución</h2>

          <div className="space-y-4">
            {timeline.map((event, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: 0.7 + i * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-vicion-electric/30 border border-vicion-electric/50">
                  <CheckCircle size={14} className="text-vicion-electric" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 text-sm font-semibold">{event.label}</div>
                  <div className="text-white/40 text-xs mt-1">{new Date(event.date).toLocaleDateString('es-ES')}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, delay: 0.7 }}
        className="text-center py-8"
      >
        <button
          className="inline-flex items-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30"
        >
          {mockUserData.currentLayer === 1
            ? 'Fortalecer mi perfil'
            : mockUserData.currentLayer === 2
            ? 'Completar formación y avanzar'
            : 'Seguir creciendo dentro del sistema'}
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}