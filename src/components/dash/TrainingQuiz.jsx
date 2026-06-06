import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '¿Qué es Vicion Power?',
    options: [
      'Una plataforma de membresía estructurada con beneficios y progresión',
      'Una inversión garantizada con retornos fijos',
      'Un esquema para ganar dinero rápido',
      'Un sistema de depósitos y retiros'
    ],
    correct: 0,
  },
  {
    id: 2,
    question: '¿Cuál de estas frases está PROHIBIDA?',
    options: [
      'Puedes acceder a beneficios dentro del tiempo',
      'Esto te garantiza ingresos pasivos',
      'El sistema reconoce tu actividad',
      'Puedes construir dentro de la estructura'
    ],
    correct: 1,
  },
  {
    id: 3,
    question: '¿Cómo debes explicar el Care Plan?',
    options: [
      'Como una inversión con retorno seguro',
      'Como un sistema donde tu participación te permite acceder a beneficios dentro del tiempo',
      'Como dinero fácil sin hacer nada',
      'Como una duplicación de capital'
    ],
    correct: 1,
  },
  {
    id: 4,
    question: '¿Qué significa "comunicación responsable"?',
    options: [
      'Prometer lo que no puedes garantizar',
      'Presentar la plataforma con honestidad sin exagerar',
      'Inventar beneficios para convencer',
      'Presionar a la gente a participar'
    ],
    correct: 1,
  },
];

export default function TrainingQuiz({ onPass }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const question = QUIZ_QUESTIONS[current];
  const answered = answers[question.id];
  const allAnswered = Object.keys(answers).length === QUIZ_QUESTIONS.length;
  
  const handleAnswer = (idx) => {
    setAnswers(prev => ({ ...prev, [question.id]: idx }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  if (showResults) {
    const correctCount = QUIZ_QUESTIONS.filter(q => answers[q.id] === q.correct).length;
    const passed = correctCount >= 3;

    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl text-center" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex justify-center mb-6">
          {passed ? (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle size={32} style={{ color: '#10b981' }} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <XCircle size={32} style={{ color: '#ef4444' }} />
            </div>
          )}
        </div>

        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 12 }}>
          {passed ? '¡Validación completada!' : 'Necesitas revisar los conceptos'}
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 20 }}>
          Respondiste correctamente {correctCount} de {QUIZ_QUESTIONS.length} preguntas
        </p>

        {!passed && (
          <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 24, fontStyle: 'italic' }}>
            Por favor, revisa los módulos 1-5 y vuelve a intentar.
          </p>
        )}

        <button
          onClick={() => {
            if (passed) {
              onPass();
            } else {
              setShowResults(false);
              setCurrent(0);
              setAnswers({});
            }
          }}
          style={{
            background: passed ? 'linear-gradient(135deg,#10b981,#34d399)' : 'rgba(59,130,246,0.15)',
            color: passed ? 'white' : '#3b82f6',
            padding: '12px 28px',
            borderRadius: 10,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Montserrat,sans-serif',
          }}
        >
          {passed ? 'Activar sistema de referidos →' : 'Reintentar prueba'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
          VALIDACIÓN DE CONCEPTOS
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
          Prueba de comprensión
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Debes pasar esta validación para desbloquear el sistema de referidos. {current + 1} de {QUIZ_QUESTIONS.length}
        </p>
      </div>

      <div className="p-8 rounded-2xl mb-6" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: answered === i ? '2px solid rgba(59,130,246,0.6)' : '1px solid rgba(59,130,246,0.2)',
                background: answered === i ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 14,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: answered === i ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {answered === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
            fontWeight: 600,
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            opacity: current === 0 ? 0.5 : 1,
          }}
        >
          Atrás
        </button>

        {current < QUIZ_QUESTIONS.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            disabled={!answered}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: answered ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: answered ? '#3b82f6' : 'rgba(255,255,255,0.3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: answered ? 'pointer' : 'not-allowed',
            }}
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: allAnswered ? 'linear-gradient(135deg,#1d6ef5,#3b82f6)' : 'rgba(255,255,255,0.03)',
              color: allAnswered ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              fontFamily: 'Montserrat,sans-serif',
            }}
          >
            Enviar prueba →
          </button>
        )}
      </div>
    </div>
  );
}