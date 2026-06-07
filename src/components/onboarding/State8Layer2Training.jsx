import { useState } from 'react';
import { BookOpen, CheckCircle, Loader } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import simulatedApi from '@/api/simulatedApi';

const courses = [
  {
    id: 1,
    title: 'Introducción al sistema',
    desc: 'Aprende cómo funciona Mindbliss Power y sus pilares fundamentales',
    completed: false,
  },
  {
    id: 2,
    title: 'Cómo funciona la estructura',
    desc: 'Comprende el modelo de participación y beneficios',
    completed: false,
  },
  {
    id: 3,
    title: 'Cómo explicar correctamente',
    desc: 'Aprende a comunicar la plataforma con claridad y coherencia',
    completed: false,
  },
  {
    id: 4,
    title: 'Qué no decir',
    desc: 'Evita promesas y expectativas incorrectas',
    completed: false,
  },
];

export default function State8Layer2Training({ userId, onComplete }) {
  const { addNotification } = useNotification();
  const [modules, setModules] = useState(courses);
  const [understanding, setUnderstanding] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleCompleteModule = async (moduleId) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? { ...m, completed: true }
          : m
      )
    );

    addNotification({
      type: 'FORMACION',
      title: 'Progreso actualizado',
      description: 'Has completado un módulo de formación.',
    });

    try {
      await simulatedApi.completeTrainingModule(userId, moduleId);
    } catch (err) {
      console.error(err);
    }
  };

  const allCompleted = modules.every(m => m.completed);

  const handleActivate = async () => {
    if (!understanding || !allCompleted) return;

    setActivating(true);

    addNotification({
      type: 'FORMACION',
      title: 'Formación completada',
      description: 'Ya puedes activar el modo constructor.',
    });

    try {
      await simulatedApi.activateLayer2(userId);
      setTimeout(() => {
        onComplete({ layer: 2, training: true });
      }, 1500);
    } finally {
      setActivating(false);
    }
  };

  const completedCount = modules.filter(m => m.completed).length;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-10 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <BookOpen size={32} style={{ color: '#3b82f6' }} />
        </div>
        <h1 className="font-montserrat font-black text-3xl text-white mb-3">Modo crecimiento activado</h1>
        <p className="text-white/50 text-base">Completa los módulos de formación para desbloquear el sistema completo</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-medium">Progreso</span>
          <span className="text-vicion-electric font-semibold text-sm">{completedCount}/{modules.length}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(completedCount / modules.length) * 100}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
          />
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-4 mb-10">
        {modules.map((course) => (
          <div
            key={course.id}
            className="p-6 rounded-2xl flex items-start gap-4"
            style={{
              background: course.completed ? 'rgba(16,185,129,0.08)' : 'rgba(13,31,60,0.6)',
              border: course.completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: course.completed ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.1)',
              }}
            >
              {course.completed ? (
                <CheckCircle size={20} style={{ color: '#10b981' }} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/30" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={`font-semibold ${course.completed ? 'text-white/70' : 'text-white'}`}>
                {course.title}
              </h3>
              <p className="text-white/50 text-sm mt-1">{course.desc}</p>
            </div>

            {!course.completed && (
              <button
                onClick={() => handleCompleteModule(course.id)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-vicion-electric border border-vicion-electric/50 hover:bg-vicion-electric hover:text-white transition-all whitespace-nowrap"
              >
                Completar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Understanding Checkbox */}
      <div className="p-6 rounded-2xl mb-8" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={understanding}
            onChange={(e) => setUnderstanding(e.target.checked)}
            disabled={!allCompleted}
            className="mt-1"
          />
          <div>
            <p className="text-white font-medium">Confirmo que entiendo el sistema</p>
            <p className="text-white/50 text-sm mt-1">
              He revisado todos los módulos y estoy listo para comenzar como constructor activo
            </p>
          </div>
        </label>
      </div>

      {/* Activate Button */}
      <div className="text-center">
        <button
          onClick={handleActivate}
          disabled={!understanding || !allCompleted || activating}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold font-montserrat transition-all duration-200 text-white"
          style={{
            background:
              !understanding || !allCompleted
                ? 'rgba(59,130,246,0.3)'
                : activating
                ? 'rgba(59,130,246,0.5)'
                : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
            cursor: !understanding || !allCompleted ? 'not-allowed' : 'pointer',
          }}
        >
          {activating ? (
            <>
              <Loader size={18} className="animate-spin" />
              Activando…
            </>
          ) : (
            'Activar modo constructor'
          )}
        </button>
        {!allCompleted && (
          <p className="text-white/50 text-sm mt-4">Completa todos los módulos para continuar</p>
        )}
      </div>
    </div>
  );
}