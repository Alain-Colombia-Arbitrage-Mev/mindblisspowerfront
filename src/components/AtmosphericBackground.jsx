export default function AtmosphericBackground({ intensity = 'medium', children }) {
  const intensities = {
    light: { particles: 8, blurStrength: 4, noiseOpacity: 0.01 },
    medium: { particles: 12, blurStrength: 6, noiseOpacity: 0.015 },
    strong: { particles: 18, blurStrength: 8, noiseOpacity: 0.02 },
  };

  const config = intensities[intensity] || intensities.medium;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Gradient overlay dinámico */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, rgba(96, 165, 250, 0.05) 0%, transparent 60%)',
        }}
      />

      {/* Blur dinámico con filtro backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: `blur(${config.blurStrength}px)`,
          WebkitBackdropFilter: `blur(${config.blurStrength}px)`,
        }}
      />

      {/* Noise sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" /%3E%3C/filter%3E%3Crect width="400" height="400" filter="url(%23noiseFilter)" opacity="0.03"/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          opacity: config.noiseOpacity,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Partículas de luz muy suaves */}
      {[...Array(config.particles)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            background: `rgba(96, 165, 250, ${Math.random() * 0.4 + 0.1})`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-ambient ${12 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            filter: 'blur(1px)',
            boxShadow: `0 0 ${3 + Math.random() * 4}px rgba(96, 165, 250, 0.3)`,
          }}
        />
      ))}

      {/* Glow focal en puntos clave (3 puntos estratégicos) */}
      {[
        { x: '20%', y: '30%', color: '#3b82f6' },
        { x: '80%', y: '60%', color: '#60a5fa' },
        { x: '50%', y: '80%', color: '#1d6ef5' },
      ].map((glow, i) => (
        <div
          key={`glow-${i}`}
          style={{
            position: 'absolute',
            left: glow.x,
            top: glow.y,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${glow.color}20 0%, ${glow.color}10 30%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
            animation: `glow-pulse-subtle ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
        {children}
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes float-ambient {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-60px) translateX(0);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-30px) translateX(-15px);
            opacity: 0.4;
          }
        }

        @keyframes glow-pulse-subtle {
          0%, 100% {
            filter: blur(40px);
            opacity: 0.4;
          }
          50% {
            filter: blur(50px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}