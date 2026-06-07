import { useState } from 'react';
import { CheckCircle, AlertTriangle, Users, MessageCircle, BookOpen, Target, ShieldCheck } from 'lucide-react';
import TrainingQuiz from './TrainingQuiz';

const modules = [
  {
    id: 'intro',
    icon: BookOpen,
    title: '1. Introducción',
    content: 'Bienvenido al proceso de formación de Mindbliss Power. Este módulo te dará una visión completa del ecosistema: su estructura, su propósito y cómo funciona la participación dentro del sistema.',
  },
  {
    id: 'how',
    icon: Target,
    title: '2. Cómo funciona',
    content: 'Mindbliss Power es una plataforma de membresía estructurada. Los miembros acceden a beneficios, herramientas y progresión según su nivel de participación. El sistema reconoce la actividad, no promete resultados.',
  },
  {
    id: 'nono',
    icon: AlertTriangle,
    title: '3. Qué NO decir',
    content: null,
    isWarning: true,
    prohibited: [
      'Prometer retornos o ganancias garantizadas',
      'Presentar la plataforma como una inversión',
      'Generar expectativas económicas irreales',
      'Usar términos como "dinero fácil" o "ingresos pasivos garantizados"',
      'Comparar con esquemas financieros o piramidales',
    ],
    reminder: 'La comunicación debe ser clara y responsable.',
  },
  {
    id: 'invite',
    icon: Users,
    title: '4. Cómo invitar',
    content: 'Invitar correctamente es presentar la plataforma con honestidad. Comparte lo que has vivido tú mismo: el acceso, la comunidad y la estructura. Nunca exageres ni prometas lo que no puedes garantizar. El sistema se explica solo cuando se presenta bien.',
  },
  {
    id: 'explain',
    icon: MessageCircle,
    title: '5. Cómo explicar',
    content: 'Explica la plataforma en tres pasos: (1) Qué es — una membresía estructurada con beneficios y progresión. (2) Cómo funciona — participación activa, comunidad y herramientas. (3) Para quién es — personas que buscan orden, desarrollo y crecimiento real.',
  },
  {
    id: 'close',
    icon: CheckCircle,
    title: '6. Cómo cerrar',
    content: 'Cerrar no es presionar. Es acompañar a alguien a tomar una decisión informada. Responde sus dudas con claridad. Si entiende bien el sistema, la decisión de participar es natural.',
  },
  {
    id: 'narrative',
    icon: ShieldCheck,
    title: '7. Cómo explicar Vicion Care Plan',
    content: null,
    isNarrative: true,
    prohibited: [
      'inversión',
      'retorno',
      'duplicación',
    ],
    script: '«Esto no es staking. Es un sistema donde tu participación te permite acceder a beneficios dentro del tiempo. Mientras más te mantienes, más acceso tienes. Y si decides construir, puedes crecer dentro del sistema.»',
    correct: [
      'Mindbliss Power es un sistema de participación estructurada donde puedes acceder a beneficios dentro del tiempo.',
      'Aquí no se trata de ganar rápido.',
      'Se trata de construir acceso a valor dentro de una estructura real.',
    ],
    reminder: 'Todos los agentes deben usar narrativa controlada.',
  },
];

export default function DashTraining({ onComplete }) {
  const [active, setActive] = useState('intro');
  const [understood, setUnderstood] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const current = modules.find(m => m.id === active);

  if (quizStarted) {
    return <TrainingQuiz onPass={onComplete} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 p-6 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 3, fontFamily: 'Montserrat,sans-serif', marginBottom: 4 }}>
          PARTICIPANTE EN FORMACIÓN
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
          Formación y acompañamiento
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
          Completa los 7 módulos, comprende los conceptos y pasa la validación para desbloquear sistema de referidos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module list */}
        <div className="flex flex-col gap-2">
          {modules.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{
                background: active === m.id ? 'linear-gradient(135deg,rgba(29,110,245,0.25),rgba(59,130,246,0.15))' : 'rgba(255,255,255,0.03)',
                border: active === m.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: active === m.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              <m.icon size={15} style={{ color: active === m.id ? '#3b82f6' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: active === m.id ? 600 : 400 }}>{m.title}</span>
            </button>
          ))}
        </div>

        {/* Module content */}
        <div className="lg:col-span-2">
          <div className="p-7 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)' }}>
                <current.icon size={18} style={{ color: '#3b82f6' }} />
              </div>
              <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 18 }}>{current.title}</h3>
            </div>

            {current.isWarning ? (
              <div>
                <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                    Para mantener la integridad del sistema, <strong style={{ color: 'white' }}>NO está permitido:</strong>
                  </p>
                  <div className="flex flex-col gap-2">
                    {current.prohibited.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#ef4444' }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, fontStyle: 'italic' }}>
                  "{current.reminder}"
                </p>
              </div>
            ) : current.isNarrative ? (
              <div>
                <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>NO DECIR</p>
                  <div className="flex flex-wrap gap-2">
                    {current.prohibited.map((item, i) => (
                      <span key={i} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '3px 10px', borderRadius: 6 }}>{item}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>SÍ DECIR</p>
                  <div className="flex flex-col gap-2">
                    {current.correct.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#3b82f6' }} />
                        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>SCRIPT DE REFERENCIA</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.8, fontStyle: 'italic' }}>{current.script}</p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 14, fontWeight: 600 }}>
                  🛡️ {current.reminder}
                </p>
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.8 }}>{current.content}</p>
            )}
          </div>

          {/* Support block */}
          <div className="mt-4 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>TU ACOMPAÑAMIENTO</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)' }}>L</div>
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Tu líder asignado</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Disponible por WhatsApp y Email</p>
              </div>
            </div>
          </div>

          {/* Final step */}
          <div className="mt-6 p-6 rounded-2xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)}
                className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0" />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
                He comprendido el funcionamiento del sistema y me comprometo a comunicarlo de forma clara y responsable.
              </span>
            </label>
            <button
              disabled={!understood}
              onClick={() => setQuizStarted(true)}
              className="w-full py-3 rounded-xl font-bold font-montserrat text-sm transition-all duration-200"
              style={{
                background: understood ? 'linear-gradient(135deg,#1d6ef5,#3b82f6)' : 'rgba(255,255,255,0.06)',
                color: understood ? 'white' : 'rgba(255,255,255,0.3)',
                cursor: understood ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}>
              Pasar validación →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}