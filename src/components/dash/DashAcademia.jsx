import { useState } from 'react';
import { BookOpen, CheckCircle, Lock, Play, Star, Award, ChevronRight } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: 'Introducción a Mindbliss Power',
    desc: 'Comprende el sistema desde sus bases.',
    color: '#3b82f6',
    progress: 100,
    modules: ['Qué es el sistema', 'Qué NO es', 'Cómo funciona'],
    badge: '🎯',
  },
  {
    id: 2,
    title: 'Cómo participar correctamente',
    desc: 'Usa el sistema con claridad y propósito.',
    color: '#60a5fa',
    progress: 60,
    modules: ['Uso del sistema', 'Activación', 'Beneficios'],
    badge: '⚡',
  },
  {
    id: 3,
    title: 'Cómo explicar Vicion',
    desc: 'Comunica con precisión y responsabilidad.',
    color: '#a78bfa',
    progress: 0,
    modules: ['Script base', 'Lenguaje correcto', 'Errores comunes'],
    badge: '💬',
  },
  {
    id: 4,
    title: 'Construcción de estructura',
    desc: 'Aprende a invitar, acompañar y crecer.',
    color: '#34d399',
    progress: 0,
    modules: ['Cómo invitar', 'Cómo acompañar', 'Cómo crecer'],
    badge: '🏗️',
  },
  {
    id: 5,
    title: 'Mentalidad de crecimiento',
    desc: 'Desarrolla visión de largo plazo.',
    color: '#f59e0b',
    progress: 0,
    modules: ['Constancia', 'Liderazgo', 'Proyección'],
    badge: '🧠',
  },
];

export default function DashAcademia() {
  const [selected, setSelected] = useState(null);

  const completed = courses.filter(c => c.progress === 100).length;
  const totalProgress = Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length);

  if (selected) {
    const course = courses.find(c => c.id === selected);
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)}
          style={{ color: '#3b82f6', fontSize: 13, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Volver a Academia
        </button>
        <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Video placeholder */}
          <div style={{ height: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '2px solid rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Play size={24} style={{ color: '#3b82f6', marginLeft: 3 }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Reproducir clase</p>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{course.badge}</span>
            </div>
            <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 6 }}>{course.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>{course.desc}</p>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Progreso del curso</span>
                <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>{course.progress}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${course.progress}%`, background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)', borderRadius: 3 }} />
              </div>
            </div>

            {/* Modules */}
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>MÓDULOS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {course.modules.map((mod, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: course.progress === 100 ? 'rgba(52,211,153,0.2)' : 'rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {course.progress === 100
                      ? <CheckCircle size={12} style={{ color: '#34d399' }} />
                      : <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{mod}</span>
                </div>
              ))}
            </div>

            {course.progress === 100 && (
              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center' }}>
                <p style={{ color: '#34d399', fontSize: 13, fontWeight: 700 }}>✓ Curso completado · Badge desbloqueado: {course.badge}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: 24 }}>
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 3, fontFamily: 'Montserrat,sans-serif', marginBottom: 4 }}>ACADEMIA VICION</p>
        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 6 }}>Aprende, desarrolla y escala dentro del sistema</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{completed} de {courses.length} cursos completados</p>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 14, maxWidth: 300 }}>
          <div style={{ height: '100%', width: `${totalProgress}%`, background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)', borderRadius: 3 }} />
        </div>
        <p style={{ color: '#3b82f6', fontSize: 11, marginTop: 5 }}>{totalProgress}% completado</p>
      </div>

      {/* Course grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {courses.map((course, i) => (
          <div key={course.id}
            onClick={() => setSelected(course.id)}
            style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: `1px solid ${course.progress === 100 ? 'rgba(52,211,153,0.3)' : 'rgba(59,130,246,0.18)'}`, borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{course.badge}</span>
              {course.progress === 100
                ? <CheckCircle size={16} style={{ color: '#34d399' }} />
                : course.progress > 0
                  ? <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>En curso</div>
                  : <Lock size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />}
            </div>
            <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, color: 'white', fontSize: 14, marginBottom: 5, lineHeight: 1.4 }}>{course.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{course.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
              {course.modules.map((mod, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChevronRight size={10} style={{ color: course.color, flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{mod}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${course.progress}%`, background: course.progress === 100 ? '#34d399' : `linear-gradient(90deg,${course.color},#60a5fa)`, borderRadius: 2 }} />
            </div>
            <p style={{ color: course.progress === 100 ? '#34d399' : 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 5 }}>{course.progress}% completado</p>
          </div>
        ))}
      </div>
    </div>
  );
}